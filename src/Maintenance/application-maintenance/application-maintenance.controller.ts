import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApplicationMaintenanceService } from './application-maintenance.service';
import { CreateApplicationMaintenanceDto } from './dto/create-application-maintenance.dto';
import { UpdateApplicationMaintenanceDto } from './dto/update-application-maintenance.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { MaintenanceRequest } from './entities/application-maintenance.entity';
import { ApiQuery } from '@nestjs/swagger';
import { Public } from 'src/auth/auth/decorators/public.decorator';
import { Log } from 'src/auth/auth/decorators/log.decorator';
@Public()
@Log('solicitud de mantenimiento', '/mantenimientos')
@Controller('application-maintenance')
export class ApplicationMaintenanceController extends GenericController<MaintenanceRequest ,CreateApplicationMaintenanceDto , UpdateApplicationMaintenanceDto> {
  constructor(private readonly applicationMaintenanceService: ApplicationMaintenanceService){
    super(applicationMaintenanceService);
  }

 @Get('Consultar/:id')
async consultarPorId(@Param('id') id: string){

    return await this.applicationMaintenanceService.consultarPorId(id);
    }
 





  @Get('Filtro')
  @ApiQuery({ name: 'trackingNumber', required: false, type: String, description: 'Número de rastreo' })
  @ApiQuery({ name: 'serialNumber', required: false, type: String, description: 'Número de serie' })
  @ApiQuery({ name: 'estado', required: false, type: String, description: 'Estado del registro' })
  async filterByCriteria(
  @Query('trackingNumber') trackingNumber?: string,
  @Query('serialNumber') serialNumber?: string,
  @Query('estado') estado?: string,
) {
  if (!trackingNumber && !serialNumber && !estado) {
    throw new HttpException(
      { message: 'Al menos uno de los parámetros (trackingNumber, serialNumber, estado) es requerido.' },
      HttpStatus.BAD_REQUEST,
    );
  }

  // Crear filtros dinámicamente según los parámetros proporcionados
  const filters: { [key: string]: string } = {};
  if (trackingNumber) filters.trackingNumber = trackingNumber;
  if (serialNumber) filters.serialNumber = serialNumber;
  if (estado) filters.estado = estado;

  const result = await this.filter(filters);

  if (result.length === 0) {
    throw new HttpException(
      { message: 'No se encontraron resultados para los filtros proporcionados.' },
      HttpStatus.NOT_FOUND,
    );
  }

  return result;
}

@Get('statics')
async getStatics(){
  return await this.applicationMaintenanceService.getMaintenanceStatistics();
}

}