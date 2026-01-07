
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const service = await prisma.service.findUnique({
        where: { code: 'OD001' }
    });

    if (service) {
        console.log('VALID_SERVICE_ID:', service.id);
    } else {
        console.log('Service OD001 not found. Checking any service...');
        const anyService = await prisma.service.findFirst();
        if (anyService) {
            console.log('VALID_SERVICE_ID:', anyService.id);
        } else {
            console.log('No services found at all.');
        }
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
