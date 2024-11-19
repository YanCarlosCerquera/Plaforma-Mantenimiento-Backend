import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist:true,
    transform:true,
    forbidNonWhitelisted:true,
    forbidUnknownValues: true,

  }));
  app.enableCors();


const config  = new DocumentBuilder()
        .setTitle('Sena')
        .setDescription('Proyecto Sena')
        .setVersion('1.0')
        .addTag('Sena')
        .build();

const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory)
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
