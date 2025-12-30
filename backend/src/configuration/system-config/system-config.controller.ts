import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('configuration/system')
@UseGuards(AuthGuard('jwt'))
export class SystemConfigController {
    constructor(private readonly configService: SystemConfigService) { }

    @Get()
    findAll() {
        return this.configService.findAll();
    }

    @Post()
    upsert(@Body() body: { [key: string]: any }) {
        return this.configService.upsertMany(body);
    }
}
