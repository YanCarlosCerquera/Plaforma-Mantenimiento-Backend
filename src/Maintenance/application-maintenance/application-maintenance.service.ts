import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateApplicationMaintenanceDto } from './dto/create-application-maintenance.dto';
import { UpdateApplicationMaintenanceDto } from './dto/update-application-maintenance.dto';
import { GenericService } from 'src/Generic/generic.service';
import { MaintenanceRequest } from './entities/application-maintenance.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAssetDto } from '../assets/dto/create-asset.dto';
import { Assets } from '../assets/entities/asset.entity';

@Injectable()
export class ApplicationMaintenanceService extends GenericService<MaintenanceRequest , CreateApplicationMaintenanceDto , UpdateApplicationMaintenanceDto> {
  constructor(
    @InjectModel(MaintenanceRequest.name) private MaintenanceModelo : Model<MaintenanceRequest>,
    @InjectModel(Assets.name) private asserModel : Model<Assets>

  ){
    super(MaintenanceModelo)
  
  }
  
  async create(createDto: CreateApplicationMaintenanceDto): Promise<MaintenanceRequest> {
    await this.ValidarNumeroSeries(createDto);
    const createdItem = new this.MaintenanceModelo(createDto);
    const savedItem = await createdItem.save();
    //await this.asserModel.findByIdAndUpdate(createDto.solicitud.solicitudId, { workOrderStatus: true });
    return savedItem;


  }

  async ValidarNumeroSeries(
    dto: CreateApplicationMaintenanceDto | UpdateApplicationMaintenanceDto,
  ): Promise<void> {
    if (dto.serialNumber) {
      const asset = await this.asserModel.findOne({ serialNumber: dto.serialNumber });
  
      if (!asset) {
        throw new BadRequestException(
          `El número de serie '${dto.serialNumber}' no está registrado.`,
        );
      }
  
      console.log(`El número de serie '${dto.serialNumber}' es válido y está registrado.`);
    } else {
      throw new BadRequestException('El número de serie es obligatorio.');
    }
    
  
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