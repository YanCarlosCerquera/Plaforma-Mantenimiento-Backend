import { PartialType } from '@nestjs/swagger';
import { CreateWordOrdenDto } from './create-word_orden.dto';

export class UpdateWordOrdenDto extends PartialType(CreateWordOrdenDto) {}
