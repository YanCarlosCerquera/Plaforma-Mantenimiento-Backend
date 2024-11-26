import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WordOrdenService } from './word_orden.service';
import { WordOrdenController } from './word_orden.controller';
import { OrdenesTrabajo, OrdenesTrabajoSchema } from './entities/word_orden.entity';
import { ApplicationMaintenanceModule } from '../application-maintenance/application-maintenance.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OrdenesTrabajo.name, schema: OrdenesTrabajoSchema }]),
    ApplicationMaintenanceModule, 
    ScheduleModule.forRoot()
  ],
  controllers: [WordOrdenController],
  providers: [WordOrdenService],
  exports:[MongooseModule]

})
export class WordOrdenModule {}