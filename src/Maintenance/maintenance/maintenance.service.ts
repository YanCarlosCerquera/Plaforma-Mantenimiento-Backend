import { Injectable } from '@nestjs/common';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Maintenance } from './entities/maintenance.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MaintenanceService extends GenericService<Maintenance, CreateMaintenanceDto, UpdateMaintenanceDto>{
  constructor(@InjectModel(Maintenance.name)private maintenanceModel: Model<Maintenance>){
    super(maintenanceModel)
  }
}
