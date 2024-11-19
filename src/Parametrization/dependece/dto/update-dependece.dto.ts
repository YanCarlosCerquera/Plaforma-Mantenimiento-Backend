import { PartialType } from '@nestjs/swagger';
import { CreateDependeceDto } from './create-dependece.dto';

export class UpdateDependeceDto extends PartialType(CreateDependeceDto) {}
