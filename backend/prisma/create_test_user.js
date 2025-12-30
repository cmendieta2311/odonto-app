
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const email = 'test_debug@test.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword, role: 'ADMIN', tenantId: 'default' },
        create: {
            email,
            password: hashedPassword,
            name: 'Debug User',
            role: 'ADMIN',
            tenantId: 'default'
        },
    });

    console.log('Test user created:', user.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
