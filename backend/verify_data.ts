
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
    console.log('Checking database...');
    const areas = await prisma.serviceArea.findMany({
        include: { categories: { include: { services: true } } }
    });

    console.log(`Found ${areas.length} Service Areas.`);

    areas.forEach(area => {
        console.log(`Area: ${area.name}`);
        area.categories.forEach(cat => {
            console.log(`  Category: ${cat.name} (${cat.services.length} services)`);
            if (cat.services.length > 0) {
                console.log(`    First service: ${cat.services[0].name} [${cat.services[0].code}] - ${cat.services[0].price}`);
            }
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
