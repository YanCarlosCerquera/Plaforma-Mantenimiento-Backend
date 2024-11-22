import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { Maintenance } from './entities/maintenance.entity';

@Controller('maintenance')
export class MaintenanceController extends GenericController<Maintenance, CreateMaintenanceDto, UpdateMaintenanceDto>{
  constructor(private readonly maintenanceService: MaintenanceService){
    super(maintenanceService)
  }
}