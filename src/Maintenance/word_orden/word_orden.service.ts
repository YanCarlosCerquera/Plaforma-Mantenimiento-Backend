import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateWordOrdenDto } from './dto/create-word_orden.dto';
import { UpdateWordOrdenDto } from './dto/update-word_orden.dto';
import { GenericService } from 'src/Generic/generic.service';
import { OrdenesTrabajo } from './entities/word_orden.entity';
import { MaintenanceRequest } from 'src/Maintenance/application-maintenance/entities/application-maintenance.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class WordOrdenService extends GenericService<OrdenesTrabajo, CreateWordOrdenDto, UpdateWordOrdenDto> {
  constructor(
    @InjectModel(OrdenesTrabajo.name) private OrdenModel: Model<OrdenesTrabajo>,
    @InjectModel(MaintenanceRequest.name) private maintenanceModel: Model<MaintenanceRequest>
  ) {
    super(OrdenModel);
  }

  @Cron('10 * * * * *')
  async updateExpiredOrders(): Promise<void> {
    const now = new Date();

    const expiredOrders = await this.OrdenModel.find({
      fechaFin: { $lt: now },
      state: false, 
    });

    for (const order of expiredOrders) {
      order.state = false; 
      order.prioridad = 'Sin Terminar'; 
      await order.save();
    }

    console.log(`Órdenes vencidas actualizadas: ${expiredOrders.length}`);
  }

  async create(createDto: CreateWordOrdenDto): Promise<OrdenesTrabajo> {
    await this.validateWorkOrder(createDto);

    const createdItem = new this.OrdenModel(createDto);
    const savedItem = await createdItem.save();
    await this.maintenanceModel.findByIdAndUpdate(createDto.solicitud.solicitudId, { workOrderStatus: true });
    return savedItem;
  }

  private async validateDates(dto: CreateWordOrdenDto | UpdateWordOrdenDto): Promise<void> {
    if (dto.fechaInicio && dto.fechaFin && new Date(dto.fechaInicio) > new Date(dto.fechaFin)) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin.');
    }
  }

  async validateWorkOrder(dto: CreateWordOrdenDto | UpdateWordOrdenDto): Promise<void> {
    // Verificar si la solicitud de mantenimiento existe
    if (dto.solicitud?.solicitudId) {
      const maintenanceRequest = await this.maintenanceModel.findById(dto.solicitud.solicitudId);
      if (!maintenanceRequest) {
        throw new BadRequestException('La solicitud de mantenimiento no existe');
      }
  
      // Validar que la solicitud no tenga ya una orden de trabajo asignada
      const existingWorkOrderForSolicitud = await this.OrdenModel.findOne({
        'solicitud.solicitudId': dto.solicitud.solicitudId,
        state: true, // Solo consideramos las órdenes de trabajo activas
      });
  
      if (existingWorkOrderForSolicitud) {
        throw new BadRequestException('Esta solicitud ya tiene una orden de trabajo asignada');
      }
    }
  
    // Validar la unicidad del campo 'radicado'
    if (dto.radicado) {
      const existingWorkOrderForRadicado = await this.OrdenModel.findOne({
        radicado: dto.radicado,
      });
  
      if (existingWorkOrderForRadicado) {
        throw new BadRequestException('Ya existe una orden de trabajo con este radicado');
      }
    }
  
    // Validar fechas
    if (dto.fechaFin && dto.fechaInicio && new Date(dto.fechaInicio) > new Date(dto.fechaFin)) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin');
    }
  }
  

  async findAllWithDetails(): Promise<OrdenesTrabajo[]> {
    return this.OrdenModel.find({ })
      .populate('tecnicoId', 'nombre email')
      .populate('instructorId', 'nombre email')
      .populate({
        path: 'solicitud.solicitudId',
        model: this.maintenanceModel,
        select: 'requesterName trackingNumber workOrderStatus'
      })
      .lean()
      .exec() as Promise<[]>;
  }
}