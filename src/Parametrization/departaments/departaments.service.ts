import { Injectable } from '@nestjs/common';
import { CreateDepartamentDto } from './dto/create-departament.dto';
import { UpdateDepartamentDto } from './dto/update-departament.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Departament } from './entities/departament.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class DepartamentsService extends GenericService<Departament, CreateDepartamentDto, UpdateDepartamentDto>{
  constructor(@InjectModel(Departament.name) private departamentModel: Model<Departament> ){
    super(departamentModel)
  }
}
