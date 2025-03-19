import { NestApplication, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });
  dotenv.config({ path: join(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`) });

  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true, 
  });
  
  app.useGlobalPipes(new ValidationPipe({
    
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  }));

  const PORT = parseInt(process.env.SERVER_PORT, 10) || 3000;


  const config = new DocumentBuilder()
    .setTitle('Sena')
    .setDescription('Proyecto Sena')
    .setVersion('1.0')
    .addTag('Sena')
    .addBearerAuth()  
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(PORT );
}
bootstrap();
