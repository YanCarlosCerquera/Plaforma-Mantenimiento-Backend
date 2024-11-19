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
import { TrainingCentersModule } from './parametrization/training-centers/training-centers.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost:4040/sena'), UsersModule , ModulosModule, RolModule, ViewsModule, AuthModule, DepartamentsModule, TrainingCentersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
