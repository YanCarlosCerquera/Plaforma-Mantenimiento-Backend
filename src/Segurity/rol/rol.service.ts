import { Injectable } from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Rol } from './entities/rol.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';

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

  async findAll(filters?: UpdateRolDto): Promise<Rol[]> {
    return await this.rolModel.find(filters as unknown as RootFilterQuery<Rol>).populate({
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
  
    const groupedMenu = Object.values(
      data.views.reduce((acc: any, view: any) => {
        if (!view.moduloId) {
          // Manejar las vistas sin módulo aparte
          acc["noModule"] = acc["noModule"] || [];
          acc["noModule"].push({
            name: view.name,
            route: view.route,
          });
        } else {
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
        }
  
        return acc;
      }, {})
    );
  
    const noModuleViews = groupedMenu.find((item: any) => Array.isArray(item)) || [];
    const modules = groupedMenu.filter((item: any) => !Array.isArray(item));
  
    return {
      role: data.name,
      menu: [...noModuleViews, ...modules],
    };
  }
  

  async findName(name: string): Promise<Rol> {
    return await this.rolModel.findOne({ name: name })
  }
}  