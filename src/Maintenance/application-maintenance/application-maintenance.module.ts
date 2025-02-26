import { Module } from '@nestjs/common';
import { ApplicationMaintenanceController } from './application-maintenance.controller';
import { ApplicationMaintenanceService } from './application-maintenance.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MaintenanceRequest, MaintenanceRequestSchema } from './entities/application-maintenance.entity';
import { AssetsModule } from '../assets/assets.module';
import { UsersModule } from 'src/users/users.module';
import { RolModule } from 'src/Segurity/rol/rol.module';
import { CategoriesModule } from '../categories/categories.module';
import { WssModule } from './wss.module';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MaintenanceRequest.name, schema: MaintenanceRequestSchema }
    ]),
    AssetsModule,
    UsersModule,
    RolModule,
    CategoriesModule,
    WssModule
  ],
  controllers: [ApplicationMaintenanceController],
  providers: [
    ApplicationMaintenanceService,
    NotificationService
  ],
  exports: [MongooseModule],
})
export class ApplicationMaintenanceModule {}
