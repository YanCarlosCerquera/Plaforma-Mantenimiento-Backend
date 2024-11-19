import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { CityController } from './city.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Departament } from '../departaments/entities/departament.entity';
import { City, SchemaCity } from './entities/city.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: City.name, schema: SchemaCity }])],
  controllers: [CityController],
  providers: [CityService],
})
export class CityModule {}
