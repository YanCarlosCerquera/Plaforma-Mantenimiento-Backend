import { Module } from '@nestjs/common';
import { ModulosService } from './modulos.service';
import { ModulosController } from './modulos.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Modulo, SchemaModulo } from './entities/modulo.entity';

@Module({
  imports:[
    MongooseModule.forFeature([{name : Modulo.name , schema:SchemaModulo}])],
  controllers: [ModulosController],
  providers: [ModulosService],
})
export class ModulosModule {}
