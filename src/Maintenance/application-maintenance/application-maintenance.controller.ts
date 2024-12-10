import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpException, HttpStatus } from '@nestjs/common';
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

 
  @Get('Filtro')
  async filterByTrackingNumber(@Query('trackingNumber') trackingNumber?: string) {
    if (!trackingNumber) {
      throw new HttpException(
        { message: 'El parámetro trackingNumber es requerido.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.filter({ trackingNumber });

    if (result.length === 0) {
      throw new HttpException(
        { message: `No se encontraron resultados para el número de radicado: ${trackingNumber}` },
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }
}