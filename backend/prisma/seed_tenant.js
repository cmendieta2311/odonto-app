
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding default tenant...');

    const defaultTenantId = 'default';

    // Create or update the default tenant to ensure it exists before FK constraints
    const tenant = await prisma.tenant.upsert({
        where: { id: defaultTenantId },
        update: {},
        create: {
            id: defaultTenantId,
            name: 'Default Tenant',
            description: 'System default tenant',
            status: 'ACTIVE'
        },
    });

    console.log('Default tenant ensured:', tenant);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
