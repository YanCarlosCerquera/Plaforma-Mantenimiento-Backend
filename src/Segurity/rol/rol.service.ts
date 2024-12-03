import { Injectable } from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Rol } from './entities/rol.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class RolService extends GenericService<Rol, CreateRolDto, UpdateRolDto> {

  constructor(@InjectModel(Rol.name) private rolModel: Model<Rol>,) {
    super(rolModel)
  }

  async findOne(id: string): Promise<Rol> {
    return await this.rolModel.findById(id).populate({
      path: 'views',
      select: 'name route',
      populate: {
        path: 'moduloId',
        select: 'name'
      }
    }).exec();
  }

  async findAll(): Promise<Rol[]> {
    return await this.rolModel.find().populate({
      path: 'views',
      select: 'name route',
      populate: {
        path: 'moduloId',
        select: 'name'
      }
    }).exec();
  }

  async menu(id: string): Promise<object> {
    const data = await this.findOne(id);
  
    if (!data || !data.views) {
      throw new Error(`El rol con ID ${id} no tiene vistas asociadas.`);
    }
  
    const menu = Object.values(
      data.views.reduce((acc: any, view: any) => {
        const moduloName = view.moduloId.name;
  
        if (!acc[moduloName]) {
          acc[moduloName] = {
            modulo: moduloName,
            views: [],
          };
        }
  
        acc[moduloName].views.push({
          name: view.name,
          route: view.route,
        });
  
        return acc;
      }, {})
    );
  
    return {
      role: data.name,
      menu,
    };
  }

  async findName(name: string): Promise<Rol> {
    return await this.rolModel.findOne({ name: name })
  }
}  