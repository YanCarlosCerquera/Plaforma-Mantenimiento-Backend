import { forwardRef, Module } from "@nestjs/common"
import { WorkReportService } from "./work_report.service"
import { WorkReportController } from "./work_report.controller"
import { MongooseModule } from "@nestjs/mongoose"
import { SchemaWorkReport, WorkReport } from "./entities/work_report.entity"
import { ApplicationMaintenanceModule } from "../application-maintenance/application-maintenance.module"
import { PdfService } from "./pdf/pdf.service"
import { WorkReportPdfService } from "./pdf/work-report-pdf.service"
import { OrdenesTrabajo, OrdenesTrabajoSchema } from "../word_orden/entities/word_orden.entity"

import { User, SchemaUser } from "src/users/entities/user.entity"
import { Assets, AssetsSchema } from "../assets/entities/asset.entity"
import { MaintenanceRequest, MaintenanceRequestSchema } from "../application-maintenance/entities/application-maintenance.entity"
import { Environment, EnvironmentSchema } from "src/environments/entities/environment.entity"
import { NotificationService } from "../application-maintenance/services/notification.service"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkReport.name, schema: SchemaWorkReport },
      { name: OrdenesTrabajo.name, schema: OrdenesTrabajoSchema },
      { name: MaintenanceRequest.name, schema: MaintenanceRequestSchema },
      { name: User.name, schema: SchemaUser },
      { name: Assets.name, schema: AssetsSchema },
      { name: Environment.name, schema: EnvironmentSchema },
    ]),
    forwardRef(() => ApplicationMaintenanceModule),
  ],
  controllers: [WorkReportController],
  providers: [WorkReportService, PdfService, WorkReportPdfService, NotificationService],
  exports: [MongooseModule, WorkReportService],
})
export class WorkReportModule {}

