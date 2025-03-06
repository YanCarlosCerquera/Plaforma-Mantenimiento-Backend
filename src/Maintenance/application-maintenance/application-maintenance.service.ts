import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery, Types } from 'mongoose';
import { CreateApplicationMaintenanceDto } from './dto/create-application-maintenance.dto';
import { UpdateApplicationMaintenanceDto } from './dto/update-application-maintenance.dto';
import { GenericService } from 'src/Generic/generic.service';
import { MaintenanceRequest } from './entities/application-maintenance.entity';
import { Assets } from '../assets/entities/asset.entity';
import { User } from 'src/users/entities/user.entity';
import { Rol } from 'src/Segurity/rol/entities/rol.entity';
import { NotificationService } from './services/notification.service';

@Injectable()
export class ApplicationMaintenanceService extends GenericService<MaintenanceRequest, CreateApplicationMaintenanceDto, UpdateApplicationMaintenanceDto> {
  constructor(
    @InjectModel(MaintenanceRequest.name) private readonly maintenanceModel: Model<MaintenanceRequest>,
    @InjectModel(Assets.name) private readonly assetModel: Model<Assets>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Rol.name) private readonly roleModel: Model<Rol>,
    private readonly notificationService: NotificationService,
  ) {
    super(maintenanceModel);
  }

  async create(createDto: CreateApplicationMaintenanceDto): Promise<MaintenanceRequest> {
    try {
     
      await this.validateSerialNumber(createDto);
      const createdRequest = await this.createMaintenanceRequest(createDto);
      
      // Manejar notificaciones
      await this.handleMaintenanceNotifications(createdRequest);
      
      return createdRequest;
    } catch (error) {
      this.handleError(error, 'Error al crear la solicitud de mantenimiento');
    }
  }

  private async createMaintenanceRequest(dto: CreateApplicationMaintenanceDto): Promise<MaintenanceRequest> {
    try {
      const maintenanceRequest = new this.maintenanceModel(dto);
      return await maintenanceRequest.save();
    } catch (error) {
      throw new BadRequestException('Error al guardar la solicitud de mantenimiento');
    }
  }

  private async handleMaintenanceNotifications(maintenanceRequest: MaintenanceRequest): Promise<void> {
    try {
      const notifications = [];
      console.log('Iniciando proceso de notificaciones...');

      // 1. Buscar y notificar al encargado
      const userToNotify = await this.findUserToNotify(maintenanceRequest.serialNumber);
      if (userToNotify && userToNotify.phoneNumber) {
        console.log(`✉️ Preparando notificación para el encargado: ${userToNotify.name}`);
        notifications.push(
          this.notificationService.sendNotification({
            recipientName: userToNotify.name,
            recipientPhone: userToNotify.phoneNumber,
            trackingNumber: maintenanceRequest.trackingNumber,
            maintenanceType: maintenanceRequest.maintenanceType,
            description: maintenanceRequest.issueDescription,
            requesterName: maintenanceRequest.requesterName,
            isRequester: false
          })
        );
      } else {
        console.log('⚠️ No se encontró información del encargado para notificar');
      }

      // 2. Notificar al solicitante
      if (maintenanceRequest.requesterPhone && maintenanceRequest.requesterName) {
        console.log(`✉️ Preparando notificación para el solicitante: ${maintenanceRequest.requesterName}`);
        notifications.push(
          this.notificationService.sendNotification({
            recipientName: maintenanceRequest.requesterName,
            recipientPhone: maintenanceRequest.requesterPhone,
            trackingNumber: maintenanceRequest.trackingNumber,
            maintenanceType: maintenanceRequest.maintenanceType,
            description: maintenanceRequest.issueDescription,
            requesterName: maintenanceRequest.requesterName,
            isRequester: true
          })
        );
      } else {
        console.log('⚠️ No se encontró información del solicitante para notificar');
      }

      // Enviar todas las notificaciones
      if (notifications.length > 0) {
        await Promise.all(notifications);
        console.log(`✅ Se enviaron ${notifications.length} notificaciones exitosamente`);
      } else {
        console.log('⚠️ No se pudo enviar ninguna notificación');
      }

    } catch (error) {
      console.error('❌ Error al enviar notificaciones:', error);
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }

  private async findUserToNotify(serialNumber: string): Promise<{ phoneNumber: string; name: string } | null> {
    try {
      const result = await this.assetModel.aggregate([
        { 
          $match: { serialNumber } 
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        { 
          $unwind: '$category' 
        },
        {
          $lookup: {
            from: 'rols',
            localField: 'category.assignedRol',
            foreignField: '_id',
            as: 'role'
          }
        },
        { 
          $unwind: '$role' 
        },
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
        { 
          $unwind: '$user' 
        },
        {
          $project: {
            phoneNumber: '$user.phone',
            name: '$user.name'
          }
        }
      ]);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error al buscar usuario para notificar:', error);
      return null;
    }
  }

  private async validateSerialNumber(dto: CreateApplicationMaintenanceDto | UpdateApplicationMaintenanceDto): Promise<void> {
    if (!dto.serialNumber?.trim()) {
      throw new BadRequestException('El número de serie es obligatorio.');
    }

    const [asset, existingRequest] = await Promise.all([
      this.assetModel.findOne({ serialNumber: dto.serialNumber }),
      dto.trackingNumber ? this.maintenanceModel.findOne({ trackingNumber: dto.trackingNumber }) : null
    ]);

    if (!asset) {
      throw new BadRequestException(`El número de serie '${dto.serialNumber}' no está registrado.`);
    }

    if (existingRequest) {
      throw new BadRequestException(`El número de seguimiento '${dto.trackingNumber}' ya está registrado.`);
    }
  }

  async consultarPorId(id: string) {
    try {
      const objectId = new Types.ObjectId(id);
      const result = await this.maintenanceModel.aggregate([
        {
          $match: { _id: objectId }
        },
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
          $lookup: {
            from: 'trainingcenters',
            localField: 'assetInfo.trainingCenterId',
            foreignField: '_id',
            as: 'trainingCenterInfo'
          }
        },
        {
          $addFields: {
            'assetInfo.trainingCenterId': {
              $map: {
                input: '$trainingCenterInfo',
                as: 'tc',
                in: {
                  id: '$$tc._id',
                  name: '$$tc.name'
                }
              }
            }
          }
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
            assetInfo: {
              _id: 1,
              image: 1,
              name: 1,
              location: 1,
              acquisitionDate: 1,
              brand: 1,
              modelo: 1,
              equipmentType: 1,
              trainingCenterId: 1,
              serialNumber: 1,
              inventoryCode: 1,
              accountHolder: 1,
              categoryId: 1,
              manufacturer: 1,
              supplier: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1
            }
          }
        }
      ]);

      if (!result.length) {
        throw new BadRequestException('Solicitud de mantenimiento no encontrada');
      }

      return result[0];
    } catch (error) {
      this.handleError(error, 'Error al consultar la solicitud de mantenimiento');
    }
  }

  private handleError(error: any, defaultMessage: string) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    console.error(defaultMessage, error);
    throw new BadRequestException(defaultMessage);
  }

  async getMaintenanceStatistics(): Promise<{}>{
    const allMaintenance = await this.maintenanceModel.find().exec();
    const total = allMaintenance.length;
    const completed = allMaintenance.filter(m => m.workOrderStatus === true).length;
    const pending = allMaintenance.filter(m => m.workOrderStatus === false).length;

    return {
      All: total,
      Executed: completed,
      Pending: pending
    };
  }

}