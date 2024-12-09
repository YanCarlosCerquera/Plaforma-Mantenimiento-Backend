import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApplicationMaintenanceService } from './application-maintenance.service';
import { CreateApplicationMaintenanceDto } from './dto/create-application-maintenance.dto';
import { UpdateApplicationMaintenanceDto } from './dto/update-application-maintenance.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { MaintenanceRequest } from './entities/application-maintenance.entity';

@Controller('application-maintenance')
export class ApplicationMaintenanceController extends GenericController<MaintenanceRequest ,CreateApplicationMaintenanceDto , UpdateApplicationMaintenanceDto> {
  constructor(private readonly applicationMaintenanceService: ApplicationMaintenanceService){
    super(applicationMaintenanceService);
  }

  @Get()
  async findAll() {
    return this.applicationMaintenanceService.consultarNumeroSerie();
  }

}
