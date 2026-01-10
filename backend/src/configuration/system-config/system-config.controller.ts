import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('configuration/system')
@UseGuards(AuthGuard('jwt'))
export class SystemConfigController {
    constructor(private readonly configService: SystemConfigService) { }

    @Get()
    async findAll(@Req() req: Request) {
        const user = req.user as any;
        console.log('SystemConfigController findAll user:', user);
        try {
            return await this.configService.findAll(user?.tenantId);
        } catch (error) {
            console.error('Error in SystemConfigController findAll:', error);
            throw error;
        }
    }

    @Post()
    upsert(@Body() body: { [key: string]: any }, @Req() req: Request) {
        const user = req.user as any;
        return this.configService.upsertMany(body, user?.tenantId);
    }
}
