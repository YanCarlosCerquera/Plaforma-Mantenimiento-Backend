import { Injectable, BadRequestException, NotFoundException, forwardRef, Inject } from "@nestjs/common"
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
import { Maintenance } from "../maintenance/entities/maintenance.entity"
import { WorkReport } from "../work_report/entities/work_report.entity"
import type { TecnicoOrdenesResponse } from "./TecnicoOrdenesResponse"
import { NotificationService } from "../application-maintenance/services/notification.service"

@Injectable()
export class WordOrdenService extends GenericService<OrdenesTrabajo, CreateWordOrdenDto, UpdateWordOrdenDto> {
  constructor(
    @InjectModel(OrdenesTrabajo.name) private OrdenModel: Model<OrdenesTrabajo>,
    @InjectModel(MaintenanceRequest.name) private maintenanceModel: Model<MaintenanceRequest>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Assets.name) private assetModel: Model<Assets>,
    @InjectModel(Maintenance.name) private MantimientoModel: Model<Maintenance>,
    @InjectModel(WorkReport.name) private workReportModel: Model<WorkReport>,
    @Inject(forwardRef(() => NotificationService)) private readonly notificationService: NotificationService,
    
  ) {
    super(OrdenModel);
  }


  async forceCheckOrdersAboutToExpire(): Promise<void> {
    await this.checkOrdersAboutToExpire();
    return;
  }

  @Cron("00 * * * * *") // Se ejecuta cada minuto
  async updateExpiredOrders(): Promise<void> {
    const now = new Date()

    const expiredOrders = await this.OrdenModel.find({
      fechaFin: { $lt: now }, // FechaFin es menor que la fecha actual
      state: false, // Solo órdenes activas
    })

    for (const order of expiredOrders) {
      order.state = false
      order.prioridad = "Sin Terminar"
      await order.save()

      // Actualizar el estado de la solicitud asociada a false
      await this.maintenanceModel.findByIdAndUpdate(order.solicitud, { workOrderStatus: false })
    }

    console.log(`Órdenes expiradas actualizadas: ${expiredOrders.length}`)
  }

  /**
   * Verifica órdenes de trabajo próximas a vencer y envía notificaciones
   * a los técnicos responsables
   */
    @Cron("00 * * * * *") 
  async checkOrdersAboutToExpire(): Promise<void> {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3); 
      
      const ordersAboutToExpire = await this.OrdenModel.find({
        fechaFin: { 
          $gt: now, 
          $lt: threeDaysFromNow 
        },
        state: true,
        notifiedExpiration: { $ne: true } 
      }).populate([
        { path: 'tecnicoId', select: 'name email phone' },
        { path: 'solicitud', select: 'trackingNumber InventoryCode maintenanceType' }
      ]);
      
      console.log(`Órdenes próximas a vencer encontradas: ${ordersAboutToExpire.length}`);
      
      const notifications = [];
      
      for (const order of ordersAboutToExpire) {
        const daysRemaining = Math.ceil((order.fechaFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const userToNotify = order.tecnicoId;
        
        let assetInfo = "No disponible";
        if (order.solicitud && order.solicitud.InventoryCode) {
          const asset = await this.assetModel.findOne({ 
            inventoryCode: order.solicitud.InventoryCode 
          }).select('name location').lean();
          
          if (asset) {
            assetInfo = `${asset.name} (${asset.location})`;
          }
        }
        
        if (userToNotify && userToNotify.email) {
          console.log(`✉️ Enviando correo a ${userToNotify.name} (${userToNotify.email})`);
          
          notifications.push(
            this.notificationService.sendNotificationEmail(
              {
                to: userToNotify.email,
                subject: `Orden de Trabajo Próxima a Vencer - ${order.radicado}`,
                body: "", // Se generará automáticamente
              },
              null, // No necesitamos NotificationData
              {
                name: userToNotify.name,
                radicado: order.radicado,
                fechaFin: order.fechaFin.toLocaleDateString(),
                daysRemaining: daysRemaining.toString(),
                prioridad: order.prioridad,
                assetInfo: assetInfo
              }
            )
          );
          
          // Marcar la orden como notificada
          order.notifiedExpiration = true;
          await order.save();
        }
      }
      
      // Esperar a que todas las notificaciones se envíen
      if (notifications.length > 0) {
        await Promise.all(notifications);
        console.log(`✅ Se enviaron ${notifications.length} notificaciones`);
      }
      
    } catch (error) {
      console.error('Error al verificar órdenes próximas a vencer:', error);
    }
  }
  private async validateWorkOrder(createDto: CreateWordOrdenDto): Promise<void> {
    // Validar que la solicitud existe
    const solicitud = await this.maintenanceModel.findById(createDto.solicitud)
    if (!solicitud) {
      throw new BadRequestException("La solicitud de mantenimiento no existe")
    }

    // Validar que no exista una orden de trabajo para esta solicitud
    const existingWorkOrder = await this.OrdenModel.findOne({
      "solicitud.solicitudId": createDto.solicitud,
    })

    if (existingWorkOrder) {
      throw new BadRequestException(`Ya existe una orden de trabajo para la solicitud ${createDto.solicitud}`)
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
      await this.maintenanceModel.findByIdAndUpdate(createDto.solicitud, { workOrderStatus: true })

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
        path: "solicitud",
        select: "serialNumber",
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

    let asset = null

    if (orden.solicitud?.serialNumber) {
      asset = await this.assetModel
        .findOne({ serialNumber: orden.solicitud.serialNumber }, "name serialNumber")
        .lean()
        .exec()
    }

    return {
      ...orden,
      asset, // Agregar asset al objeto de respuesta en vez de modificar solicitud
      message: !orden.maintenances?.length ? "No tiene mantenimientos realizados" : undefined,
    }
  }

  async findAllWithDetails(instructorId?: string, tecnicoId?: string): Promise<OrdenesTrabajo[]> {
    const query: any = {}

    if (instructorId) {
      query.instructorId = instructorId
    }

    if (tecnicoId) {
      query.tecnicoId = tecnicoId
    }

    const ordenes = await this.OrdenModel.find(query)
      .populate("tecnicoId", "name")
      .populate("instructorId", "name")
      .populate({
        path: "solicitud",
        select: "serialNumber",
      })
      .lean()
      .exec()

    for (const orden of ordenes) {
      if (orden.solicitud && orden.solicitud.serialNumber) {
        const asset = await this.assetModel
          .findOne({ serialNumber: orden.solicitud.serialNumber })
          .select("name image location")
          .lean()
        ;(orden.solicitud as any).asset = asset
      }
    }

    return ordenes as OrdenesTrabajo[]
  }
  /**
   * Encuentra todas las órdenes de trabajo asignadas a un técnico específico
   * @param userId - ID del usuario a verificar
   * @returns Promise con array de órdenes de trabajo
   */

  async findAllTecnico(userId: string): Promise<TecnicoOrdenesResponse | any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException("ID de usuario inválido")
    }

    // Buscar el usuario sin filtrar por rol específico
    const user = await this.userModel
      .findOne({
        _id: userId,
        state: true,
      })
      .populate("assignedRol") // Asumiendo que assignedRol es una referencia al modelo de roles

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`)
    }

    // Obtener el nombre o código del rol del usuario
    const userRole = user.assignedRol.name

    // Si el usuario es almacenista, devolver todos los bienes
    if (userRole === "almacenista" || userRole === "Almacenista") {
      // Consultar todos los bienes/activos
      const activos = await this.assetModel
        .find({ status: true })
        .select("name location acquisitionDate inventoryCode serialNumber categoryId status")
        .populate("categoryId", "name")
        .exec()
      // Crear una respuesta específica para almacenistas
      return {
        usuario: {
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
        activos: activos.map((activo) => ({
          id: activo._id.toString(),
          nombre: activo.name,
          ubicacion: activo.location,
          fechaAdquisicion: activo.acquisitionDate,
          codigoInventario: activo.inventoryCode,
          numeroSerie: activo.serialNumber,
          categoria: activo.categoryId ? activo.categoryId.name : "No disponible",
          estado: activo.status,
          // Agrega aquí cualquier otro campo relevante de los activos
        })),
        total: activos.length,
      }
    }

    // Para los demás roles, continuar con la lógica existente
    // Crear un filtro dinámico basado en el rol del usuario
    const ordenesFilter: any = { state: true }

    // Aplicar filtros según el rol
    if (userRole === "técnico" || userRole === "Técnico") {
      ordenesFilter.tecnicoId = userId
    } else if (userRole === "instructor" || userRole === "Instructor") {
      ordenesFilter.instructorId = userId
    }
    // Para administradores o supervisores, no se aplica filtro adicional

    // Aplicar el filtro dinámico a la consulta
    const ordenes = await this.OrdenModel.find(ordenesFilter).exec()

    // El resto del código permanece igual
    const ordenesIds = ordenes.map((orden) => orden._id)
    const solicitudIds = ordenes.map((orden) => orden.solicitud)

    // Buscar las solicitudes de mantenimiento
    const solicitudes = await this.maintenanceModel
      .find({
        _id: { $in: solicitudIds },
      })
      .exec()

    // Crear un mapa de solicitudes por ID
    const solicitudesPorId = new Map()
    solicitudes.forEach((solicitud) => {
      solicitudesPorId.set(solicitud._id.toString(), solicitud)
    })

    // Obtener los números de serie de los activos
    const serialNumbers = solicitudes.map((solicitud) => solicitud.serialNumber)

    // Buscar los activos por número de serie
    const activos = await this.assetModel
      .find({
        serialNumber: { $in: serialNumbers },
      })
      .select("name location acquisitionDate inventoryCode serialNumber categoryId status")
      .populate("categoryId", "name")
      .exec()

    // Crear un mapa de activos por número de serie
    const activosPorSerial = new Map()
    activos.forEach((activo) => {
      activosPorSerial.set(activo.serialNumber, activo)
    })

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

      // Obtener la solicitud asociada a esta orden
      const solicitud = solicitudesPorId.get(orden.solicitud.toString())

      // Obtener el activo asociado a esta solicitud
      let activoInfo = {
        id: "No disponible",
        nombre: "No disponible",
        ubicacion: "No disponible",
        fechaAdquisicion: new Date(),
        codigoInventario: "no disponible",
        categoria: "no disponible",
      }

      if (solicitud && solicitud.serialNumber) {
        const activo = activosPorSerial.get(solicitud.serialNumber)
        if (activo) {
          activoInfo = {
            id: activo._id.toString(),
            nombre: activo.name,
            ubicacion: activo.location,
            fechaAdquisicion: activo.acquisitionDate,
            codigoInventario: activo.inventoryCode,
            categoria: activo.categoryId.name,
          }
        }
      }

      totalMantenimientos += mantenimientosDeOrden.length
      totalInformes += informesDeOrden.length

      return {
        id: ordenId,
        radicado: orden.radicado,
        fechaInicio: orden.fechaInicio,
        fechaFin: orden.fechaFin,
        prioridad: orden.prioridad,
        solicitud: {
          solicitudId: orden.solicitud.toString(),
        },
        estado: orden.state,
        fechaCreacion: orden.fechaFin,
        fechaActualizacion: orden.fechaInicio,
        // Agregar información del activo
        activo: [activoInfo],
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
      usuario: {
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
  async getWorkOrdenstatics(): Promise<{}> {
    const totalOrders = await this.OrdenModel.find().exec()
    const executedOrders = totalOrders.filter((order) => order.state === true).length
    const expiredOrders = totalOrders.filter(
      (order) => new Date(order.fechaFin) < new Date() && order.state === false,
    ).length

    return {
      All: totalOrders.length,
      Executed: executedOrders,
      Expired: expiredOrders,
    }
  }
}

