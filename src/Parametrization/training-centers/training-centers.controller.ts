import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrainingCentersService } from './training-centers.service';
import { CreateTrainingCenterDto } from './dto/create-training-center.dto';
import { UpdateTrainingCenterDto } from './dto/update-training-center.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { TrainingCenter } from './entities/training-center.entity';

@Controller('training-centers')
export class TrainingCentersController extends GenericController<TrainingCenter, CreateTrainingCenterDto, UpdateTrainingCenterDto>{
  constructor(private readonly trainingCentersService: TrainingCentersService){
    super(trainingCentersService)
  }
}
