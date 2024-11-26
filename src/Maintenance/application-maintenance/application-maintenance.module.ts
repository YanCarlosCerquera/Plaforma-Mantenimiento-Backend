import { Module } from '@nestjs/common';
import { ApplicationMaintenanceService } from './application-maintenance.service';
import { ApplicationMaintenanceController } from './application-maintenance.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MaintenanceRequest, MaintenanceRequestSchema } from './entities/application-maintenance.entity';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: MaintenanceRequest.name, schema: MaintenanceRequestSchema }]),
AssetsModule
],
  controllers: [ApplicationMaintenanceController],
  providers: [ApplicationMaintenanceService],
  exports:[MongooseModule]
})
export class ApplicationMaintenanceModule {}
