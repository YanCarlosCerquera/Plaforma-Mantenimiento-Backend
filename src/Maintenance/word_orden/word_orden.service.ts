import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { type Model, Types } from "mongoose"
import type { CreateWordOrdenDto } from "./dto/create-word_orden.dto"
import type { UpdateWordOrdenDto } from "./dto/update-word_orden.dto"
import { GenericService } from "src/Generic/generic.service"
import { OrdenesTrabajo } from "./entities/word_orden.entity"
import { MaintenanceRequest } from "src/Maintenance/application-maintenance/entities/application-maintenance.entity"
import { Cron } from "@nestjs/schedule"
import { User } from "src/users/entities/user.entity"
import { Assets } from "../assets/entities/asset.entity"
import type { TecnicoOrdenesResponse } from "./TecnicoOrdenesResponse"
import { Maintenance } from "../maintenance/entities/maintenance.entity"
import { WorkReport } from "../work_report/entities/work_report.entity"

@Injectable()
export class WordOrdenService extends GenericService<OrdenesTrabajo, CreateWordOrdenDto, UpdateWordOrdenDto> {
  constructor(
    @InjectModel(OrdenesTrabajo.name) private OrdenModel: Model<OrdenesTrabajo>,
    @InjectModel(MaintenanceRequest.name) private maintenanceModel: Model<MaintenanceRequest>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Assets.name) private assetModel: Model<Assets>,
    @InjectModel(Maintenance.name) private MantimientoModel: Model<Maintenance>,
    @InjectModel(WorkReport.name) private workReportModel: Model<WorkReport>,
  ) {
    super(OrdenModel);
  }

  @Cron("00 * * * * *") // Se ejecuta cada minuto
  async updateExpiredOrders(): Promise<void> {
    const now = new Date()

    const expiredOrders = await this.OrdenModel.find({
      fechaFin: { $lt: now }, // FechaFin es menor que la fecha actual
      state: false, // Solo órdenes activas
    });

    for (const order of expiredOrders) {
      order.state = false
      order.prioridad = "Sin Terminar"
      await order.save()

      // Actualizar el estado de la solicitud asociada a false
      await this.maintenanceModel.findByIdAndUpdate(order.solicitud, { workOrderStatus: false });
    }

    console.log(`Órdenes expiradas actualizadas: ${expiredOrders.length}`)
  }

  private async validateWorkOrder(createDto: CreateWordOrdenDto): Promise<void> {
    // Validar que la solicitud existe
    const solicitud = await this.maintenanceModel.findById(createDto.solicitud);
    if (!solicitud) {
      throw new BadRequestException("La solicitud de mantenimiento no existe")
    }

    // Validar que no exista una orden de trabajo para esta solicitud
    const existingWorkOrder = await this.OrdenModel.findOne({
      'solicitud': createDto.solicitud
    });

    if (existingWorkOrder) {
      throw new BadRequestException(`Ya existe una orden de trabajo para la solicitud ${createDto.solicitud}`);
    }

    // Validar que el técnico existe
    const tecnico = await this.userModel.findById(createDto.tecnicoId)
    if (!tecnico) {
      throw new BadRequestException("El técnico asignado no existe")
    }
  }

  async create(createDto: CreateWordOrdenDto): Promise<OrdenesTrabajo> {
    try {
      // Validar la orden de trabajo
      await this.validateWorkOrder(createDto)
      await this.validateDates(createDto)

      // Crear la orden de trabajo
      const createdItem = new this.OrdenModel(createDto)
      const savedItem = await createdItem.save()

      // Actualizar el estado de la solicitud
      await this.maintenanceModel.findByIdAndUpdate(
        createDto.solicitud,
        { workOrderStatus: true }
      );

      return savedItem
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException("Error al crear la orden de trabajo: " + error.message)
    }
  }

  private async validateDates(dto: CreateWordOrdenDto | UpdateWordOrdenDto): Promise<void> {
    if (dto.fechaInicio && dto.fechaFin && new Date(dto.fechaInicio) > new Date(dto.fechaFin)) {
      throw new BadRequestException("La fecha de inicio no puede ser posterior a la fecha de fin.")
    }
  }

  async findOn(id: string): Promise<any> {
    const orden = await this.OrdenModel.findById(id)
      .populate("tecnicoId", "name")
      .populate("instructorId", "name")
      .populate({
        path: "solicitud.solicitudIdc",
        model: this.assetModel,
        select: "serialNumber",
        populate: {
          path: "serialNumber",
          model: this.assetModel,
          select: "name",
        },
      })
      .populate({
        path: "maintenances",
        select: "description",
      })
      .lean({ virtuals: true })
      .exec()

    if (!orden) {
      throw new Error("Orden de trabajo no encontrada")
    }

    if (!orden.maintenances || orden.maintenances.length === 0) {
      return { ...orden, message: "No tiene mantenimientos realizados" }
    }

    return orden
  }

  async findAllWithDetails(): Promise<OrdenesTrabajo[]> {
    return this.OrdenModel.find({})
      .populate("tecnicoId", "name")
      .populate("instructorId", "name")
      .populate({
        path: "solicitud.solicitudId",
        model: this.assetModel,
        select: "serialNumber",
        populate: {
          path: "serialNumber",
          model: this.assetModel,
          select: "name",
        },
      })
      .lean()
      .exec() as Promise<OrdenesTrabajo[]>
  }

  async getWorkOrdenstatics(): Promise<{}> {
    const totalOrders = await this.OrdenModel.find().exec();
    const executedOrders = totalOrders.filter(order => order.state === true).length;
    const expiredOrders = totalOrders.filter(order => new Date(order.fechaFin) < new Date() && order.state === false).length;

    return {
      All: totalOrders.length,
      Executed: executedOrders,
      Expired: expiredOrders,
    };
  }
}
