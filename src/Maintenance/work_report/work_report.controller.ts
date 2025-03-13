import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, BadRequestException, UploadedFile, Query, Res } from '@nestjs/common';
import { WorkReportService } from './work_report.service';
import { CreateWorkReportDto } from './dto/create-work_report.dto';
import { UpdateWorkReportDto } from './dto/update-work_report.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { WorkReport } from './entities/work_report.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose';
import { Response } from 'express';

@Controller('work-report')
export class WorkReportController extends GenericController<WorkReport , CreateWorkReportDto,UpdateWorkReportDto> {
  constructor(private readonly workReportService: WorkReportService) {
    super(workReportService)
  }     
  @Get("Informes")
  async obtenerInformes() {
    return await this.workReportService.obtenerInformesConDetalles();

  }

  @Get() 
  async findAllWithDetails(
      @Query('instructorId') instructorId?: string,
      @Query('tecnicoId') tecnicoId?: string,
    ) {
      return await this.workReportService.findAllDetails(instructorId, tecnicoId);
  }
  

  @Get('maintenanceHistory/:serialNumber')
  async maintenanceHistory(@Param('serialNumber') serialNumber: string){
    return await this.workReportService.maintenanceHistory(serialNumber)
  }
  @Get("pdf/:id")
  async generatePDF(@Param('id') id: string, @Res() res: Response) {
    await this.workReportService.generateReportPDF(id, res)
  }
}