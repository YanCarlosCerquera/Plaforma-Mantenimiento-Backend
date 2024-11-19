import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DependeceService } from './dependece.service';
import { CreateDependeceDto } from './dto/create-dependece.dto';
import { UpdateDependeceDto } from './dto/update-dependece.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { Dependece } from './entities/dependece.entity';

@Controller('dependece')
export class DependeceController extends GenericController<Dependece , CreateDependeceDto , UpdateDependeceDto> {
  constructor(private readonly dependeceService: DependeceService) {
    super(dependeceService);
  }

}
