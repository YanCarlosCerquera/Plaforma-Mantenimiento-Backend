import { Injectable } from '@nestjs/common';
import { CreateViewDto } from './dto/create-view.dto';
import { UpdateViewDto } from './dto/update-view.dto';
import { GenericService } from 'src/Generic/generic.service';
import { View } from './entities/view.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ViewsService extends GenericService<View, CreateViewDto, UpdateViewDto>{
  
  constructor(@InjectModel(View.name)private viewModel: Model<View>, ){
    super(viewModel)
  }

  async findOne(id: string): Promise<View> {
    return await this.viewModel.findById(id).populate('moduloId', 'name').exec()
  }

  async findAll(): Promise <View[]> {
    return await this.viewModel.find().populate('moduloId', 'name').exec()
  }
}
