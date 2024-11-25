import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateWordOrdenDto } from './dto/create-word_orden.dto';
import { UpdateWordOrdenDto } from './dto/update-word_orden.dto';
import { GenericService } from 'src/Generic/generic.service';
import { OrdenesTrabajo } from './entities/word_orden.entity';
import { MaintenanceRequest } from 'src/Maintenance/application-maintenance/entities/application-maintenance.entity';

@Injectable()
export class WordOrdenService extends GenericService<OrdenesTrabajo, CreateWordOrdenDto, UpdateWordOrdenDto> {
  constructor(
    @InjectModel(OrdenesTrabajo.name) private OrdenModel: Model<OrdenesTrabajo>,
    @InjectModel(MaintenanceRequest.name) private maintenanceModel: Model<MaintenanceRequest>
  ) {
    super(OrdenModel);
  }
  async create(createDto: CreateWordOrdenDto): Promise<OrdenesTrabajo> {
    await this.validateWorkOrder(createDto);

    const createdItem = new this.OrdenModel(createDto);
    const savedItem = await createdItem.save();
    await this.maintenanceModel.findByIdAndUpdate(createDto.solicitud.solicitudId, { workOrderStatus: true });
    return savedItem;


  }
  async validateWorkOrder(dto: CreateWordOrdenDto | UpdateWordOrdenDto): Promise<void> {
    if (dto.solicitud?.solicitudId) {
      const maintenanceRequest = await this.maintenanceModel.findById(dto.solicitud.solicitudId);
      if (!maintenanceRequest) {
        throw new BadRequestException('La solicitud de mantenimiento no existe');
      }
///Validacion de Estdo de Solcitu si ele estado de la Solicut es False y al momento de realizar una orden trabajo el estado de Solicitud cambio de True

      const existingWorkOrder = await this.OrdenModel.findOne({
        'solicitud.solicitudId': dto.solicitud.solicitudId,
        StateOT: true
      });

      if (existingWorkOrder) {
        throw new BadRequestException('Esta solicitud ya tiene una orden de trabajo asignada');
      }
    }

    // Validar fechas
    if (dto.fechaFin && dto.fechaInicio && new Date(dto.fechaInicio) > new Date(dto.fechaFin)) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin');
    }
  }

  async findAllWithDetails(): Promise<OrdenesTrabajo[]> {
    return this.OrdenModel.find({ state: true })
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

