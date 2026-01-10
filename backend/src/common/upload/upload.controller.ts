import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { SystemConfigService } from '../../configuration/system-config/system-config.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('upload')
@UseGuards(AuthGuard('jwt'))
export class UploadController {
    constructor(
        private readonly storageService: StorageService,
        private readonly systemConfigService: SystemConfigService
    ) { }

    @Post('logo')
    @UseInterceptors(FileInterceptor('file'))
    async uploadLogo(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Validate file type
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif)$/)) {
            throw new BadRequestException('Only image files are allowed!');
        }

        const user = req.user as any;
        const tenantId = user?.tenantId || 'default';

        // Clean up old logo if exists
        try {
            const currentConfig = await this.systemConfigService.findAll(tenantId) as any; // Cast to any to access properties safely
            if (currentConfig && currentConfig.clinicLogoUrl) {
                const oldUrl = currentConfig.clinicLogoUrl;
                // Parse key from URL. Example: http://host:9000/sgodonto-public/default/logo.png
                // We need 'default/logo.png'
                // Or simply split by bucket name 'sgodonto-public/'
                const parts = oldUrl.split('sgodonto-public/');
                if (parts.length > 1) {
                    const key = parts[1];
                    await this.storageService.deleteFile(key);
                }
            }
        } catch (error) {
            console.error('Failed to cleanup old logo:', error);
            // Continue with upload even if cleanup fails
        }

        const fileName = `${tenantId}/logo_${Date.now()}_${file.originalname}`;
        const url = await this.storageService.uploadFile(file, fileName);

        // Update system config
        await this.systemConfigService.upsertMany({
            clinicLogoUrl: url
        }, tenantId);

        return { url };
    }
}
