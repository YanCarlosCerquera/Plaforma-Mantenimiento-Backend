import { BadRequestException, Injectable, Logger } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { type Model, Types } from "mongoose"
import type { CreateApplicationMaintenanceDto } from "./dto/create-application-maintenance.dto"
import type { UpdateApplicationMaintenanceDto } from "./dto/update-application-maintenance.dto"
import { GenericService } from "src/Generic/generic.service"
import { MaintenanceRequest } from "./entities/application-maintenance.entity"
import { Assets } from "../assets/entities/asset.entity"
import { User } from "src/users/entities/user.entity"
import { Rol } from "src/Segurity/rol/entities/rol.entity"
import { NotificationService } from "./services/notification.service"
import { FilterMaintenanceRequestDto } from "./interfaces/filter-maintenance-request.dto"

/**
 * Servicio para gestionar solicitudes de mantenimiento de aplicaciones
 */
@Injectable()
export class ApplicationMaintenanceService extends GenericService<
  MaintenanceRequest,
  CreateApplicationMaintenanceDto,
  UpdateApplicationMaintenanceDto
> {
  private readonly logger = new Logger(ApplicationMaintenanceService.name);

  constructor(
    @InjectModel(MaintenanceRequest.name) private readonly maintenanceModel: Model<MaintenanceRequest>,
    @InjectModel(Assets.name) private readonly assetModel: Model<Assets>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Rol.name) private readonly roleModel: Model<Rol>,
    private readonly notificationService: NotificationService,
  ) {
    super(maintenanceModel);
  }

  /**
   * Crea una nueva solicitud de mantenimiento
   * @param createDto Datos para crear la solicitud
   * @returns La solicitud creada
   */
  async create(createDto: CreateApplicationMaintenanceDto): Promise<MaintenanceRequest> {
    try {
      this.logger.log(
        `Creando solicitud de mantenimiento para el activo con número de serie: ${createDto.serialNumber}`,
      )

      // Validar el número de serie y otros datos
      await this.validateSerialNumber(createDto)

      // Crear la solicitud de mantenimiento
      const createdRequest = await this.createMaintenanceRequest(createDto)

      // Enviar notificaciones
      await this.handleMaintenanceNotifications(createdRequest)

      return createdRequest
    } catch (error) {
      this.handleError(error, "Error al crear la solicitud de mantenimiento")
    }
  }

  /**
   * Busca solicitudes de mantenimiento con filtros opcionales
   * @param filterDto Filtros para la búsqueda
   * @returns Lista de solicitudes que cumplen con los filtros
   */
  async findAll(filterDto?: FilterMaintenanceRequestDto): Promise<MaintenanceRequest[]> {
    try {
      const filter: any = {}

      // Aplicar filtros si se proporcionan
      if (filterDto) {
        if (filterDto.trackingNumber) {
          filter.trackingNumber = { $regex: filterDto.trackingNumber, $options: "i" }
        }
        if (filterDto.serialNumber) {
          filter.serialNumber = filterDto.serialNumber
        }
        if (filterDto.maintenanceType) {
          filter.maintenanceType = filterDto.maintenanceType
        }
        if (filterDto.workOrderStatus !== undefined) {
          filter.workOrderStatus = filterDto.workOrderStatus
        }
        if (filterDto.requesterName) {
          filter.requesterName = { $regex: filterDto.requesterName, $options: "i" }
        }
      }

      return await this.maintenanceModel.find(filter).sort({ createdAt: -1 }).exec()
    } catch (error) {
      this.handleError(error, "Error al buscar solicitudes de mantenimiento")
    }
  }

  /**
   * Actualiza una solicitud de mantenimiento existente
   * @param id ID de la solicitud a actualizar
   * @param updateDto Datos para actualizar
   * @returns La solicitud actualizada
   */
  async update(id: string, updateDto: UpdateApplicationMaintenanceDto): Promise<MaintenanceRequest> {
    try {
      this.logger.log(`Actualizando solicitud de mantenimiento con ID: ${id}`)

      // Verificar si la solicitud existe
      const existingRequest = await this.maintenanceModel.findById(id)
      if (!existingRequest) {
        throw new BadRequestException(`Solicitud de mantenimiento con ID ${id} no encontrada`)
      }

      // Si se está actualizando el número de serie, validarlo
      if (updateDto.serialNumber && updateDto.serialNumber !== existingRequest.serialNumber) {
        await this.validateSerialNumber(updateDto)
      }

      // Actualizar la solicitud
      const updatedRequest = await this.maintenanceModel.findByIdAndUpdate(id, updateDto, { new: true })

      // Si se cambió el estado de la orden de trabajo, enviar notificaciones
      if (updateDto.workOrderStatus !== undefined && updateDto.workOrderStatus !== existingRequest.workOrderStatus) {
        await this.handleStatusChangeNotifications(updatedRequest)
      }

      return updatedRequest
    } catch (error) {
      this.handleError(error, `Error al actualizar la solicitud de mantenimiento con ID ${id}`)
    }
  }

  /**
   * Consulta una solicitud de mantenimiento por ID con información detallada
   * @param id ID de la solicitud
   * @returns Solicitud con información detallada del activo
   */
  async consultarPorId(id: string) {
    try {
      this.logger.log(`Consultando solicitud de mantenimiento con ID: ${id}`)

      const objectId = new Types.ObjectId(id)
      const result = await this.maintenanceModel.aggregate([
        {
          $match: { _id: objectId },
        },
        {
          $lookup: {
            from: "assets",
            localField: "serialNumber",
            foreignField: "serialNumber",
            as: "assetInfo",
          },
        },
        {
          $unwind: "$assetInfo",
        },
        {
          $lookup: {
            from: "environments",
            localField: "assetInfo.environmentId",
            foreignField: "_id",
            as: "environmentInfo",
          },
        },
        {
          $unwind: {
            path: "$environmentInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "trainingcenters",
            localField: "environmentInfo.trainingCenter",
            foreignField: "_id",
            as: "trainingCenterInfo",
          },
        },
        {
          $unwind: {
            path: "$trainingCenterInfo",
            preserveNullAndEmptyArrays: true,
          },
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
              brand: 1,
              modelo: 1,
              equipmentType: 1,
              serialNumber: 1,
              inventoryCode: 1,
              accountHolder: 1,
              status: 1,
            },
            environmentInfo: {
              _id: 1,
              name: 1,
              code: 1,
              capacity: 1,
              building: 1,
              floor: 1,
            },
            trainingCenterInfo: {
              _id: 1,
              name: 1,
              code: 1,
              location: 1,
            },
          },
        },
      ])

      if (!result.length) {
        throw new BadRequestException("Solicitud de mantenimiento no encontrada")
      }

      return result[0]
    } catch (error) {
      this.handleError(error, "Error al consultar la solicitud de mantenimiento")
    }
  }

  /**
   * Obtiene estadísticas de las solicitudes de mantenimiento
   * @returns Estadísticas de solicitudes
   */
  async getMaintenanceStatistics(): Promise<{
    All: number
    Executed: number
    Pending: number
  }> {
    try {
      this.logger.log("Obteniendo estadísticas de mantenimiento")

      const allMaintenance = await this.maintenanceModel.find({ deletedAt: null }).exec()
      const total = allMaintenance.length
      const completed = allMaintenance.filter((m) => m.workOrderStatus === true).length
      const pending = allMaintenance.filter((m) => m.workOrderStatus === false).length

      return {
        All: total,
        Executed: completed,
        Pending: pending,
      }
    } catch (error) {
      this.handleError(error, "Error al obtener estadísticas de mantenimiento")
    }
  }

  /**
   * Crea una solicitud de mantenimiento en la base de datos
   * @param dto Datos para crear la solicitud
   * @returns La solicitud creada
   * @private
   */
  private async createMaintenanceRequest(dto: CreateApplicationMaintenanceDto): Promise<MaintenanceRequest> {
    try {
      const maintenanceRequest = new this.maintenanceModel(dto)
      return await maintenanceRequest.save()
    } catch (error) {
      throw new BadRequestException("Error al guardar la solicitud de mantenimiento")
    }
  }

  /**
   * Maneja el envío de notificaciones cuando se crea una solicitud de mantenimiento
   * @param maintenanceRequest La solicitud creada
   * @private
   */
  private async handleMaintenanceNotifications(maintenanceRequest: MaintenanceRequest): Promise<void> {
    try {
      this.logger.log(`Iniciando proceso de notificaciones para la solicitud: ${maintenanceRequest.trackingNumber}`)

      const notifications: Promise<void>[] = []

      // 1. Buscar al administrador (único, con rol de Admin)
      const admin = await this.findAdminUser()

      // 2. Buscar al instructor responsable del ambiente donde está el activo
      const responsibleUser = await this.findUserToNotify(maintenanceRequest.serialNumber)

      // 3. Obtener información básica del activo
      const assetInfo = await this.getAssetBasicInfo(maintenanceRequest.serialNumber)

      // 4. Notificar al administrador
      if (admin) {
        if (admin.email) {
          this.logger.log(`Enviando correo al administrador: ${admin.name}`)
          notifications.push(
            this.notificationService.sendNotificationEmail(
              {
                to: admin.email,
                subject: `Nueva solicitud de mantenimiento - ${maintenanceRequest.trackingNumber}`,
                body: "",
              },
              {
                recipientName: admin.name,
                recipientPhone: admin.phoneNumber,
                trackingNumber: maintenanceRequest.trackingNumber,
                maintenanceType: maintenanceRequest.maintenanceType,
                description: maintenanceRequest.issueDescription,
                requesterName: maintenanceRequest.requesterName,
                isRequester: false,
                role: "administrador", // Cambiado de "Administrador" a "administrador"
                environmentName: responsibleUser?.environmentName || "No especificado",
                assetInfo: assetInfo || "No disponible",
              },
            ),
          )
        }

        if (admin.phoneNumber) {
          this.logger.log(`Enviando SMS al administrador: ${admin.name} (${admin.phoneNumber})`)
          notifications.push(
            this.notificationService.sendNotification({
              recipientName: admin.name,
              recipientPhone: admin.phoneNumber,
              trackingNumber: maintenanceRequest.trackingNumber,
              maintenanceType: maintenanceRequest.maintenanceType,
              description: maintenanceRequest.issueDescription,
              requesterName: maintenanceRequest.requesterName,
              isRequester: false,
              role: "administrador", // Cambiado de "Administrador" a "administrador"
              environmentName: responsibleUser?.environmentName || "No especificado",
              assetInfo: assetInfo || "No disponible",
            }),
          )
        }
      } else {
        this.logger.warn("No se encontró un administrador para notificar")
      }

      // 5. Notificar al usuario responsable del ambiente
      if (responsibleUser) {
        if (responsibleUser.email) {
          this.logger.log(
            `Enviando correo al responsable del ambiente: ${responsibleUser.name} (${responsibleUser.email})`,
          )
          notifications.push(
            this.notificationService.sendNotificationEmail(
              {
                to: responsibleUser.email,
                subject: `Nueva solicitud de mantenimiento - ${maintenanceRequest.trackingNumber}`,
                body: "",
              },
              {
                recipientName: responsibleUser.name,
                recipientPhone: responsibleUser.phoneNumber,
                trackingNumber: maintenanceRequest.trackingNumber,
                maintenanceType: maintenanceRequest.maintenanceType,
                description: maintenanceRequest.issueDescription,
                requesterName: maintenanceRequest.requesterName,
                isRequester: false,
                role: "Instructor",
                environmentName: responsibleUser.environmentName,
                assetInfo: assetInfo || "No disponible",
              },
            ),
          )
        }

        if (responsibleUser.phoneNumber) {
          this.logger.log(
            `Enviando SMS al responsable del ambiente: ${responsibleUser.name} (${responsibleUser.phoneNumber})`,
          )
          notifications.push(
            this.notificationService.sendNotification({
              recipientName: responsibleUser.name,
              recipientPhone: responsibleUser.phoneNumber,
              trackingNumber: maintenanceRequest.trackingNumber,
              maintenanceType: maintenanceRequest.maintenanceType,
              description: maintenanceRequest.issueDescription,
              requesterName: maintenanceRequest.requesterName,
              isRequester: false,
              role: "Instructor",
              environmentName: responsibleUser.environmentName,
              assetInfo: assetInfo || "No disponible",
            }),
          )
        }
      } else {
        this.logger.warn("No se encontró un responsable del ambiente para notificar")
      }

      // 6. Notificar al solicitante
      if (maintenanceRequest.requesterPhone && maintenanceRequest.requesterName) {
        this.logger.log(
          `Enviando SMS al solicitante: ${maintenanceRequest.requesterName} (${maintenanceRequest.requesterPhone})`,
        )
        notifications.push(
          this.notificationService.sendNotification({
            recipientName: maintenanceRequest.requesterName,
            recipientPhone: maintenanceRequest.requesterPhone,
            trackingNumber: maintenanceRequest.trackingNumber,
            maintenanceType: maintenanceRequest.maintenanceType,
            description: maintenanceRequest.issueDescription,
            requesterName: maintenanceRequest.requesterName,
            isRequester: true,
            environmentName: responsibleUser?.environmentName || "No especificado",
            assetInfo: assetInfo || "No disponible",
          }),
        )
      } else {
        this.logger.warn("No se pudo notificar al solicitante debido a falta de información")
      }

      // Enviar todas las notificaciones en paralelo
      if (notifications.length > 0) {
        const results = await Promise.allSettled(notifications)
        const successful = results.filter((r) => r.status === "fulfilled").length
        const failed = results.filter((r) => r.status === "rejected").length

        this.logger.log(`Se enviaron ${successful} notificaciones exitosamente y fallaron ${failed}`)
      } else {
        this.logger.warn("No se pudo enviar ninguna notificación")
      }
    } catch (error) {
      this.logger.error("Error al enviar notificaciones", error)
    }
  }

  /**
   * Maneja el envío de notificaciones cuando cambia el estado de una solicitud
   * @param maintenanceRequest La solicitud actualizada
   * @private
   */
  private async handleStatusChangeNotifications(maintenanceRequest: MaintenanceRequest): Promise<void> {
    try {
      this.logger.log(
        `Enviando notificaciones por cambio de estado de la solicitud: ${maintenanceRequest.trackingNumber}`,
      )

      const notifications: Promise<void>[] = []
      const statusText = maintenanceRequest.workOrderStatus ? "completada" : "en proceso"

      // 1. Buscar al administrador
      const admin = await this.findAdminUser()

      // 2. Buscar al instructor responsable
      const responsibleUser = await this.findUserToNotify(maintenanceRequest.serialNumber)

      // 3. Obtener información básica del activo
      const assetInfo = await this.getAssetBasicInfo(maintenanceRequest.serialNumber)

      // 4. Notificar al administrador sobre el cambio de estado
      if (admin && admin.email) {
        this.logger.log(`Enviando correo al administrador sobre cambio de estado: ${admin.name} (${admin.email})`)
        notifications.push(
          this.notificationService.sendNotificationEmail(
            {
              to: admin.email,
              subject: `Actualización de solicitud - ${maintenanceRequest.trackingNumber}`,
              body: "",
            },
            {
              recipientName: admin.name,
              recipientPhone: admin.phoneNumber,
              trackingNumber: maintenanceRequest.trackingNumber,
              maintenanceType: maintenanceRequest.maintenanceType,
              description: `La solicitud de mantenimiento ahora está ${statusText}`,
              requesterName: maintenanceRequest.requesterName,
              isRequester: false,
              role: "administrador", // Cambiado de "Administrador" a "administrador"
              environmentName: responsibleUser?.environmentName || "No especificado",
              assetInfo: assetInfo || "No disponible",
            },
          ),
        )
      }

      // 5. Notificar al solicitante sobre el cambio de estado
      if (maintenanceRequest.requesterPhone && maintenanceRequest.requesterName) {
        this.logger.log(
          `Enviando SMS al solicitante sobre cambio de estado: ${maintenanceRequest.requesterName} (${maintenanceRequest.requesterPhone})`,
        )
        notifications.push(
          this.notificationService.sendNotification({
            recipientName: maintenanceRequest.requesterName,
            recipientPhone: maintenanceRequest.requesterPhone,
            trackingNumber: maintenanceRequest.trackingNumber,
            maintenanceType: maintenanceRequest.maintenanceType,
            description: `Su solicitud de mantenimiento ahora está ${statusText}`,
            requesterName: maintenanceRequest.requesterName,
            isRequester: true,
            environmentName: responsibleUser?.environmentName || "No especificado",
            assetInfo: assetInfo || "No disponible",
          }),
        )
      }

      // Enviar todas las notificaciones en paralelo
      if (notifications.length > 0) {
        await Promise.allSettled(notifications)
        this.logger.log(`Se enviaron ${notifications.length} notificaciones de cambio de estado`)
      }
    } catch (error) {
      this.logger.error("Error al enviar notificaciones de cambio de estado", error)
    }
  }

  /**
   * Busca al usuario administrador para notificaciones
   * @returns Datos del administrador o null si no se encuentra
   * @private
   */
  private async findAdminUser(): Promise<{ email: string; phoneNumber: string; name: string | null }> {
    try {
      // Buscar el rol de administrador con diferentes variantes de nombre
      const adminRoleNames = ["Administrador", "administrador", "ADMINISTRADOR", "Admin", "admin"]

      let adminRole = null
      for (const roleName of adminRoleNames) {
        adminRole = await this.roleModel.findOne({
          name: { $regex: new RegExp(`^${roleName}$`, "i") },
        })

        if (adminRole) {
          this.logger.log(`Rol de administrador encontrado con nombre: ${adminRole.name}`)
          break
        }
      }

      if (!adminRole) {
        // Si no se encuentra por nombre, intentar buscar directamente el ID del rol que proporcionaste
        const knownAdminRoleId = "673c9f508667ad0a336e9538"
        adminRole = await this.roleModel.findById(knownAdminRoleId)

        if (adminRole) {
          this.logger.log(`Rol de administrador encontrado por ID: ${knownAdminRoleId}`)
        } else {
          this.logger.warn("No se encontró el rol de Administrador por nombre ni por ID conocido")

          // Como último recurso, buscar directamente al usuario administrador por ID
          const adminUserId = "67573bd682edcf86597ba753"
          const adminUser = await this.userModel.findById(adminUserId)

          if (adminUser && adminUser.state) {
            this.logger.log(`Usuario administrador encontrado directamente por ID: ${adminUserId}`)
            return {
              email: adminUser.email,
              phoneNumber: adminUser.phone,
              name: adminUser.name,
            }
          }

          return null
        }
      }

      // Buscar un usuario con ese rol
      const adminUser = await this.userModel.findOne({
        assignedRol: adminRole._id,
        state: true, // Solo usuarios activos
      })

      if (!adminUser) {
        this.logger.warn(`No se encontró ningún usuario con rol de ${adminRole.name}`)

        // Como último recurso, buscar directamente al usuario administrador por ID
        const adminUserId = "67573bd682edcf86597ba753"
        const directAdminUser = await this.userModel.findById(adminUserId)

        if (directAdminUser && directAdminUser.state) {
          this.logger.log(`Usuario administrador encontrado directamente por ID: ${adminUserId}`)
          return {
            email: directAdminUser.email,
            phoneNumber: directAdminUser.phone,
            name: directAdminUser.name,
          }
        }

        return null
      }

      return {
        email: adminUser.email,
        phoneNumber: adminUser.phone,
        name: adminUser.name,
      }
    } catch (error) {
      this.logger.error("Error al buscar el administrador", error)
      return null
    }
  }

  /**
   * Busca al usuario responsable del ambiente donde está el activo
   * @param serialNumber Número de serie del activo
   * @returns Datos del usuario responsable o null si no se encuentra
   * @private
   */
  private async findUserToNotify(serialNumber: string): Promise<{
    email: string
    phoneNumber: string
    name: string
    environmentName: string | null
  }> {
    try {
      // Agregación para encontrar al usuario responsable del ambiente donde está el activo
      const result = await this.assetModel.aggregate([
        // 1. Buscar el activo por número de serie
        {
          $match: { serialNumber },
        },
        // 2. Buscar el ambiente asociado al activo
        {
          $lookup: {
            from: "environments", // Nombre correcto de la colección
            localField: "environmentId",
            foreignField: "_id",
            as: "environment",
          },
        },
        {
          $unwind: "$environment",
        },
        // 3. Buscar el usuario responsable del ambiente
        {
          $lookup: {
            from: "users",
            localField: "environment.responsibleUser",
            foreignField: "_id",
            as: "responsibleUser",
          },
        },
        {
          $unwind: "$responsibleUser",
        },
        // 4. Proyectar solo los campos necesarios
        {
          $project: {
            email: "$responsibleUser.email",
            phoneNumber: "$responsibleUser.phone",
            name: "$responsibleUser.name",
            environmentName: "$environment.name", // Incluir el nombre del ambiente
          },
        },
      ])

      if (result.length === 0) {
        this.logger.warn(
          `No se encontró información del usuario responsable para el activo con número de serie ${serialNumber}`,
        )
        return null
      }

      return result[0]
    } catch (error) {
      this.logger.error("Error al buscar usuario para notificar", error)
      return null
    }
  }

  /**
   * Obtiene información básica del activo para incluir en las notificaciones
   * @param serialNumber Número de serie del activo
   * @returns Descripción básica del activo o null si no se encuentra
   * @private
   */
  private async getAssetBasicInfo(serialNumber: string): Promise<string | null> {
    try {
      const asset = await this.assetModel.findOne({ serialNumber })

      if (!asset) {
        return null
      }

      return `${asset.name} ${asset.brand} ${asset.modelo} (S/N: ${asset.serialNumber})`
    } catch (error) {
      this.logger.error("Error al obtener información básica del activo", error)
      return null
    }
  }

  /**
   * Valida el número de serie y otros datos de la solicitud
   * @param dto Datos de la solicitud
   * @private
   */
  private async validateSerialNumber(
    dto: CreateApplicationMaintenanceDto | UpdateApplicationMaintenanceDto,
  ): Promise<void> {
    if (!dto.serialNumber?.trim()) {
      throw new BadRequestException("El número de serie es obligatorio.")
    }

    const [asset, existingRequest] = await Promise.all([
      this.assetModel.findOne({ serialNumber: dto.serialNumber }),
      dto.trackingNumber
        ? this.maintenanceModel.findOne({
            trackingNumber: dto.trackingNumber,
            _id: { $ne: dto.InventoryCode }, 
          })
        : null,
    ])

    if (!asset) {
      throw new BadRequestException(`El número de serie '${dto.serialNumber}' no está registrado.`)
    }

    if (existingRequest) {
      throw new BadRequestException(`El número de seguimiento '${dto.trackingNumber}' ya está registrado.`)
    }
  }

  /**
   * Maneja errores de forma consistente
   * @param error Error capturado
   * @param defaultMessage Mensaje por defecto
   * @private
   */
  private handleError(error: any, defaultMessage: string) {
    if (error instanceof BadRequestException) {
      throw error
    }
    this.logger.error(defaultMessage, error)
    throw new BadRequestException(defaultMessage)
  }
}

