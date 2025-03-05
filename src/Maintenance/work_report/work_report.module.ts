import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { WorkReportController } from "./work_report.controller"
import { WorkReportService } from "./work_report.service"
import { WorkReport, SchemaWorkReport } from "./entities/work_report.entity"

@Module({
  imports: [MongooseModule.forFeature([{ name: WorkReport.name, schema: SchemaWorkReport }])],
  controllers: [WorkReportController],
  providers: [WorkReportService],
  exports: [MongooseModule, WorkReportService],
})
export class WorkReportModule {}

