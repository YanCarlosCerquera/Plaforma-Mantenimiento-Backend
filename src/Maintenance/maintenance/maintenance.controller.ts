import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { Maintenance } from './entities/maintenance.entity';
import { Public } from 'src/auth/auth/decorators/public.decorator';
import { Log } from 'src/auth/auth/decorators/log.decorator';
@Public()
@Log('mantenimientos', '/mantenimientos')
@Controller('maintenance')
export class MaintenanceController extends GenericController<Maintenance, CreateMaintenanceDto, UpdateMaintenanceDto>{
  constructor(private readonly maintenanceService: MaintenanceService){
    super(maintenanceService)
  }
  @Get()
  findAll() {
    return this.maintenanceService.findAll();
  }
}