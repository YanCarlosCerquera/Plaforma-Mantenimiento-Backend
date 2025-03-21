import { Injectable, BadRequestException, NotFoundException, forwardRef, Inject, Logger } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { type Model, Types } from "mongoose"
import type { CreateWordOrdenDto } from "./dto/create-word_orden.dto"
import type { UpdateWordOrdenDto } from "./dto/update-word_orden.dto"
import { GenericService } from "src/Generic/generic.service"
import { OrdenesTrabajo } from "./entities/word_orden.entity"
import { MaintenanceRequest } from "src/maintenance/application-maintenance/entities/application-maintenance.entity"
import { Cron, CronExpression } from "@nestjs/schedule"
import { User } from "src/users/entities/user.entity"
import { Assets } from "../assets/entities/asset.entity"
import { Maintenance } from "../maintenance/entities/maintenance.entity"
import { WorkReport } from "../work_report/entities/work_report.entity"
import type { TecnicoOrdenesResponse } from "./TecnicoOrdenesResponse"
import { NotificationService } from "../application-maintenance/services/notification.service"

@Injectable()
export class WordOrdenService extends GenericService<OrdenesTrabajo, CreateWordOrdenDto, UpdateWordOrdenDto> {
  private readonly logger = new Logger(WordOrdenService.name);

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

  /**
   * Fuerza la verificación de órdenes próximas a vencer
   */
  async forceCheckOrdersAboutToExpire(): Promise<void> {
    this.logger.log("Forzando verificación de órdenes próximas a vencer")
    await this.checkOrdersAboutToExpire()
    return
  }

  /**
   * Actualiza órdenes expiradas cada 30 minutos
   * Cambia el estado y prioridad de las órdenes vencidas
   * MODIFICACIÓN: Marca órdenes como notifiedExpiration=true cuando llegan a su fecha fin
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateExpiredOrders(): Promise<void> {
    try {
      const now = new Date()
      this.logger.debug(`Verificando órdenes expiradas: ${now.toISOString()}`)

      // Formatear la fecha actual para comparar solo año, mes y día
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      // Buscar órdenes que vencen hoy o ya vencieron y aún no han sido marcadas como notificadas
      const expiredOrders = await this.OrdenModel.find({
        $or: [
          // Órdenes que vencen exactamente hoy (comparando solo fecha, no hora)
          {
            fechaFin: {
              $gte: today,
              $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Mañana
            },
            state: false,
            notifiedExpiration: { $ne: true }
          },
          // Órdenes que ya vencieron y no han sido notificadas
          {
            fechaFin: { $lt: today },
            state: false,
            notifiedExpiration: { $ne: true }
          }
        ]
      })

      if (expiredOrders.length === 0) {
        return
      }

      this.logger.log(`Encontradas ${expiredOrders.length} órdenes que vencen hoy o ya vencieron para actualizar`)

      // Procesar en lotes para mejor rendimiento
      const batchSize = 10
      const batches = Math.ceil(expiredOrders.length / batchSize)

      for (let i = 0; i < batches; i++) {
        const batch = expiredOrders.slice(i * batchSize, (i + 1) * batchSize)
        const updatePromises = batch.map(async (order) => {
          // Actualizar la orden - NO cambiar el estado, solo la prioridad
          order.prioridad = "Sin Terminar"
          
          // MODIFICACIÓN: Marcar como notificada para que no se envíen más notificaciones
          // una vez que llega a la fecha fin
          order.notifiedExpiration = true
          await order.save()

          // Enviar una última notificación (solo si no ha sido notificada hoy)
          await this.notifyExpiredOrder(order)
          
          this.logger.log(`Orden ${order.radicado} marcada como notifiedExpiration=true al llegar a fecha fin`)
        })

        await Promise.all(updatePromises)
      }

      this.logger.log(`Órdenes expiradas actualizadas: ${expiredOrders.length}`)
    } catch (error) {
      this.logger.error(`Error al actualizar órdenes expiradas: ${error.message}`, error.stack)
    }
  }

  /**
   * Notifica al técnico sobre una orden vencida
   */
  private async notifyExpiredOrder(order: OrdenesTrabajo): Promise<void> {
    try {
      // Si la orden ya está completada, no enviar notificación
      if (order.state === true) {
        this.logger.log(`Orden ${order.radicado} ya completada, no se envía notificación de vencimiento`)
        return
      }

      const tecnico = await this.userModel.findById(order.tecnicoId).select("name email phone").lean()

      if (!tecnico || !tecnico.email) {
        return
      }

      const solicitud = await this.maintenanceModel
        .findById(order.solicitud)
        .select("trackingNumber InventoryCode maintenanceType")
        .lean()

      let assetInfo = "No disponible"
      if (solicitud && solicitud.InventoryCode) {
        const asset = await this.assetModel
          .findOne({ inventoryCode: solicitud.InventoryCode })
          .select("name location category")
          .lean()

        if (asset) {
          assetInfo = `${asset.name} (${asset.categoryId?.name || "Sin categoría"} - ${asset.location || "Sin ubicación"})`
        }
      }

      await this.notificationService.sendNotificationEmail(
        {
          to: tecnico.email,
          subject: `⚠️ Orden de Trabajo Vencida - ${order.radicado}`,
          body: null,
        },
        null,
        {
          name: tecnico.name,
          radicado: order.radicado,
          fechaFin: order.fechaFin.toLocaleDateString(),
          daysRemaining: "0",
          prioridad: "Alta",
          assetInfo: assetInfo,
        },
      )
      
      this.logger.log(`Notificación final de vencimiento enviada para orden ${order.radicado}`)
    } catch (error) {
      this.logger.error(`Error al notificar orden vencida: ${error.message}`)
    }
  }

  /**
   * Verifica órdenes próximas a vencer cada 30 minutos
   * Envía notificaciones a los técnicos (una por día)
   * MODIFICACIÓN: Implementa notificación diaria para órdenes próximas a vencer
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkOrdersAboutToExpire(): Promise<void> {
    try {
      const now = new Date()
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(now.getDate() + 3)
      
      // Formatear la fecha actual para comparar solo año, mes y día
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      this.logger.debug(`Verificando órdenes próximas a vencer: ${now.toISOString()}`)

      // Buscar órdenes próximas a vencer (entre hoy y 3 días después)
      // que no hayan sido marcadas como completamente notificadas
      const ordersAboutToExpire = await this.OrdenModel.find({
        fechaFin: {
          $gt: now,
          $lt: threeDaysFromNow,
        },
        state: false, // Órdenes activas tienen state = false
        notifiedExpiration: { $ne: true }, // No completamente notificadas
      }).populate([
        { path: "tecnicoId", select: "name email phone" },
        { path: "solicitud", select: "trackingNumber InventoryCode maintenanceType" },
      ])

      if (ordersAboutToExpire.length === 0) {
        return
      }

      this.logger.log(`Encontradas ${ordersAboutToExpire.length} órdenes próximas a vencer para notificar`)

      // Procesar en lotes para mejor rendimiento
      const batchSize = 5
      const batches = Math.ceil(ordersAboutToExpire.length / batchSize)

      for (let i = 0; i < batches; i++) {
        const batch = ordersAboutToExpire.slice(i * batchSize, (i + 1) * batchSize)
        const notificationPromises = batch.map(async (order) => {
          // Verificar si ya se notificó hoy (usando lastNotificationDate)
          const lastNotificationDate = order.lastNotificationDate ? new Date(order.lastNotificationDate) : null
          const lastNotificationDay = lastNotificationDate ? 
            new Date(lastNotificationDate.getFullYear(), lastNotificationDate.getMonth(), lastNotificationDate.getDate()) : 
            null
          
          // Si ya se notificó hoy, no enviar otra notificación
          if (lastNotificationDay && lastNotificationDay.getTime() === today.getTime()) {
            this.logger.log(`Orden ${order.radicado} ya fue notificada hoy, saltando notificación`)
            return
          }
          
          // Procesar la orden y enviar notificación
          await this.processOrderAboutToExpire(order, now)
          
          // Actualizar la fecha de última notificación
          await this.OrdenModel.findByIdAndUpdate(order._id, { 
            lastNotificationDate: now 
          })
        })

        await Promise.all(notificationPromises)
      }
    } catch (error) {
      this.logger.error(`Error al verificar órdenes próximas a vencer: ${error.message}`, error.stack)
    }
  }

  /**
   * Procesa una orden próxima a vencer
   * Envía notificaciones y actualiza el estado de notificación
   */
  private async processOrderAboutToExpire(order: OrdenesTrabajo, now: Date): Promise<void> {
    try {
      // Si la orden ya está completada, no enviar notificación
      if (order.state === true) {
        this.logger.log(`Orden ${order.radicado} ya completada, no se procesa como próxima a vencer`)
        return
      }
      
      const daysRemaining = Math.ceil((order.fechaFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const userToNotify = order.tecnicoId

      if (!userToNotify || !userToNotify.email) {
        return
      }

      let assetInfo = "No disponible"
      if (order.solicitud && order.solicitud.InventoryCode) {
        const asset = await this.assetModel
          .findOne({ inventoryCode: order.solicitud.InventoryCode })
          .select("name location category")
          .lean()

        if (asset) {
          assetInfo = `${asset.name} (${asset.categoryId?.name || "Sin categoría"} - ${asset.location || "Sin ubicación"})`
        }
      }

      // Determinar prioridad basada en días restantes
      let prioridad = order.prioridad
      if (daysRemaining <= 1) {
        prioridad = "Alta"
      } else if (daysRemaining <= 2) {
        prioridad = "Media"
      }

      this.logger.log(
        `Enviando notificación a ${userToNotify.name} (${userToNotify.email}) para orden ${order.radicado} - Días restantes: ${daysRemaining}`,
      )

      await this.notificationService.sendNotificationEmail(
        {
          to: userToNotify.email,
          subject: `⏰ Orden de Trabajo Próxima a Vencer - ${order.radicado}`,
          body: null,
        },
        null,
        {
          name: userToNotify.name,
          radicado: order.radicado,
          fechaFin: order.fechaFin.toLocaleDateString(),
          daysRemaining: daysRemaining.toString(),
          prioridad: prioridad,
          assetInfo: assetInfo,
        },
      )

      // Si es el último día (daysRemaining <= 0), marcar como completamente notificada
      if (daysRemaining <= 0) {
        await this.OrdenModel.findByIdAndUpdate(order._id, { 
          notifiedExpiration: true 
        })
        this.logger.log(`Orden ${order.radicado} marcada como completamente notificada en su último día`)
      }
    } catch (error) {
      this.logger.error(`Error al procesar orden próxima a vencer: ${error.message}`)
    }
  }

  /**
   * Valida una orden de trabajo antes de crearla
   */
  private async validateWorkOrder(createDto: CreateWordOrdenDto): Promise<void> {
    // Verificar si la solicitud existe
    const solicitud = await this.maintenanceModel.findById(createDto.solicitud)
    if (!solicitud) {
      throw new BadRequestException("La solicitud de mantenimiento no existe")
    }

    // Verificar si ya existe una orden para esta solicitud
    const existingWorkOrder = await this.OrdenModel.findOne({
      solicitud: createDto.solicitud,
    })

    if (existingWorkOrder) {
      throw new BadRequestException(`Ya existe una orden de trabajo para la solicitud`)
    }

    // Verificar si el técnico existe
    const tecnico = await this.userModel.findById(createDto.tecnicoId)
    if (!tecnico) {
      throw new BadRequestException("El técnico asignado no existe")
    }
  }

  /**
   * Crea una nueva orden de trabajo
   */
  async create(createDto: CreateWordOrdenDto): Promise<OrdenesTrabajo> {
    try {
      this.logger.log(`Creando nueva orden de trabajo para solicitud: ${createDto.solicitud}`)

      // Validar la orden y las fechas
      await this.validateWorkOrder(createDto)
      await this.validateDates(createDto)

      // MODIFICACIÓN: Asegurar que el estado inicial sea false (activa)
      createDto.state = false;
      // Inicializar notifiedExpiration como false
      createDto.notifiedExpiration = false;
      // Inicializar lastNotificationDate como null
      createDto.lastNotificationDate = null;

      // Crear y guardar la orden
      const createdItem = new this.OrdenModel(createDto)
      const savedItem = await createdItem.save()

      // Actualizar el estado de la solicitud
      await this.maintenanceModel.findByIdAndUpdate(createDto.solicitud, { workOrderStatus: true })

      // Obtener información del técnico
      const tecnico = await this.userModel.findById(createDto.tecnicoId).select("name email phone").lean()

      // Obtener información de la solicitud
      const solicitud = await this.maintenanceModel
        .findById(createDto.solicitud)
        .select("trackingNumber InventoryCode maintenanceType description")
        .lean()

      // Obtener información del activo
      const assetInfo = await this.getAssetInfo(solicitud)

      // Enviar notificación al técnico
      if (tecnico && tecnico.email) {
        this.logger.log(`Enviando notificación a técnico: ${tecnico.name} (${tecnico.email})`)

        // Calcular días disponibles
        const today = new Date()
        const fechaFin = new Date(savedItem.fechaFin)
        const diffTime = Math.abs(fechaFin.getTime() - today.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Determinar prioridad basada en días disponibles y tipo de mantenimiento
        const prioridad = this.determinarPrioridad(diffDays, solicitud)

        // Enviar notificación por email
        await this.notificationService.sendTechnicianNotification(
          {
            to: tecnico.email,
            subject: `🔧 Nueva Orden de Trabajo Asignada - ${savedItem.radicado}`,
            body: null,
          },
          {
            name: tecnico.name,
            radicado: savedItem.radicado,
            fechaInicio: savedItem.fechaInicio ? savedItem.fechaInicio.toLocaleDateString() : null,
            fechaFin: savedItem.fechaFin.toLocaleDateString(),
            email: tecnico.email,
            prioridad: prioridad,
            assetInfo: assetInfo,
          },
        )
        
        // Registrar esta notificación inicial
        await this.OrdenModel.findByIdAndUpdate(savedItem._id, { 
          lastNotificationDate: new Date() 
        })
      }

      this.logger.log(`Orden de trabajo creada exitosamente: ${savedItem.radicado}`)
      return savedItem
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      this.logger.error(`Error al crear orden de trabajo: ${error.message}`, error.stack)
      throw new BadRequestException("Error al crear la orden de trabajo: " + error.message)
    }
  }

  /**
   * Determina la prioridad de una orden basada en días disponibles y tipo de mantenimiento
   */
  private determinarPrioridad(diffDays: number, solicitud: any): string {
    let prioridad = "Normal"

    // Determinar prioridad basada en días disponibles
    if (diffDays <= 2) {
      prioridad = "Alta"
    } else if (diffDays <= 5) {
      prioridad = "Media"
    }

    // Si es mantenimiento correctivo, aumentar la prioridad
    if (solicitud && solicitud.maintenanceType && solicitud.maintenanceType.toLowerCase().includes("correctivo")) {
      if (prioridad === "Normal") prioridad = "Media"
      else if (prioridad === "Media") prioridad = "Alta"
    }

    return prioridad
  }

  /**
   * Obtiene información detallada de un activo
   */
  private async getAssetInfo(solicitud: any): Promise<string> {
    let assetInfo = "No disponible";
  
    if (solicitud && solicitud.InventoryCode) {
      const asset = await this.assetModel
        .findOne({ inventoryCode: solicitud.InventoryCode })
        .select("name location category")
        .populate("categoryId") // Add this line to populate the category
        .lean();
  
      if (asset) {
        // Add null check for categoryId
        const categoryName = asset.categoryId?.name || "Sin categoría";
        assetInfo = `${asset.name} (${categoryName} - ${asset.location || "Sin ubicación"})`;
      }
    }
  
    return assetInfo;
  }

  /**
   * Valida las fechas de una orden de trabajo
   */
  private async validateDates(dto: CreateWordOrdenDto | UpdateWordOrdenDto): Promise<void> {
    // Verificar que la fecha de inicio no sea posterior a la fecha de fin
    if (dto.fechaInicio && dto.fechaFin && new Date(dto.fechaInicio) > new Date(dto.fechaFin)) {
      throw new BadRequestException("La fecha de inicio no puede ser posterior a la fecha de fin.")
    }

    // Verificar que la fecha de fin no sea anterior a la fecha actual
    const now = new Date()
    if (dto.fechaFin && new Date(dto.fechaFin) < now) {
      throw new BadRequestException("La fecha de fin no puede ser anterior a la fecha actual.")
    }
  }

  /**
   * Encuentra una orden de trabajo por ID con detalles
   */
  async findOn(id: string): Promise<any> {
    try {
      this.logger.log(`Buscando orden de trabajo con ID: ${id}`)

      // Buscar la orden con sus relaciones
      const orden = await this.OrdenModel.findById(id)
        .populate("tecnicoId", "name")
        .populate("instructorId", "name")
        .populate({
          path: "solicitud",
          select: "serialNumber trackingNumber maintenanceType description",
        })
        .populate({
          path: "maintenances",
          select:
            "description typeMaintenance observation sparePartsStatus sparePartsDetails technicalSignature createdAt",
        })
        .lean({ virtuals: true })
        .exec()

      if (!orden) {
        this.logger.warn(`Orden de trabajo no encontrada: ${id}`)
        throw new NotFoundException("Orden de trabajo no encontrada")
      }

      // Buscar información del activo
      let asset = null
      if (orden.solicitud?.serialNumber) {
        asset = await this.assetModel
          .findOne({ serialNumber: orden.solicitud.serialNumber })
          .select("name serialNumber inventoryCode location category status")
          .lean()
          .exec()
      }

      // Buscar informes de trabajo asociados
      const informes = await this.workReportModel
        .find({ orderId: id })
        .select("costs hours responses observation workDone status createdAt")
        .lean()
        .exec()

      // Calcular días restantes o días de retraso
      const now = new Date()
      const fechaFin = new Date(orden.fechaFin)
      const diffTime = fechaFin.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const diasRestantes = diffDays > 0 ? diffDays : 0
      const diasRetraso = diffDays < 0 ? Math.abs(diffDays) : 0

      // Verificar si la orden está finalizada (state = true)
      const estaFinalizada = orden.state === true;

      // Construir respuesta enriquecida
      return {
        ...orden,
        asset,
        informes,
        estadoTiempo: {
          diasRestantes,
          diasRetraso,
          estaVencida: diffDays < 0 && !estaFinalizada,
          estaProximaAVencer: !estaFinalizada && diasRestantes <= 3 && diasRestantes > 0,
          estaFinalizada: estaFinalizada
        },
        message: !orden.maintenances?.length ? "No tiene mantenimientos realizados" : undefined,
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error(`Error al buscar orden de trabajo: ${error.message}`, error.stack)
      throw new BadRequestException("Error al buscar la orden de trabajo: " + error.message)
    }
  }

  /**
   * Encuentra todas las órdenes con detalles, opcionalmente filtradas por instructor o técnico
   */
  async findAllWithDetails(instructorId?: string, tecnicoId?: string): Promise<OrdenesTrabajo[]> {
    try {
      const query: any = {}

      // Aplicar filtros si se proporcionan
      if (instructorId) {
        query.instructorId = instructorId
      }

      if (tecnicoId) {
        query.tecnicoId = tecnicoId
      }

      this.logger.log(`Buscando órdenes de trabajo con filtros: ${JSON.stringify(query)}`)

      // Buscar órdenes con sus relaciones
      const ordenes = await this.OrdenModel.find(query)
        .populate("tecnicoId", "name email phone")
        .populate("instructorId", "name email")
        .populate({
          path: "solicitud",
          select: "serialNumber trackingNumber maintenanceType description",
        })
        .lean()
        .exec()

      // Enriquecer las órdenes con información de activos
      const ordenesEnriquecidas = await Promise.all(
        ordenes.map(async (orden) => {
          // Buscar información del activo
          if (orden.solicitud && orden.solicitud.serialNumber) {
            const asset = await this.assetModel
              .findOne({ serialNumber: orden.solicitud.serialNumber })
              .select("name image location category status")
              .lean()

            if (asset) {
              ;(orden.solicitud as any).asset = asset
            }
          }

          // Calcular días restantes o días de retraso
          const now = new Date()
          const fechaFin = new Date(orden.fechaFin)
          const diffTime = fechaFin.getTime() - now.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          const diasRestantes = diffDays > 0 ? diffDays : 0
          const diasRetraso = diffDays < 0 ? Math.abs(diffDays) : 0

          // Verificar si la orden está finalizada (state = true)
          const estaFinalizada = orden.state === true;

          // Agregar información de tiempo
          return {
            ...orden,
            estadoTiempo: {
              diasRestantes,
              diasRetraso,
              estaVencida: diffDays < 0 && !estaFinalizada,
              estaProximaAVencer: !estaFinalizada && diasRestantes <= 3 && diasRestantes > 0,
              estaFinalizada: estaFinalizada
            },
          }
        }),
      )

      return ordenesEnriquecidas as OrdenesTrabajo[]
    } catch (error) {
      this.logger.error(`Error al buscar órdenes con detalles: ${error.message}`, error.stack)
      throw new BadRequestException("Error al buscar órdenes de trabajo: " + error.message)
    }
  }

  /**
   * Encuentra todas las órdenes de trabajo asignadas a un técnico específico
   * o todos los activos si el usuario es almacenista
   */
  async findAllTecnico(userId: string): Promise<TecnicoOrdenesResponse | any> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new NotFoundException("ID de usuario inválido")
      }

      // Buscar el usuario sin filtrar por rol específico
      const user = await this.userModel
        .findOne({
          _id: userId,
          state: true,
        })
        .populate("assignedRol")

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`)
      }

      // Obtener el nombre o código del rol del usuario
      const userRole = user.assignedRol.name

      // Si el usuario es almacenista, devolver todos los bienes
      if (userRole.toLowerCase() === "almacenista") {
        return await this.getAlmacenistaResponse(user)
      }

      // Para los demás roles, continuar con la lógica existente
      return await this.getTecnicoResponse(user, userRole)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error(`Error al buscar órdenes para técnico: ${error.message}`, error.stack)
      throw new BadRequestException("Error al buscar órdenes para técnico: " + error.message)
    }
  }

  /**
   * Genera respuesta específica para almacenistas
   */
  private async getAlmacenistaResponse(user: any): Promise<any> {
    // Consultar todos los bienes/activos
    const activos = await this.assetModel
      .find({ status: true })
      .select("name location acquisitionDate inventoryCode serialNumber categoryId status")
      .populate("categoryId", "name")
      .exec()

    this.logger.log(`Generando respuesta para almacenista: ${user.name} con ${activos.length} activos`)

    // Crear una respuesta específica para almacenistas
    return {
      usuario: this.formatUserInfo(user),
      activos: activos.map((activo) => ({
        id: activo._id.toString(),
        nombre: activo.name,
        ubicacion: activo.location,
        fechaAdquisicion: activo.acquisitionDate,
        codigoInventario: activo.inventoryCode,
        numeroSerie: activo.serialNumber,
        categoria: activo.categoryId ? activo.categoryId.name : "No disponible",
        estado: activo.status,
      })),
      total: activos.length,
    }
  }

  /**
   * Genera respuesta para técnicos e instructores
   */
  private async getTecnicoResponse(user: any, userRole: string): Promise<TecnicoOrdenesResponse> {
    // Crear un filtro dinámico basado en el rol del usuario
    // MODIFICACIÓN: Buscar órdenes activas (state = false)
    const ordenesFilter: any = { state: false }

    // Aplicar filtros según el rol
    if (userRole.toLowerCase() === "técnico") {
      ordenesFilter.tecnicoId = user._id
    } else if (userRole.toLowerCase() === "instructor") {
      ordenesFilter.instructorId = user._id
    }

    this.logger.log(`Buscando órdenes para ${userRole}: ${user.name} con filtro: ${JSON.stringify(ordenesFilter)}`)

    // Aplicar el filtro dinámico a la consulta
    const ordenes = await this.OrdenModel.find(ordenesFilter).exec()

    // Obtener IDs de órdenes y solicitudes
    const ordenesIds = ordenes.map((orden) => orden._id)
    const solicitudIds = ordenes.map((orden) => orden.solicitud)

    // Buscar las solicitudes de mantenimiento
    const solicitudes = await this.maintenanceModel.find({ _id: { $in: solicitudIds } }).exec()

    // Crear un mapa de solicitudes por ID
    const solicitudesPorId = new Map()
    solicitudes.forEach((solicitud) => {
      solicitudesPorId.set(solicitud._id.toString(), solicitud)
    })

    // Obtener los números de serie de los activos
    const serialNumbers = solicitudes
      .filter((solicitud) => solicitud.serialNumber)
      .map((solicitud) => solicitud.serialNumber)

    // Buscar los activos por número de serie
    const activos = await this.assetModel
      .find({ serialNumber: { $in: serialNumbers } })
      .select("name location acquisitionDate inventoryCode serialNumber categoryId status")
      .populate("categoryId", "name")
      .exec()

    // Crear un mapa de activos por número de serie
    const activosPorSerial = new Map()
    activos.forEach((activo) => {
      activosPorSerial.set(activo.serialNumber, activo)
    })

    // Buscar mantenimientos e informes
    const [mantenimientos, informes] = await Promise.all([
      this.MantimientoModel.find({ wordOrdenId: { $in: ordenesIds } }).exec(),
      this.workReportModel.find({ orderId: { $in: ordenesIds } }).exec(),
    ])

    // Organizar mantenimientos e informes por orden
    const mantenimientosPorOrden = this.groupByOrderId(mantenimientos, "wordOrdenId")
    const informesPorOrden = this.groupByOrderId(informes, "orderId")

    // Calcular totales
    const totalMantenimientos = mantenimientos.length
    const totalInformes = informes.length

    // Construir respuesta detallada
    const ordenesConDetalles = await this.buildDetailedOrders(
      ordenes,
      solicitudesPorId,
      activosPorSerial,
      mantenimientosPorOrden,
      informesPorOrden,
    )

    return {
      usuario: this.formatUserInfo(user),
      ordenes: ordenesConDetalles,
      total: ordenes.length,
      totalMantenimientos,
      totalInformes,
    }
  }

  /**
   * Agrupa elementos por ID de orden
   */
  private groupByOrderId(items: any[], idField: string): Map<string, any[]> {
    const itemsPorOrden = new Map()
    items.forEach((item) => {
      const ordenId = item[idField].toString()
      if (!itemsPorOrden.has(ordenId)) {
        itemsPorOrden.set(ordenId, [])
      }
      itemsPorOrden.get(ordenId).push(item)
    })
    return itemsPorOrden
  }

  /**
   * Construye órdenes detalladas con toda la información relacionada
   */
  private async buildDetailedOrders(
    ordenes: any[],
    solicitudesPorId: Map<string, any>,
    activosPorSerial: Map<string, any>,
    mantenimientosPorOrden: Map<string, any[]>,
    informesPorOrden: Map<string, any[]>,
  ): Promise<any[]> {
    return ordenes.map((orden) => {
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
        codigoInventario: "No disponible",
        categoria: "No disponible",
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

      // Calcular días restantes o días de retraso
      const now = new Date()
      const fechaFin = new Date(orden.fechaFin)
      const diffTime = fechaFin.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const diasRestantes = diffDays > 0 ? diffDays : 0
      const diasRetraso = diffDays < 0 ? Math.abs(diffDays) : 0

      // Verificar si la orden está finalizada (state = true)
      const estaFinalizada = orden.state === true;

      return {
        id: ordenId,
        radicado: orden.radicado,
        fechaInicio: orden.fechaInicio,
        fechaFin: orden.fechaFin,
        prioridad: orden.prioridad,
        solicitud: {
          solicitudId: orden.solicitud.toString(),
          trackingNumber: solicitud ? solicitud.trackingNumber : "No disponible",
          maintenanceType: solicitud ? solicitud.maintenanceType : "No disponible",
        },
        estado: orden.state,
        fechaCreacion: orden.createdAt,
        fechaActualizacion: orden.updatedAt,
        estadoTiempo: {
          diasRestantes,
          diasRetraso,
          estaVencida: diffDays < 0 && !estaFinalizada,
          estaProximaAVencer: !estaFinalizada && diasRestantes <= 3 && diasRestantes > 0,
          estaFinalizada: estaFinalizada
        },
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
  }

  /**
   * Formatea la información del usuario para la respuesta
   */
  private formatUserInfo(user: any): any {
    return {
      id: user._id.toString(),
      nombre: user.name,
      email: user.email,
      telefono: user.phone || "No disponible",
      cargo: user.assignedPosition,
      documento: {
        tipo: user.typeDocument,
        numero: user.numberDocument,
      },
    }
  }

  /**
   * Obtiene estadísticas de órdenes de trabajo
   */
  async getWorkOrdenstatics(): Promise<any> {
    try {
      this.logger.log("Generando estadísticas de órdenes de trabajo")

      const now = new Date()

      // Obtener todas las órdenes
      const totalOrders = await this.OrdenModel.find().exec()

      // Filtrar por diferentes estados
      // MODIFICACIÓN: Ajustar los filtros según la lógica correcta
      const executedOrders = totalOrders.filter((order) => order.state === true).length
      const expiredOrders = totalOrders.filter(
        (order) => new Date(order.fechaFin) < now && order.state === false,
      ).length
      const pendingOrders = totalOrders.filter(
        (order) => new Date(order.fechaFin) >= now && order.state === false,
      ).length
      const aboutToExpireOrders = totalOrders.filter((order) => {
        const fechaFin = new Date(order.fechaFin)
        const diffTime = fechaFin.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 3 && diffDays > 0 && order.state === false
      }).length

      // Estadísticas por técnico
      const ordersByTechnician = await this.OrdenModel.aggregate([
        {
          $group: {
            _id: "$tecnicoId",
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $eq: ["$state", true] }, 1, 0],
              },
            },
            expired: {
              $sum: {
                $cond: [{ $and: [{ $lt: ["$fechaFin", now] }, { $eq: ["$state", false] }] }, 1, 0],
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "tecnico",
          },
        },
        {
          $unwind: "$tecnico",
        },
        {
          $project: {
            _id: 1,
            tecnicoNombre: "$tecnico.name",
            total: 1,
            completed: 1,
            expired: 1,
            pendientes: { $subtract: ["$total", { $add: ["$completed", "$expired"] }] },
          },
        },
      ])

      return {
        resumen: {
          total: totalOrders.length,
          ejecutadas: executedOrders,
          vencidas: expiredOrders,
          pendientes: pendingOrders,
          proximasAVencer: aboutToExpireOrders,
        },
        porTecnico: ordersByTechnician,
        ultimaActualizacion: now,
      }
    } catch (error) {
      this.logger.error(`Error al generar estadísticas: ${error.message}`, error.stack)
      throw new BadRequestException("Error al generar estadísticas: " + error.message)
    }
  }

  /**
   * Actualiza una orden de trabajo
   * MODIFICACIÓN: Añadido manejo para finalizar órdenes antes de vencer
   */
  async update(id: string, updateDto: UpdateWordOrdenDto): Promise<OrdenesTrabajo> {
    try {
      this.logger.log(`Actualizando orden de trabajo con ID: ${id}`)

      // Validar fechas si se proporcionan
      if (updateDto.fechaInicio || updateDto.fechaFin) {
        await this.validateDates(updateDto)
      }

      // Verificar si la orden existe
      const orden = await this.OrdenModel.findById(id)
      if (!orden) {
        throw new NotFoundException(`Orden de trabajo con ID ${id} no encontrada`)
      }

      // MODIFICACIÓN: Si se está finalizando la orden (cambiando state a true)
      if (updateDto.state === true && orden.state === false) {
        this.logger.log(`Finalizando orden de trabajo: ${orden.radicado} antes de su fecha de vencimiento`)
        
        // Cancelar cualquier notificación pendiente marcando como notificada
        updateDto.notifiedExpiration = true
      }

      // Actualizar la orden
      const updatedOrden = await this.OrdenModel.findByIdAndUpdate(id, updateDto, { new: true })
      
      // Si se finalizó la orden, actualizar también la solicitud
      if (updateDto.state === true && orden.state === false) {
        await this.maintenanceModel.findByIdAndUpdate(orden.solicitud, { workOrderStatus: false })
      }

      return updatedOrden
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error(`Error al actualizar orden de trabajo: ${error.message}`, error.stack)
      throw new BadRequestException("Error al actualizar la orden de trabajo: " + error.message)
    }
  }
}