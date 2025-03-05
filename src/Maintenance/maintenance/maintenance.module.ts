import { Module, forwardRef } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { MaintenanceController } from "./maintenance.controller"
import { MaintenanceService } from "./maintenance.service"
import { Maintenance, SchemaMaintenance } from "./entities/maintenance.entity"
import { WordOrdenModule } from "../word_orden/word_orden.module"
import { UsersModule } from "src/users/users.module"

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Maintenance.name, schema: SchemaMaintenance }]),
    UsersModule,
    forwardRef(() => WordOrdenModule),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MongooseModule, MaintenanceService],
})
export class MaintenanceModule {}

