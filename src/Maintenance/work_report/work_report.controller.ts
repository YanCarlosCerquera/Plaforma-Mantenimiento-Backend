import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, BadRequestException, UploadedFile } from '@nestjs/common';
import { WorkReportService } from './work_report.service';
import { CreateWorkReportDto } from './dto/create-work_report.dto';
import { UpdateWorkReportDto } from './dto/update-work_report.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { WorkReport } from './entities/work_report.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('work-report')
export class WorkReportController extends GenericController<WorkReport , CreateWorkReportDto,UpdateWorkReportDto> {
  constructor(private readonly workReportService: WorkReportService) {
    super(workReportService)
  }
  @Post('upload-pdf/:orderId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File, 
    @Param('orderId') orderId: string 
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded'); 
    }
    return this.workReportService.createFromPDF(file.buffer, orderId); 
  }
}