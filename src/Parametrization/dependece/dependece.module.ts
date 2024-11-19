import { Module } from '@nestjs/common';
import { DependeceService } from './dependece.service';
import { DependeceController } from './dependece.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Dependece, SchemaDepende } from './entities/dependece.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Dependece.name, schema: SchemaDepende }])],
  controllers: [DependeceController],
  providers: [DependeceService],
})
export class DependeceModule {}
