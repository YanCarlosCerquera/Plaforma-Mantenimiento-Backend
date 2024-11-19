import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ModulosService } from './modulos.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { GenericService } from 'src/Generic/generic.service';
import { Modulo } from './entities/modulo.entity';

@Controller('modulos')
export class ModulosController  extends GenericController<Modulo , CreateModuloDto>{
  constructor(private readonly modulosService: ModulosService) {
    super(modulosService)
  }
}