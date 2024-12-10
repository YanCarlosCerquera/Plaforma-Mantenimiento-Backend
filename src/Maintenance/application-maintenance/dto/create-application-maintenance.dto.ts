import { IsString, IsNotEmpty, IsBoolean, IsOptional, Matches, IsPhoneNumber, MaxLength } from 'class-validator';

export class CreateApplicationMaintenanceDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del solicitante es obligatorio.' })
  @MaxLength(100, { message: 'El nombre del solicitante no debe exceder los 100 caracteres.' })
  requesterName: string;

  @IsString()
  @IsNotEmpty({ message: 'El número de teléfono del solicitante es obligatorio.' })
  @IsPhoneNumber(null, { message: 'El número de teléfono del solicitante debe ser válido.' })
  requesterPhone: string;

  trackingNumber?:string;

  @IsString()
  @IsNotEmpty({ message: 'El número de serie es obligatorio' })
  serialNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'El tipo de mantenimiento es obligatorio.' })
  maintenanceType: string;

@IsString()
@IsNotEmpty({ message: 'El Codigo Inventario es obligatorio.' })
  InventoryCode

  @IsString()
  @IsNotEmpty({ message: 'La descripción de la falla es obligatoria.' })
  @MaxLength(500, { message: 'La descripción de la falla no debe exceder los 500 caracteres.' })
  issueDescription: string;

  @IsBoolean()
  @IsOptional()
  workOrderStatus?: boolean;
}
