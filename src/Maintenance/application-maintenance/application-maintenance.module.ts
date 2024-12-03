import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaintenanceRequest, MaintenanceRequestSchema } from './entities/application-maintenance.entity';
import { AssetsModule } from '../assets/assets.module';
import { SmsModule } from './sms.module';
import { ApplicationMaintenanceController } from './application-maintenance.controller';
import { ApplicationMaintenanceService } from './application-maintenance.service';
import { WssModule } from './wss.module';  // Importa WssModule aquí

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MaintenanceRequest.name, schema: MaintenanceRequestSchema }]),
    AssetsModule,
    SmsModule,
    WssModule,  
  ],
  controllers: [ApplicationMaintenanceController],
  providers: [ApplicationMaintenanceService],
  exports: [MongooseModule],
})
export class ApplicationMaintenanceModule {}
