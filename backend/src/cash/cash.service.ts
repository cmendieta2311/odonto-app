import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { CashMovementType } from '@prisma/client';

@Injectable()
export class CashService {
    constructor(private prisma: PrismaService) { }

    async findAllRegisters() {
        const registers = await this.prisma.cashRegister.findMany({
            where: { tenantId: 'default', isActive: true }
        });

        if (registers.length === 0) {
            const def = await this.prisma.cashRegister.create({
                data: {
                    name: 'Caja General',
                    tenantId: 'default'
                }
            });
            return [def];
        }

        return registers;
    }

    private async resolveRegisterId(cashRegisterId?: string): Promise<string> {
        if (cashRegisterId) return cashRegisterId;
        const registers = await this.findAllRegisters();
        return registers[0].id; // Default
    }

    async create(data: CreateCashMovementDto & { userId?: string, cashRegisterId?: string }) {
        const registerId = await this.resolveRegisterId(data.cashRegisterId);

        // Find Active Session
        const session = await this.prisma.cashSession.findFirst({
            where: {
                cashRegisterId: registerId,
                status: 'OPEN',
                tenantId: 'default'
            }
        });

        // Allow OPENING movement even if no session (it creates the session technically, but flow creates session first)
        // Actually, preventing movement if no session is safer, except for OPENING.
        if (!session && data.type !== CashMovementType.OPENING) {
            throw new BadRequestException('No hay una caja abierta para registrar movimientos.');
        }

        // Create Movement
        const movement = await this.prisma.cashMovement.create({
            data: {
                ...data,
                cashRegisterId: registerId,
                cashSessionId: session?.id,
                tenantId: 'default',
            },
        });

        // Update Session Balance
        if (session) {
            let balanceChange = 0;
            if (data.type === CashMovementType.INCOME) balanceChange = Number(data.amount);
            if (data.type === CashMovementType.EXPENSE) balanceChange = -Number(data.amount);

            if (balanceChange !== 0) {
                await this.prisma.cashSession.update({
                    where: { id: session.id },
                    data: {
                        currentBalance: { increment: balanceChange }
                    }
                });
            }
        }

        return movement;
    }

    async findAll(date?: string, cashRegisterId?: string, cashSessionId?: string) {
        const registerId = await this.resolveRegisterId(cashRegisterId);
        const where: any = {
            tenantId: 'default',
            cashRegisterId: registerId
        };

        if (cashSessionId) {
            where.cashSessionId = cashSessionId;
        } else if (date) {
            const startOfDay = new Date(`${date}T00:00:00.000Z`);
            const endOfDay = new Date(`${date}T23:59:59.999Z`);

            where.date = { gte: startOfDay, lte: endOfDay };
        } else {
            // If no date and no sessionId, default to current open session OR today.
            const session = await this.prisma.cashSession.findFirst({
                where: { cashRegisterId: registerId, status: 'OPEN' }
            });
            if (session) {
                where.cashSessionId = session.id;
            } else {
                const startToday = new Date();
                startToday.setHours(0, 0, 0, 0);
                where.date = { gte: startToday };
            }
        }

        return this.prisma.cashMovement.findMany({
            where,
            orderBy: { date: 'desc' },
            include: { user: true }
        });
    }

    async getDailySummary(date: string, cashRegisterId?: string) {
        // Aggregation across sessions for a specific day?
        // Or just raw movements aggregation?
        // Keeping it simple: Raw aggregation by Date
        const registerId = await this.resolveRegisterId(cashRegisterId);
        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        const where = {
            tenantId: 'default',
            cashRegisterId: registerId,
            date: { gte: startOfDay, lte: endOfDay }
        };

        const movements = await this.prisma.cashMovement.findMany({ where });

        const income = movements
            .filter(m => m.type === CashMovementType.INCOME)
            .reduce((sum, m) => sum + Number(m.amount), 0);

        const expense = movements
            .filter(m => m.type === CashMovementType.EXPENSE)
            .reduce((sum, m) => sum + Number(m.amount), 0);

        // Balance here is just income - expense for the day?
        // Or should it include Openings?
        // UI expects 'Day Balance', usually Net Flow.

        return { income, expense, balance: income - expense };
    }

    async getCashStatus(date?: string, cashRegisterId?: string) {
        const registerId = await this.resolveRegisterId(cashRegisterId);

        let session;

        if (date) {
            // Find session covering this date? Or active on that date?
            // "History" usually wants the summary of that day.
            // But with Sessions, "Status" is ambiguous for a past date if multiple sessions exists.
            // Let's return the LAST session of that day.
            const startOfDay = new Date(`${date}T00:00:00.000Z`);
            const endOfDay = new Date(`${date}T23:59:59.999Z`);

            session = await this.prisma.cashSession.findFirst({
                where: {
                    cashRegisterId: registerId,
                    startTime: { gte: startOfDay, lte: endOfDay }
                },
                orderBy: { startTime: 'desc' },
                include: { openedBy: true, closedBy: true }
            });
        } else {
            // Current Status: Active Session OR Last Closed Session
            session = await this.prisma.cashSession.findFirst({
                where: { cashRegisterId: registerId },
                orderBy: { startTime: 'desc' },
                include: { openedBy: true, closedBy: true }
            });
        }

        if (!session) {
            return {
                isOpen: false, isClosed: false,
                startBalance: 0, currentBalance: 0,
                income: 0, expense: 0
            };
        }

        // Calculate Income/Expense for this session
        // We can aggreg in DB
        const movements = await this.prisma.cashMovement.findMany({
            where: { cashSessionId: session.id }
        });

        const income = movements.filter(m => m.type === CashMovementType.INCOME).reduce((s, m) => s + Number(m.amount), 0);
        const expense = movements.filter(m => m.type === CashMovementType.EXPENSE).reduce((s, m) => s + Number(m.amount), 0);

        return {
            id: session.id,
            isOpen: session.status === 'OPEN',
            isClosed: session.status === 'CLOSED',
            openingTime: session.startTime,
            closingTime: session.endTime,
            startBalance: Number(session.startBalance),
            currentBalance: Number(session.currentBalance), // Live balance
            income,
            expense,
            openedBy: session.openedBy?.name,
            closedBy: session.closedBy?.name
        };
    }

    async openCash(initialAmount: number, userId: string, cashRegisterId?: string) {
        const registerId = await this.resolveRegisterId(cashRegisterId);

        // Check if open
        const existing = await this.prisma.cashSession.findFirst({
            where: { cashRegisterId: registerId, status: 'OPEN' }
        });
        if (existing) throw new BadRequestException('Esta Caja ya está abierta');

        // Create Session
        const session = await this.prisma.cashSession.create({
            data: {
                cashRegisterId: registerId,
                openedById: userId,
                startBalance: initialAmount,
                currentBalance: initialAmount,
                status: 'OPEN',
                tenantId: 'default'
            }
        });

        // Create Movement
        await this.create({
            type: CashMovementType.OPENING,
            amount: initialAmount,
            description: 'Apertura de Caja',
            paymentMethod: 'CASH' as any,
            userId,
            cashRegisterId: registerId,
            // Link directly, create method handles session lookup but we just made it.
            // Wait, create method looks up active session.
            // Since we just created it, it should find it.
        });

        return session;
    }

    async closeCash(cashRegisterId?: string, userId?: string) {
        const registerId = await this.resolveRegisterId(cashRegisterId);

        const session = await this.prisma.cashSession.findFirst({
            where: { cashRegisterId: registerId, status: 'OPEN' }
        });

        if (!session) throw new BadRequestException('Esta Caja no está abierta');

        // Create Closing Movement
        await this.create({
            type: CashMovementType.CLOSING,
            amount: Number(session.currentBalance), // Use current balance before closing
            description: 'Cierre de Caja',
            paymentMethod: 'CASH' as any,
            userId,
            cashRegisterId: registerId
        });

        const updated = await this.prisma.cashSession.update({
            where: { id: session.id },
            data: {
                status: 'CLOSED',
                endTime: new Date(),
                closedById: userId
            }
        });

        return updated;
    }

    async getHistory(limit = 10, cashRegisterId?: string) {
        const registerId = await this.resolveRegisterId(cashRegisterId);

        const sessions = await this.prisma.cashSession.findMany({
            where: { cashRegisterId: registerId },
            orderBy: { startTime: 'desc' },
            take: limit,
            include: { openedBy: true, closedBy: true }
        });

        // Map to format suitable for frontend history
        return sessions.map(session => ({
            id: session.id,
            date: session.startTime, // For sorting/display
            startTime: session.startTime,
            endTime: session.endTime,
            startBalance: Number(session.startBalance),
            finalBalance: Number(session.currentBalance),
            status: session.status, // OPEN, CLOSED
            openedBy: session.openedBy?.name,
            closedBy: session.closedBy?.name,
            // We might want income/expense summary here too?
            // It requires aggregations. For performance, maybe skip or aggreg on demand?
            // Let's do simple query if limit is small.
        }));
    }
}
