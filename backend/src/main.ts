import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security & Middleware
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Allow Vite
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, x-tenant-id',
    credentials: true,
  });
  app.use(cookieParser());

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip non-whitelisted properties
      transform: true, // transform payloads to DTO instances
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('SaaS API - Manajemen Pesantren')
    .setDescription('Full API documentation for the multi-tenant SaaS application.')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
