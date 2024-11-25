import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WordOrdenService } from './word_orden.service';
import { WordOrdenController } from './word_orden.controller';
import { OrdenesTrabajo, OrdenesTrabajoSchema } from './entities/word_orden.entity';
import { ApplicationMaintenanceModule } from '../application-maintenance/application-maintenance.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OrdenesTrabajo.name, schema: OrdenesTrabajoSchema }]),
    ApplicationMaintenanceModule, // Import the module that contains MaintenanceRequestModel
  ],
  controllers: [WordOrdenController],
  providers: [WordOrdenService],
})
export class WordOrdenModule {}