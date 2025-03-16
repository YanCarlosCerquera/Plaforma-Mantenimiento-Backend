import { IsBoolean, IsOptional, IsString } from "class-validator"

/**
 * DTO para filtrar solicitudes de mantenimiento
 */
export class FilterMaintenanceRequestDto {
  @IsOptional()
  @IsString()
  trackingNumber?: string

  @IsOptional()
  @IsString()
  serialNumber?: string

  @IsOptional()
  @IsString()
  maintenanceType?: string

  @IsOptional()
  @IsBoolean()
  workOrderStatus?: boolean

  @IsOptional()
  @IsString()
  requesterName?: string
}

