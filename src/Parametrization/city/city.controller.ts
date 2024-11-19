import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CityService } from './city.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { City } from './entities/city.entity';

@Controller('city')
export class CityController extends GenericController<City , CreateCityDto ,UpdateCityDto>{
  constructor(private readonly cityService: CityService) {
    super(cityService)
  }

}
