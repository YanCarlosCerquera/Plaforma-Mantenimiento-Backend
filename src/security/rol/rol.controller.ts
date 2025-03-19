import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { Rol } from './entities/rol.entity';

@Controller('rol')
export class RolController extends GenericController<Rol,CreateRolDto, UpdateRolDto>{
  constructor(private readonly rolService: RolService) {
    super(rolService)
  }

}
