import { Injectable } from '@nestjs/common';
import { CreateApplicationMaintenanceDto } from './dto/create-application-maintenance.dto';
import { UpdateApplicationMaintenanceDto } from './dto/update-application-maintenance.dto';
import { GenericService } from 'src/Generic/generic.service';
import { MaintenanceRequest } from './entities/application-maintenance.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ApplicationMaintenanceService extends GenericService<MaintenanceRequest , CreateApplicationMaintenanceDto , UpdateApplicationMaintenanceDto> {
  constructor(@InjectModel(MaintenanceRequest.name) private MaintenanceModelo : Model<MaintenanceRequest>){
    super(MaintenanceModelo)
  
  }
  
  async ConsulatNumeroSAERIE() {
    return this.MaintenanceModelo.aggregate([
      {
        $lookup: {
          from: 'assets',
          localField: 'serialNumber',
          foreignField: 'serialNumber',
          as: 'assetInfo'
        }
      },
      {
        $unwind: '$assetInfo'
      },
      {
        $project: {
          requesterName: 1,
          requesterPhone: 1,
          trackingNumber: 1,
          serialNumber: 1,
          maintenanceType: 1,
          issueDescription: 1,
          workOrderStatus: 1,
          createdAt: 1,
          updatedAt: 1,
          assetInfo:1        }
      }
    ]);
  }

} 