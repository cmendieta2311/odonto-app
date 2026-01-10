import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function check() {
    const tenant = await prisma.tenant.findUnique({ where: { id: 'default' } });
    console.log('Default Tenant:', tenant);
}
check();
