import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DepartamentsService } from './departaments.service';
import { CreateDepartamentDto } from './dto/create-departament.dto';
import { UpdateDepartamentDto } from './dto/update-departament.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { Departament } from './entities/departament.entity';

@Controller('departaments')
export class DepartamentsController extends GenericController<Departament, CreateDepartamentDto, UpdateDepartamentDto>{
  constructor(private readonly departamentsService: DepartamentsService) {
    super(departamentsService)
  }
}
