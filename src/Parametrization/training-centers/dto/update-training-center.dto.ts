import { PartialType } from '@nestjs/swagger';
import { CreateTrainingCenterDto } from './create-training-center.dto';

export class UpdateTrainingCenterDto extends PartialType(CreateTrainingCenterDto) {}
