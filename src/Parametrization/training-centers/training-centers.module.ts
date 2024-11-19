import { Module } from '@nestjs/common';
import { TrainingCentersService } from './training-centers.service';
import { TrainingCentersController } from './training-centers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SchemaTrainingCenter, TrainingCenter } from './entities/training-center.entity';

@Module({
  imports: [MongooseModule.forFeature([{name: TrainingCenter.name, schema: SchemaTrainingCenter}])],
  controllers: [TrainingCentersController],
  providers: [TrainingCentersService],
})
export class TrainingCentersModule {}
