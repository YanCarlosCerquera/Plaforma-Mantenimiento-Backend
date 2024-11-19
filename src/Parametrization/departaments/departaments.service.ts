import { Injectable } from '@nestjs/common';
import { CreateDepartamentDto } from './dto/create-departament.dto';
import { UpdateDepartamentDto } from './dto/update-departament.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Departament } from './entities/departament.entity';

@Injectable()
export class DepartamentsService extends GenericService<Departament, CreateDepartamentDto, UpdateDepartamentDto>{
  
}
