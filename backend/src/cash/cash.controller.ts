import { Body, Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CashService } from './cash.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';

@Controller('cash')
export class CashController {
    constructor(private readonly cashService: CashService) { }

    @Get('registers')
    getRegisters() {
        return this.cashService.findAllRegisters();
    }

    @Post('movements')
    create(@Body() createCashMovementDto: CreateCashMovementDto) {
        return this.cashService.create(createCashMovementDto);
    }

    @Get('movements')
    findAll(@Query('date') date?: string, @Query('cashRegisterId') cashRegisterId?: string, @Query('cashSessionId') cashSessionId?: string) {
        return this.cashService.findAll(date, cashRegisterId, cashSessionId);
    }

    @Get('summary')
    getSummary(@Query('date') date: string, @Query('cashRegisterId') cashRegisterId?: string) {
        // If no date provided, default to today
        const queryDate = date || new Date().toISOString();
        return this.cashService.getDailySummary(queryDate, cashRegisterId);
    }

    @Get('status')
    getStatus(@Query('date') date?: string, @Query('cashRegisterId') cashRegisterId?: string) {
        return this.cashService.getCashStatus(date, cashRegisterId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('open')
    openCash(@Body() body: { initialAmount: number, cashRegisterId?: string }, @Request() req) {
        return this.cashService.openCash(body.initialAmount || 0, req.user.userId, body.cashRegisterId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('close')
    closeCash(@Body() body: { cashRegisterId?: string }, @Request() req) {
        return this.cashService.closeCash(body?.cashRegisterId, req.user.userId);
    }

    @Get('history')
    getHistory(@Query('cashRegisterId') cashRegisterId?: string) {
        return this.cashService.getHistory(7, cashRegisterId);
    }
}
