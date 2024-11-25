import { Module } from '@nestjs/common';
import { ApplicationMaintenanceService } from './application-maintenance.service';
import { ApplicationMaintenanceController } from './application-maintenance.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MaintenanceRequest, MaintenanceRequestSchema } from './entities/application-maintenance.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: MaintenanceRequest.name, schema: MaintenanceRequestSchema }])],
  controllers: [ApplicationMaintenanceController],
  providers: [ApplicationMaintenanceService],
  exports:[MongooseModule]
})
export class ApplicationMaintenanceModule {}
