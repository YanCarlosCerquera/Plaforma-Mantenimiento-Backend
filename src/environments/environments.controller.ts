import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { Environment } from './entities/environment.entity';

@Controller('environments')
export class EnvironmentsController extends GenericController<Environment , CreateEnvironmentDto , UpdateEnvironmentDto>{
  constructor(private readonly environmentsService: EnvironmentsService) {
    super(environmentsService)
  }
}
