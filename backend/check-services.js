
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const services = await prisma.service.findMany();
    console.log('Services found:', services);
    if (services.length > 0) {
        console.log('VALID_SERVICE_ID:', services[0].id);
    } else {
        console.log('No services found. Creating one...');
        const newService = await prisma.service.create({
            data: {
                name: 'Registro Odontograma',
                code: 'ODO-REG',
                price: 0,
                description: 'Registro automático del odontograma',
                status: 'ACTIVE'
            }
        });
        console.log('VALID_SERVICE_ID:', newService.id);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
