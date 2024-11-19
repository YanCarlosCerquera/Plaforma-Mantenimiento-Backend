import { Injectable } from '@nestjs/common';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { GenericService } from 'src/Generic/generic.service';
import { City } from './entities/city.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CityModule } from './city.module';

@Injectable()
export class CityService extends GenericService<City , CreateCityDto , UpdateCityDto>{  

constructor(@InjectModel(City.name) private CityModel : Model<City>){
  super(CityModel);
}

async findOne(id: string): Promise<City> {
  return await this.CityModel.findById(id)
    .populate('departamentId', 'name') 
    .exec();
}

async findAll(): Promise<City[]> {
  return await this.CityModel.find()
    .populate('departamentId', 'name')
    .exec();
}
}