import { Module } from '@nestjs/common';
import { DepartamentsService } from './departaments.service';
import { DepartamentsController } from './departaments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Departament, SchemaDepartament } from './entities/departament.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Departament.name, schema: SchemaDepartament}])],
  controllers: [DepartamentsController],
  providers: [DepartamentsService],
})
export class DepartamentsModule {}
