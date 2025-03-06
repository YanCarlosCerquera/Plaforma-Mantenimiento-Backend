import { forwardRef, Module } from '@nestjs/common';
import { WorkReportService } from './work_report.service';
import { WorkReportController } from './work_report.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SchemaWorkReport, WorkReport } from './entities/work_report.entity';
import { ApplicationMaintenanceModule } from '../application-maintenance/application-maintenance.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WorkReport.name, schema: SchemaWorkReport }]),
    forwardRef(() => ApplicationMaintenanceModule),
  ],
  controllers: [WorkReportController],
  providers: [WorkReportService],
  exports: [MongooseModule, WorkReportService],
})
export class WorkReportModule {}

