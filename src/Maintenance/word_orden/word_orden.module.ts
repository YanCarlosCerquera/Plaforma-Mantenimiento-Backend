import { Module, forwardRef } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { WordOrdenService } from "./word_orden.service"
import { WordOrdenController } from "./word_orden.controller"
import { OrdenesTrabajo, OrdenesTrabajoSchema } from "./entities/word_orden.entity"
import { ApplicationMaintenanceModule } from "../application-maintenance/application-maintenance.module"
import { ScheduleModule } from "@nestjs/schedule"
import { UsersModule } from "src/users/users.module"
import { AssetsModule } from "../assets/assets.module"
import { MaintenanceModule } from "../maintenance/maintenance.module"
import { WorkReportModule } from "../work_report/work_report.module"
import { NotificationService } from "../application-maintenance/services/notification.service"

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OrdenesTrabajo.name, schema: OrdenesTrabajoSchema }]),
    forwardRef(() => ApplicationMaintenanceModule), 
    forwardRef(() => UsersModule),
    forwardRef(() => AssetsModule),
    forwardRef(() => MaintenanceModule), 
    forwardRef(() => WorkReportModule),
    ScheduleModule.forRoot(),
  ],
  controllers: [WordOrdenController],
  providers: [WordOrdenService],
  exports: [MongooseModule, WordOrdenService],
})
export class WordOrdenModule {}