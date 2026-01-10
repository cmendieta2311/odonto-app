import { NestFactory } from '@nestjs/core';
// Force reload
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.setGlobalPrefix('api/v1');
  const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : [];
  if (!corsOrigins.includes('http://localhost:4200')) {
    corsOrigins.push('http://localhost:4200');
  }

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Application is running on: 0.0.0.0:${process.env.PORT ?? 3000} (Accessible via Docker Network)`);
}
bootstrap();
