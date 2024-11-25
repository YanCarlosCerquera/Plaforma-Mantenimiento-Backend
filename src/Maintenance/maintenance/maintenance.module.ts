import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Maintenance, SchemaMaintenance } from './entities/maintenance.entity';
import { WordOrdenModule } from '../word_orden/word_orden.module';

@Module({
  imports: [MongooseModule.forFeature([{name: Maintenance.name, schema: SchemaMaintenance}]), MaintenanceModule ,WordOrdenModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
