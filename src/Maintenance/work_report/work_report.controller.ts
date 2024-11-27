import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkReportService } from './work_report.service';
import { CreateWorkReportDto } from './dto/create-work_report.dto';
import { UpdateWorkReportDto } from './dto/update-work_report.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { WorkReport } from './entities/work_report.entity';

@Controller('work-report')
export class WorkReportController extends GenericController<WorkReport , CreateWorkReportDto,UpdateWorkReportDto> {
  constructor(private readonly workReportService: WorkReportService) {
    super(workReportService)
  }

}
