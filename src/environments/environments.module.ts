import { Module } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { EnvironmentsController } from './environments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Environment, EnvironmentSchema } from './entities/environment.entity';

@Module({
  imports :[MongooseModule.forFeature([{ name : Environment.name , schema : EnvironmentSchema}])],
  controllers: [EnvironmentsController],
  providers: [EnvironmentsService],
})
export class EnvironmentsModule {}
