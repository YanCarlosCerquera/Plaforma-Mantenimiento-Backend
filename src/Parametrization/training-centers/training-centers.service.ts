import { Injectable } from '@nestjs/common';
import { CreateTrainingCenterDto } from './dto/create-training-center.dto';
import { UpdateTrainingCenterDto } from './dto/update-training-center.dto';
import { GenericService } from 'src/Generic/generic.service';
import { TrainingCenter } from './entities/training-center.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TrainingCentersService extends GenericService<TrainingCenter, CreateTrainingCenterDto, UpdateTrainingCenterDto>{
  constructor(@InjectModel(TrainingCenter.name)private trainingModel: Model<TrainingCenter> ){
    super(trainingModel)
  }

  async findAll(): Promise<TrainingCenter[]> {
    return await this.trainingModel.find().populate({
      path: 'cityId',
      select: 'name',
      populate: {
        path: 'departamentId',
        select: 'name'
      }
    }).exec()
  }

  async findOne(id: string): Promise<TrainingCenter> {
    return await this.trainingModel.findById(id).populate({
      path: 'cityId',
      select: 'name',
      populate: {
        path: 'departamentId',
        select: 'name'
      }
    }).exec()
  }
}
