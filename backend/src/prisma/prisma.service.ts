import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://sgodonto:password123@localhost:5432/sgodonto_db?schema=public';
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
