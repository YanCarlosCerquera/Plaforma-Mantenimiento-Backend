import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { ModulosModule } from './Segurity/modulos/modulos.module';
import { RolModule } from './Segurity/rol/rol.module';
import { ViewsModule } from './Segurity/views/views.module';
import { AuthModule } from './auth/auth/auth.module';
import { DepartamentsModule } from './Parametrization/departaments/departaments.module';
import { CityModule } from './Parametrization/city/city.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost:27017/sena'), UsersModule , ModulosModule, RolModule, ViewsModule, AuthModule, DepartamentsModule,CityModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
