import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Seed Default Tenant
    await prisma.tenant.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            name: 'Clinica Dental Default',
            description: 'Tenant por defecto',
            status: 'ACTIVE',
        },
    });

    const adminEmail = 'admin@sgodonto.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Administrador',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log({ admin });

    // Seed Person Document Types
    const documentTypes = [
        { code: 'CI', name: 'Cédula de Identidad' },
        { code: 'RUC', name: 'Registro Único del Contribuyente' },
        { code: 'PASS', name: 'Pasaporte' },
    ];

    for (const doc of documentTypes) {
        await prisma.personDocumentType.upsert({
            where: {
                tenantId_code: {
                    tenantId: 'default',
                    code: doc.code,
                },
            },
            update: {
                name: doc.name,
            },
            create: {
                tenantId: 'default',
                code: doc.code,
                name: doc.name,
            },
        });
    }

    // Seed Service Areas & Categories
    const catalog = [
        {
            area: 'Operatoria dental',
            categories: [
                {
                    name: 'Restauraciones anteriores',
                    services: [
                        { code: 'OD001', name: 'Resina Simple Anterior', price: 150000, type: 'CONSULTORIO' },
                        { code: 'OD002', name: 'Resina Compuesta Anterior', price: 200000, type: 'CONSULTORIO' }
                    ]
                },
                {
                    name: 'Restauraciones posteriores (consultorio)',
                    services: [
                        { code: 'OD003', name: 'Resina Simple Posterior', price: 180000, type: 'CONSULTORIO' }
                    ]
                },
                {
                    name: 'Restauraciones posteriores (laboratorio)',
                    services: [
                        { code: 'OD004', name: 'Incrustación Cerámica', price: 800000, type: 'LABORATORIO' }
                    ]
                },
                {
                    name: 'Otras restauraciones',
                    services: []
                }
            ]
        },
        {
            area: 'Ortodoncia',
            categories: [
                {
                    name: 'Estudios previos',
                    services: [
                        { code: 'OR001', name: 'Estudio Cefalométrico', price: 300000, type: 'TERCERIZADO' }
                    ]
                },
                {
                    name: 'Instalación',
                    services: [
                        { code: 'OR002', name: 'Instalación Brackets', price: 1500000, type: 'CONSULTORIO' }
                    ]
                },
                {
                    name: 'Convencional',
                    services: [
                        { code: 'OR003', name: 'Mantenimiento Mensual', price: 200000, type: 'CONSULTORIO' }
                    ]
                },
                {
                    name: 'Autoligado',
                    services: [
                        { code: 'OR004', name: 'Mantenimiento Autoligado', price: 300000, type: 'CONSULTORIO' }
                    ]
                }
            ]
        }
    ];

    for (const areaData of catalog) {
        const area = await prisma.serviceArea.upsert({
            where: { name: areaData.area },
            update: {},
            create: {
                name: areaData.area,
                tenantId: 'default'
            }
        });

        for (const catData of areaData.categories) {
            const category = await prisma.serviceCategory.upsert({
                where: { name: catData.name },
                update: {
                    areaId: area.id
                },
                create: {
                    name: catData.name,
                    areaId: area.id,
                    tenantId: 'default'
                }
            });

            for (const srvData of catData.services) {
                await prisma.service.upsert({
                    where: { code: srvData.code },
                    update: {
                        name: srvData.name,
                        price: srvData.price,
                        type: srvData.type as any,
                        categoryId: category.id,
                    },
                    create: {
                        name: srvData.name,
                        code: srvData.code,
                        price: srvData.price,
                        type: srvData.type as any,
                        categoryId: category.id,
                        tenantId: 'default'
                    }
                });
            }
        }
    }

    console.log('Seeded Service Catalog (Areas -> Categories -> Services)');

    // Seed System Config
    const configs = [
        {
            key: 'clinic_info',
            value: {
                ruc: '9999999-9',
                email: '',
                phone: '',
                address: '',
                businessName: 'Mi Consultorio',
            },
            description: 'Información general de la clínica',
        },
        {
            key: 'billing_config',
            value: {
                taxRate: 10,
                currency: 'PYG',
                electronicBilling: false,
                allowedInstallments: [1, 3, 6, 12, 24],
                defaultExpirationDays: 7,
                calculateInterest: true,
                interestRate: 10,
            },
            description: 'Configuración de facturación y cobros',
        },
    ];

    for (const config of configs) {
        await prisma.systemConfig.upsert({
            where: {
                tenantId_key: {
                    tenantId: 'default',
                    key: config.key,
                },
            },
            update: {
                value: config.value as any, // Cast to any to avoid JsonValue issues if strict
                description: config.description,
            },
            create: {
                tenantId: 'default',
                key: config.key,
                value: config.value as any,
                description: config.description,
            },
        });
    }
    console.log('Seeded System Configurations');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
