import { Injectable } from '@nestjs/common';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Modulo } from './entities/modulo.entity';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ModulosService extends GenericService<Modulo , CreateModuloDto, UpdateModuloDto>{

  constructor(@InjectModel(Modulo.name) private modeloModel : Model<Modulo>){
    super(modeloModel)
  }
}