import { Module } from '@nestjs/common';
import { WorkReportService } from './work_report.service';
import { WorkReportController } from './work_report.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SchemaWorkReport, WorkReport } from './entities/work_report.entity';

@Module({
  imports: [MongooseModule.forFeature([{name: WorkReport.name, schema: SchemaWorkReport}])],
  controllers: [WorkReportController],
  providers: [WorkReportService],
})
export class WorkReportModule {}
