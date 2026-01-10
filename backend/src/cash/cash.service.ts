import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { CashMovementType } from '@prisma/client';

@Injectable()
export class CashService {
    constructor(private prisma: PrismaService) { }

    private getDateRange(dateStr: string) {
        // Extract YYYY-MM-DD
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;

        // Construct UTC range
        const startOfDay = new Date(`${datePart}T00:00:00.000Z`);
        const endOfDay = new Date(`${datePart}T23:59:59.999Z`);

        return { startOfDay, endOfDay };
    }

    async create(data: CreateCashMovementDto & { userId?: string }) {
        return this.prisma.cashMovement.create({
            data: {
                ...data,
                tenantId: 'default', // TODO: Get from context user
            },
        });
    }

    async findAll(date?: string) {
        const where: any = {
            tenantId: 'default',
        };

        if (date) {
            const { startOfDay, endOfDay } = this.getDateRange(date);
            where.date = {
                gte: startOfDay,
                lte: endOfDay,
            };
        }

        return this.prisma.cashMovement.findMany({
            where,
            orderBy: {
                date: 'desc',
            },
        });
    }

    async getDailySummary(date: string) {
        const { startOfDay, endOfDay } = this.getDateRange(date);

        const movements = await this.prisma.cashMovement.findMany({
            where: {
                tenantId: 'default',
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });

        const income = movements
            .filter((m) => m.type === CashMovementType.INCOME)
            .reduce((sum, m) => sum + Number(m.amount), 0);

        const expense = movements
            .filter((m) => m.type === CashMovementType.EXPENSE)
            .reduce((sum, m) => sum + Number(m.amount), 0);

        return {
            income,
            expense,
            balance: income - expense, // This balance is simplistic, for real cash mgmt we need opening balance
        };
    }

    async getCashStatus(date: string) {
        const { startOfDay, endOfDay } = this.getDateRange(date);

        const movements = await this.prisma.cashMovement.findMany({
            where: {
                tenantId: 'default',
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: { user: true }, // Include user relation
            orderBy: { date: 'asc' },
        });

        // Determine status based on the LAST structural movement (OPENING or CLOSING)
        const structuralMovements = movements.filter(m =>
            m.type === CashMovementType.OPENING || m.type === CashMovementType.CLOSING
        );
        const lastStructural = structuralMovements[structuralMovements.length - 1];

        const isOpen = lastStructural?.type === CashMovementType.OPENING;
        const isClosed = lastStructural?.type === CashMovementType.CLOSING;

        // Get Opening User Name if open
        let openedBy: string | undefined = undefined;
        if (isOpen && lastStructural.user) {
            openedBy = lastStructural.user.name;
        }

        // Daily totals (regardless of sessions)
        const dailyIncome = movements
            .filter((m) => m.type === CashMovementType.INCOME)
            .reduce((sum, m) => sum + Number(m.amount), 0);

        const dailyExpense = movements
            .filter((m) => m.type === CashMovementType.EXPENSE)
            .reduce((sum, m) => sum + Number(m.amount), 0);

        // Session specific calculations
        let startBalance = 0;
        let currentBalance = 0;
        let openingTime: Date | undefined = undefined;
        let closingTime: Date | undefined = undefined;

        if (isOpen) {
            openingTime = lastStructural.date;
            startBalance = Number(lastStructural.amount);

            // Calculate balance for THIS session only
            // Movements strictly AFTER the last opening
            const sessionMovements = movements.filter(m => m.date > lastStructural.date);

            const sessionIncome = sessionMovements
                .filter(m => m.type === CashMovementType.INCOME)
                .reduce((sum, m) => sum + Number(m.amount), 0);

            const sessionExpense = sessionMovements
                .filter(m => m.type === CashMovementType.EXPENSE)
                .reduce((sum, m) => sum + Number(m.amount), 0);

            currentBalance = startBalance + sessionIncome - sessionExpense;
        } else if (isClosed) {
            closingTime = lastStructural.date;
            // If closed, current balance is effectively 0 in the drawer
            currentBalance = 0;
            startBalance = 0;
        }

        return {
            isOpen,
            isClosed,
            openingTime,
            closingTime,
            startBalance,
            income: dailyIncome,
            expense: dailyExpense,
            currentBalance,
            openedBy
        };
    }

    async openCash(initialAmount: number, userId?: string) {
        // Check if currently open
        const status = await this.getCashStatus(new Date().toISOString());
        if (status.isOpen) throw new BadRequestException('Caja ya abierta');
        // Allow opening if it is closed or not started (isClosed false and isOpen false)

        return this.create({
            type: CashMovementType.OPENING,
            amount: initialAmount,
            description: 'Apertura de Caja',
            paymentMethod: 'CASH' as any,
            userId
        });
    }

    async closeCash() {
        const status = await this.getCashStatus(new Date().toISOString());
        if (!status.isOpen) throw new BadRequestException('No hay caja abierta para cerrar');

        return this.create({
            type: CashMovementType.CLOSING,
            amount: status.currentBalance,
            description: 'Cierre de Caja',
            paymentMethod: 'CASH' as any
        });
    }

    async getHistory(limit = 7) {
        // Get last N days with activity
        // This is a bit complex with raw Prisma.
        // Simplified approach: Get distinct dates from movements, then calculate summary for each.
        // Or just return `CashMovement` of type CLOSING which contains the final balance?
        // But we want income/expense too.
        // Let's iterate back N days.

        const history: any[] = [];
        const today = new Date();

        for (let i = 0; i < limit; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Optimization: check if any movement exists first
            // ... skipping optimization for simplicity now

            const summary = await this.getDailySummary(dateStr);
            const status = await this.getCashStatus(dateStr);

            // Only add if there was activity (balance != 0 or movements > 0)
            // But getDailySummary calculates from movements.
            // If income=0, expense=0, likely no activity.
            if (summary.income > 0 || summary.expense > 0 || status.isClosed) {
                history.push({
                    date: dateStr,
                    ...summary,
                    isClosed: status.isClosed,
                    finalBalance: status.currentBalance
                });
            }
        }

        return history;
    }
}
