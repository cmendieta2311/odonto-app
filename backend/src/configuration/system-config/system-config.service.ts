import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemConfigService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        // Return key-value map for easier frontend consumption
        const configs = await this.prisma.systemConfig.findMany();
        return configs.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }

    async upsertMany(data: { [key: string]: any }) {
        const promises = Object.keys(data).map((key) => {
            return this.prisma.systemConfig.upsert({
                where: {
                    tenantId_key: {
                        tenantId: 'default', // Using default tenant for now as per schema logic
                        key: key,
                    },
                },
                update: {
                    value: data[key],
                },
                create: {
                    tenantId: 'default',
                    key: key,
                    value: data[key],
                },
            });
        });

        await Promise.all(promises);
        return this.findAll();
    }
}
