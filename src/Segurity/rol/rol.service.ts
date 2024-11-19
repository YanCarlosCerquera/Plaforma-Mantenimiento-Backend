import { Injectable } from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Rol } from './entities/rol.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class RolService extends GenericService<Rol,CreateRolDto, UpdateRolDto>{

  constructor(@InjectModel(Rol.name)private rolModel: Model<Rol>, ){
    super(rolModel)
  }

  async findOne(id: string): Promise<Rol> {
    return await this.rolModel.findById(id).populate('views', 'name').exec();
  }

  async findAll(): Promise<Rol[]> {
    return await this.rolModel.find().populate({ 
      path: 'views',
      select: 'name',
      populate: {
        path: 'moduloId',
        select: 'name'
      }
    }).exec();
  }
}
