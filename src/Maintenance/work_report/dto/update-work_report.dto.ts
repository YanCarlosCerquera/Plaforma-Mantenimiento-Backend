import { PartialType } from '@nestjs/swagger';
import { CreateWorkReportDto } from './create-work_report.dto';

export class UpdateWorkReportDto extends PartialType(CreateWorkReportDto) {}
