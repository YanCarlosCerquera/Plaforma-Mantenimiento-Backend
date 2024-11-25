import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WordOrdenService } from './word_orden.service';
import { CreateWordOrdenDto } from './dto/create-word_orden.dto';
import { UpdateWordOrdenDto } from './dto/update-word_orden.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { OrdenesTrabajo } from './entities/word_orden.entity';

@Controller('word-orden')
export class WordOrdenController extends GenericController <OrdenesTrabajo , CreateWordOrdenDto , UpdateWordOrdenDto>{
  constructor(private readonly wordOrdenService: WordOrdenService) {
    super(wordOrdenService);
  }
  @Get('with-details')
  findAllWithDetails() {
    return this.wordOrdenService.findAllWithDetails();
  }
}
