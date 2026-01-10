import { Module } from '@nestjs/common';
import { StorageService } from './storage/storage.service';
import { UploadController } from './upload/upload.controller';
import { SystemConfigModule } from '../configuration/system-config/system-config.module';

@Module({
    imports: [SystemConfigModule],
    controllers: [UploadController],
    providers: [StorageService],
    exports: [StorageService]
})
export class CommonModule { }
