import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateWordOrdenDto } from './dto/create-word_orden.dto';
import { UpdateWordOrdenDto } from './dto/update-word_orden.dto';
import { GenericService } from 'src/Generic/generic.service';
import { OrdenesTrabajo } from './entities/word_orden.entity';
import { MaintenanceRequest } from 'src/Maintenance/application-maintenance/entities/application-maintenance.entity';
import { Cron } from '@nestjs/schedule';
import { User } from 'src/users/entities/user.entity';
import { Assets } from '../assets/entities/asset.entity';

@Injectable()
export class WordOrdenService extends GenericService<OrdenesTrabajo, CreateWordOrdenDto, UpdateWordOrdenDto> {
  constructor(
    @InjectModel(OrdenesTrabajo.name) private OrdenModel: Model<OrdenesTrabajo>,
    @InjectModel(MaintenanceRequest.name) private maintenanceModel: Model<MaintenanceRequest>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Assets.name) private assetModel: Model<Assets>,
  ) {
    super(OrdenModel);
  }

  @Cron('00 * * * * *') // Se ejecuta cada minuto
  async updateExpiredOrders(): Promise<void> {
    const now = new Date();

    // Buscar órdenes de trabajo expiradas
    const expiredOrders = await this.OrdenModel.find({
      fechaFin: { $lt: now }, // FechaFin es menor que la fecha actual
      state: true, // Solo órdenes activas
    });

    for (const order of expiredOrders) {
      // Actualizar el estado de la orden de trabajo a false
      order.state = false;
      order.prioridad = 'Sin Terminar';
      await order.save();

      // Actualizar el estado de la solicitud asociada a false
      await this.maintenanceModel.findByIdAndUpdate(order.solicitud.solicitudId, { workOrderStatus: false });
    }

    console.log(`Órdenes expiradas actualizadas: ${expiredOrders.length}`);
  }

  private async validateWorkOrder(createDto: CreateWordOrdenDto): Promise<void> {
    // Validar que la solicitud existe
    const solicitud = await this.maintenanceModel.findById(createDto.solicitud.solicitudId);
    if (!solicitud) {
      throw new BadRequestException('La solicitud de mantenimiento no existe');
    }

    // Validar que no exista una orden de trabajo para esta solicitud
    const existingWorkOrder = await this.OrdenModel.findOne({
      'solicitud.solicitudId': createDto.solicitud.solicitudId
    });

    if (existingWorkOrder) {
      throw new BadRequestException(`Ya existe una orden de trabajo para la solicitud ${createDto.solicitud.solicitudId}`);
    }

    // Validar que el técnico existe
    const tecnico = await this.userModel.findById(createDto.tecnicoId);
    if (!tecnico) {
      throw new BadRequestException('El técnico asignado no existe');
    }
  }

  async create(createDto: CreateWordOrdenDto): Promise<OrdenesTrabajo> {
    try {
      // Validar la orden de trabajo
      await this.validateWorkOrder(createDto);
      await this.validateDates(createDto);

      // Crear la orden de trabajo
      const createdItem = new this.OrdenModel(createDto);
      const savedItem = await createdItem.save();

      // Actualizar el estado de la solicitud
      await this.maintenanceModel.findByIdAndUpdate(
        createDto.solicitud.solicitudId,
        { workOrderStatus: true }
      );

      return savedItem;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la orden de trabajo: ' + error.message);
    }
  }

  private async validateDates(dto: CreateWordOrdenDto | UpdateWordOrdenDto): Promise<void> {
    if (dto.fechaInicio && dto.fechaFin && new Date(dto.fechaInicio) > new Date(dto.fechaFin)) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin.');
    }
  }

  async findAllWithDetails(): Promise<OrdenesTrabajo[]> {
    return this.OrdenModel.find({})
      .populate('tecnicoId', 'name')
      .populate('instructorId', 'name')
      .populate({
        path: 'solicitud.solicitudId',
        model: this.assetModel,
        select: 'serialNumber',
        populate: {
          path: 'serialNumber',
          model: this.assetModel,
          select: 'name',
        },
      })
      .lean()
      .exec() as Promise<OrdenesTrabajo[]>;
  }
}