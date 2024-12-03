import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateApplicationMaintenanceDto } from './dto/create-application-maintenance.dto';
import { UpdateApplicationMaintenanceDto } from './dto/update-application-maintenance.dto';
import { GenericService } from 'src/Generic/generic.service';
import { MaintenanceRequest } from './entities/application-maintenance.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAssetDto } from '../assets/dto/create-asset.dto';
import { Assets } from '../assets/entities/asset.entity';
import { InfobipService } from './sms.service';
import { WssService } from './Wss.service';

@Injectable()
export class ApplicationMaintenanceService extends GenericService<MaintenanceRequest , CreateApplicationMaintenanceDto , UpdateApplicationMaintenanceDto> {
  constructor(
    @InjectModel(MaintenanceRequest.name) private MaintenanceModelo : Model<MaintenanceRequest>,
    @InjectModel(Assets.name) private asserModel : Model<Assets>,
    private infobipService: InfobipService,
    private WssSerice : WssService


  ){
    super(MaintenanceModelo)
  
  }
  
  async create(createDto: CreateApplicationMaintenanceDto): Promise<MaintenanceRequest> {
    await this.validarNumeroSeries(createDto);

    const createdItem = new this.MaintenanceModelo(createDto);
    const savedItem = await createdItem.save();

    const mensaje = `Nueva solicitud de mantenimiento creada. Número de seguimiento: ${savedItem.trackingNumber}`;
    try {
        await this.enviarNotificacionWhatsApp(savedItem, [mensaje]);
    } catch (error) {
        console.error(`Error enviando notificación para solicitud ${savedItem.trackingNumber}:`, error);
    }

    return savedItem;
}


    private async enviarNotificacionSMS(solicitud: MaintenanceRequest) {
      const mensaje = `Nueva solicitud de mantenimiento creada. Número de seguimiento: ${solicitud.trackingNumber}`;
      
      try {
        await this.infobipService.sendSms(solicitud.requesterPhone, mensaje);
        console.log(`Notificación SMS enviada para la solicitud ${solicitud.trackingNumber}`);
      } catch (error) {
        console.error(`Error al enviar notificación SMS para la solicitud ${solicitud.trackingNumber}:`, error);
      }
    }
    private async enviarNotificacionWhatsApp(solicitud: MaintenanceRequest, templateParams: string[]) {
      const mensaje = `Nueva solicitud de mantenimiento creada. Número de seguimiento: ${solicitud.trackingNumber}`;
      const cleanedParams = templateParams.filter((param) => param); // Remover nulos/vacíos
      try {
          await this.WssSerice.sendWhatsappTemplateMessage(solicitud.requesterPhone, mensaje || cleanedParams.join(' '));
          console.log(`Notificación WhatsApp enviada para la solicitud ${solicitud.trackingNumber}`);
      } catch (error) {
          console.error(`Error al enviar notificación WhatsApp para la solicitud ${solicitud.trackingNumber}:`, error);
      }
  
    }
  async validarNumeroSeries(
    dto: CreateApplicationMaintenanceDto | UpdateApplicationMaintenanceDto,
  ): Promise<void> {
    if (!dto.serialNumber) {
      throw new BadRequestException('El número de serie es obligatorio.');
    }
  
    // Validar si el serialNumber existe en el modelo de activos
    const asset = await this.asserModel.findOne({ serialNumber: dto.serialNumber });
  
    if (!asset) {
      throw new BadRequestException(
        `El número de serie '${dto.serialNumber}' no está registrado.`,
      );
    }
  
    // Validar si el trackingNumber ya existe (si aplica)
    if (dto.trackingNumber) {
      const existingRequest = await this.MaintenanceModelo.findOne({
        trackingNumber: dto.trackingNumber,
      });
  
      if (existingRequest) {
        throw new BadRequestException(
          `El número de seguimiento '${dto.trackingNumber}' ya está registrado.`,
        );
      }
    }
  
    console.log(
      `El número de serie '${dto.serialNumber}' es válido y está registrado.`,
    );
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