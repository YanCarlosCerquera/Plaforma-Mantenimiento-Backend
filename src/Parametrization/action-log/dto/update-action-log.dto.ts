import { PartialType } from '@nestjs/swagger';
import { CreateActionLogDto } from './create-action-log.dto';

export class UpdateActionLogDto extends PartialType(CreateActionLogDto) {}
