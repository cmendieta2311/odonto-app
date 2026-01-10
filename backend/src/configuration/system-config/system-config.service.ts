import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemConfigService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string = 'default') {
        const configs = await this.prisma.systemConfig.findMany({
            where: { tenantId }
        });
        return configs.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }

    async upsertMany(data: { [key: string]: any }, tenantId: string = 'default') {
        const promises = Object.keys(data).map((key) => {
            return this.prisma.systemConfig.upsert({
                where: {
                    tenantId_key: {
                        tenantId: tenantId,
                        key: key,
                    },
                },
                update: {
                    value: data[key],
                },
                create: {
                    tenantId: tenantId,
                    key: key,
                    value: data[key],
                },
            });
        });

        await Promise.all(promises);
        return this.findAll(tenantId);
    }
}
