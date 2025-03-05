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

    // Buscar órdenes de trabajo expiradas
    const expiredOrders = await this.OrdenModel.find({
      fechaFin: { $lt: now }, // FechaFin es menor que la fecha actual
      state: true, // Solo órdenes activas
    })

    for (const order of expiredOrders) {
      // Actualizar el estado de la orden de trabajo a false
      order.state = false
      order.prioridad = "Sin Terminar"
      await order.save()

      // Actualizar el estado de la solicitud asociada a false
      await this.maintenanceModel.findByIdAndUpdate(order.solicitud.solicitudId, { workOrderStatus: false })
    }

    console.log(`Órdenes expiradas actualizadas: ${expiredOrders.length}`)
  }

  private async validateWorkOrder(createDto: CreateWordOrdenDto): Promise<void> {
    // Validar que la solicitud existe
    const solicitud = await this.maintenanceModel.findById(createDto.solicitud.solicitudId)
    if (!solicitud) {
      throw new BadRequestException("La solicitud de mantenimiento no existe")
    }

    // Validar que no exista una orden de trabajo para esta solicitud
    const existingWorkOrder = await this.OrdenModel.findOne({
      "solicitud.solicitudId": createDto.solicitud.solicitudId,
    })

    if (existingWorkOrder) {
      throw new BadRequestException(
        `Ya existe una orden de trabajo para la solicitud ${createDto.solicitud.solicitudId}`,
      )
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
      await this.maintenanceModel.findByIdAndUpdate(createDto.solicitud.solicitudId, { workOrderStatus: true })

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
  /**
   * Encuentra todas las órdenes de trabajo asignadas a un técnico específico
   * @param userId - ID del usuario a verificar
   * @returns Promise con array de órdenes de trabajo
   */

  async findAllTecnico(userId: string): Promise<TecnicoOrdenesResponse> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException("ID de usuario inválido")
    }

    const TECNICO_ROLE_ID = "674dc7135a622b0c8382078a"

    const user = await this.userModel.findOne({
      _id: userId,
      assignedRol: TECNICO_ROLE_ID,
      state: true,
    })

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado o no tiene el rol de técnico`)
    }

    const ordenes = await this.OrdenModel.find({
      tecnicoId: userId,
      state: true,
    }).exec()

    const ordenesIds = ordenes.map((orden) => orden._id)

    const mantenimientos = await this.MantimientoModel.find({
      wordOrdenId: { $in: ordenesIds },
    }).exec()

    const informes = await this.workReportModel
      .find({
        orderId: { $in: ordenesIds },
      })
      .exec()

    const mantenimientosPorOrden = new Map()
    mantenimientos.forEach((mantenimiento) => {
      const ordenId = mantenimiento.wordOrdenId.toString()
      if (!mantenimientosPorOrden.has(ordenId)) {
        mantenimientosPorOrden.set(ordenId, [])
      }
      mantenimientosPorOrden.get(ordenId).push(mantenimiento)
    })

    const informesPorOrden = new Map()
    informes.forEach((informe) => {
      const ordenId = informe.orderId.toString()
      if (!informesPorOrden.has(ordenId)) {
        informesPorOrden.set(ordenId, [])
      }
      informesPorOrden.get(ordenId).push(informe)
    })

    let totalMantenimientos = 0
    let totalInformes = 0

    const ordenesConDetalles = ordenes.map((orden) => {
      const ordenId = orden._id.toString()
      const mantenimientosDeOrden = mantenimientosPorOrden.get(ordenId) || []
      const informesDeOrden = informesPorOrden.get(ordenId) || []

      totalMantenimientos += mantenimientosDeOrden.length
      totalInformes += informesDeOrden.length

      return {
        id: ordenId,
        radicado: orden.radicado,
        fechaInicio: orden.fechaInicio,
        fechaFin: orden.fechaFin,
        prioridad: orden.prioridad,
        solicitud: {
          solicitudId: orden.solicitud.solicitudId.toString(),
        },
        estado: orden.state,
        fechaCreacion: orden.fechaFin,
        fechaActualizacion: orden.fechaInicio,
        mantenimientos: mantenimientosDeOrden.map((m) => ({
          id: m._id.toString(),
          tipo: m.typeMaintenance,
          descripcion: m.description,
          observacion: m.observation,
          estadoRepuestos: m.sparePartsStatus,
          detallesRepuestos: m.sparePartsDetails,
          firmaDelTecnico: m.technicalSignature,
          fechaCreacion: m.createdAt,
        })),
        informes: informesDeOrden.map((i) => ({
          id: i._id.toString(),
          costos: i.costs,
          horas: i.hours,
          respuestas: i.responses,
          observacion: i.observation,
          trabajoRealizado: i.workDone,
          estado: i.status,
          fechaCreacion: i.createdAt,
        })),
      }
    })

    const response: TecnicoOrdenesResponse = {
      tecnico: {
        id: user._id.toString(),
        nombre: user.name,
        email: user.email,
        telefono: user.phone || "No disponible",
        cargo: user.assignedPosition,
        documento: {
          tipo: user.typeDocument,
          numero: user.numberDocument,
        },
      },
      ordenes: ordenesConDetalles,
      total: ordenes.length,
      totalMantenimientos,
      totalInformes,
    }

    return response
  }
}

