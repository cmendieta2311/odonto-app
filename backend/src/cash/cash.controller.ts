import { Body, Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CashService } from './cash.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';

@Controller('cash')
export class CashController {
    constructor(private readonly cashService: CashService) { }

    @Post('movements')
    create(@Body() createCashMovementDto: CreateCashMovementDto) {
        return this.cashService.create(createCashMovementDto);
    }

    @Get('movements')
    findAll(@Query('date') date?: string) {
        return this.cashService.findAll(date);
    }

    @Get('summary')
    getSummary(@Query('date') date: string) {
        // If no date provided, default to today
        const queryDate = date || new Date().toISOString();
        return this.cashService.getDailySummary(queryDate);
    }

    @Get('status')
    getStatus(@Query('date') date: string) {
        const queryDate = date || new Date().toISOString();
        return this.cashService.getCashStatus(queryDate);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('open')
    openCash(@Body() body: { initialAmount: number }, @Request() req) {
        return this.cashService.openCash(body.initialAmount || 0, req.user.userId);
    }

    @Post('close')
    closeCash() {
        return this.cashService.closeCash();
    }

    @Get('history')
    getHistory() {
        return this.cashService.getHistory(); // Default 7 days
    }
}
