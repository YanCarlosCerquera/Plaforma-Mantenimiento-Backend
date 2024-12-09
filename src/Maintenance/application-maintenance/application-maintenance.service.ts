import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateApplicationMaintenanceDto } from './dto/create-application-maintenance.dto';
import { UpdateApplicationMaintenanceDto } from './dto/update-application-maintenance.dto';
import { GenericService } from 'src/Generic/generic.service';
import { MaintenanceRequest } from './entities/application-maintenance.entity';
import { Assets } from '../assets/entities/asset.entity';
import { User } from 'src/users/entities/user.entity';
import { Rol } from 'src/Segurity/rol/entities/rol.entity';
import { InfobipService } from './sms.service';
import { UltraMsgService } from './Wss.service';
import axios from 'axios';


@Injectable()
export class ApplicationMaintenanceService extends GenericService<MaintenanceRequest, CreateApplicationMaintenanceDto, UpdateApplicationMaintenanceDto> {
  private readonly telegramToken = "7327782691:AAFRGmwrwReJPE9d3DRqBXoZDVKPZ1XgMZY"
  private readonly chatId = "-1002352603720"

  constructor(
    @InjectModel(MaintenanceRequest.name) private maintenanceModel: Model<MaintenanceRequest>,
    @InjectModel(Assets.name) private assetModel: Model<Assets>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Rol.name) private roleModel: Model<Rol>,
    private infobipService: InfobipService,
    private wssService: UltraMsgService
  ) {
    super(maintenanceModel);
  }

  async create(createDto: CreateApplicationMaintenanceDto): Promise<MaintenanceRequest> {
    await this.validarNumeroSeries(createDto);

    const createdItem = new this.maintenanceModel(createDto);
    const savedItem = await createdItem.save();

    try {
      const userToNotify = await this.findUserToNotify(savedItem.serialNumber);
      if (userToNotify) {
/*         await this.enviarNotificacionSMS(savedItem, userToNotify.phoneNumber, userToNotify.name, false);
 */        await this.enviarNotificacionWhatsApp(savedItem, userToNotify.phoneNumber, userToNotify.name, true);
        await this.enviarNotificacionTelegram(savedItem, userToNotify.name);

        if (savedItem.requesterPhone) {
/*           await this.enviarNotificacionSMS(savedItem, savedItem.requesterPhone, savedItem.requesterName, true);
 */          await this.enviarNotificacionWhatsApp(savedItem, savedItem.requesterPhone, savedItem.requesterName, true);
        }
      } else {
        console.log(`No se encontró un usuario para notificar para la solicitud ${savedItem.trackingNumber}`);
      }
    } catch (error) {
      console.error(`Error al procesar la notificación para la solicitud ${savedItem.trackingNumber}:`, error);
    }

    return savedItem;
  }

  private async findUserToNotify(serialNumber: string): Promise<{ phoneNumber: string; name: string } | null> {
    const result = await this.assetModel.aggregate([
      { $match: { serialNumber } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $lookup: {
          from: 'rols',
          localField: 'category.assignedRol',
          foreignField: '_id',
          as: 'role'
        }
      },
      { $unwind: '$role' },
      {
        $lookup: {
          from: 'users',
          let: { roleId: '$role._id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$assignedRol', '$$roleId'] }
              }
            }
          ],
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          phoneNumber: '$user.phone',
          name: '$user.name'
        }
      }
    ]);

    if (result.length === 0) {
      console.log(`No se encontró un usuario para notificar para el número de serie ${serialNumber}`);
      return null;
    }

    return result[0];
  }

  private async enviarNotificacionSMS(solicitud: MaintenanceRequest, phone: string, name: string, isRequester: boolean) {
    const mensaje = isRequester
      ? `Hola ${name}, su solicitud de mantenimiento ha sido recibida y está siendo procesada.
       Detalles:
       - Número de Seguimiento: ${solicitud.trackingNumber}
       - Tipo de Mantenimiento: ${solicitud.maintenanceType}
       - Descripción: ${solicitud.issueDescription.substring(0, 50)}...
       Le mantendremos informado sobre el progreso.`
      : `Hola ${name}, se le ha asignado una nueva solicitud de mantenimiento.
       Detalles:
       - Número de Seguimiento: ${solicitud.trackingNumber}
       - Tipo de Mantenimiento: ${solicitud.maintenanceType}
       - Descripción: ${solicitud.issueDescription.substring(0, 50)}...
       - Solicitante: ${solicitud.requesterName}
       Por favor, revise y atienda esta solicitud lo antes posible.`;

    const fullMessage = `${mensaje}
  Para más información: https://t.me/+iFfUv76--XtjNzlh`;

    try {
      await this.infobipService.sendSms(phone, fullMessage);
      console.log(`Notificación SMS enviada para la solicitud ${solicitud.trackingNumber} al número ${phone}`);
    } catch (error) {
      console.error(`Error al enviar notificación SMS para la solicitud ${solicitud.trackingNumber}:`, error);
    }
  }

  private async enviarNotificacionWhatsApp(solicitud: MaintenanceRequest, phone: string, name: string, isRequester: boolean) {
    const mensaje = isRequester
      ? `Hola ${name}, su solicitud de mantenimiento ha sido recibida y está siendo procesada.
       Detalles:
       - Número de Seguimiento: ${solicitud.trackingNumber}
       - Tipo de Mantenimiento: ${solicitud.maintenanceType}
       - Descripción: ${solicitud.issueDescription.substring(0, 50)}...
       Le mantendremos informado sobre el progreso.`
      : `Hola ${name}, se le ha asignado una nueva solicitud de mantenimiento.
       Detalles:
       - Número de Seguimiento: ${solicitud.trackingNumber}
       - Tipo de Mantenimiento: ${solicitud.maintenanceType}
       - Descripción: ${solicitud.issueDescription.substring(0, 50)}...
       - Solicitante: ${solicitud.requesterName}
       Por favor, revise y atienda esta solicitud lo antes posible.`;

    const fullMessage = `${mensaje}
  Para más información: https://t.me/+iFfUv76--XtjNzlh`;

    try {
      await this.wssService.sendMessage(phone, fullMessage);
      console.log(`Notificación WhatsApp enviada para la solicitud ${solicitud.trackingNumber} al número ${phone}`);
    } catch (error) {
      console.error(`Error al enviar notificación WhatsApp para la solicitud ${solicitud.trackingNumber}:`, error);
    }
  }

  async validarNumeroSeries(dto: CreateApplicationMaintenanceDto | UpdateApplicationMaintenanceDto): Promise<void> {
    if (!dto.serialNumber) {
      throw new BadRequestException('El número de serie es obligatorio.');
    }

    const asset = await this.assetModel.findOne({ serialNumber: dto.serialNumber });

    if (!asset) {
      throw new BadRequestException(`El número de serie '${dto.serialNumber}' no está registrado.`);
    }

    if (dto.trackingNumber) {
      const existingRequest = await this.maintenanceModel.findOne({
        trackingNumber: dto.trackingNumber,
      });

      if (existingRequest) {
        throw new BadRequestException(`El número de seguimiento '${dto.trackingNumber}' ya está registrado.`);
      }
    }

    console.log(`El número de serie '${dto.serialNumber}' es válido y está registrado.`);
  }

  async consultarNumeroSerie() {
    return this.maintenanceModel.aggregate([
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
          assetInfo: 1
        }
      }
    ]);
  }

  private async enviarNotificacionTelegram(solicitud: MaintenanceRequest, name: string): Promise<void> {
    const mensaje = `
    Hola ${name},
    Se ha creado una nueva solicitud de mantenimiento con los siguientes detalles: 
    - Número de seguimiento: ${solicitud.trackingNumber}
    - Tipo de Mantenimiento: ${solicitud.maintenanceType}
    - Descripción: ${solicitud.issueDescription}
    - Solicitante: ${solicitud.requesterName}
    - Estado: ${solicitud.workOrderStatus}
    
    Para más información, por favor, visita el bot: 
    https://t.me/SeneaProyectobot
  `;

    try {
      await axios.post(`https://api.telegram.org/bot${this.telegramToken}/sendMessage`, {
        chat_id: this.chatId,
        text: mensaje
      });
      console.log(`Notificación enviada al grupo o usuario en Telegram`);
    } catch (error) {
      console.error(`Error al enviar notificación por Telegram para la solicitud ${solicitud.trackingNumber}:`, error);
    }
  }
}

