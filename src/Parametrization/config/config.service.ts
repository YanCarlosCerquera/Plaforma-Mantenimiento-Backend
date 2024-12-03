import { Injectable } from '@nestjs/common';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Config } from './entities/config.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ConfigService extends GenericService<Config, CreateConfigDto, UpdateConfigDto>{
  constructor(@InjectModel(Config.name) private configModel: Model<Config>){
    super(configModel)
  }

  async findEmailConfig() {
    const config = await this.configModel.findOne().exec();
    if(!config){
      throw new Error('Configuracion no encontrada')
    }
    return config.emailConfig;
  }
}
