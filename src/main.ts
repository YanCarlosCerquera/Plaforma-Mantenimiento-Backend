import { NestApplication, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { RoleGuard } from './auth/auth/guards/role/role.guard';
import { AuthGuard } from './auth/auth/guards/auth/auth.guard';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  app.enableCors();
   app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    
  }));

  const config = new DocumentBuilder()
    .setTitle('Sena')
    .setDescription('Proyecto Sena')
    .setVersion('1.0')
    .addTag('Sena')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory)
  await app.listen(3000
  );
}
bootstrap();
