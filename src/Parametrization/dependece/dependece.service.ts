import { Injectable } from '@nestjs/common';
import { CreateDependeceDto } from './dto/create-dependece.dto';
import { UpdateDependeceDto } from './dto/update-dependece.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Dependece, DependeceDocumet } from './entities/dependece.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class DependeceService extends GenericService<Dependece , CreateDependeceDto , UpdateDependeceDto> {
  constructor(@InjectModel(Dependece.name) private DependeModel : Model<DependeceDocumet>){
    super(DependeModel);
  }
  async findOne(id: string): Promise<Dependece> {
    return await this.DependeModel.findById(id)
      .populate('TrainingCenterId', 'name  regional') 
      .exec();
  }
  
  async findAll(): Promise<Dependece[]> {
    return await this.DependeModel.find()
      .populate('TrainingCenterId', 'name  regional')
      .exec();
  }
  }
