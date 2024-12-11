import { IsNotEmpty, IsDate, IsEnum, IsMongoId, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId, Types } from 'mongoose';

class SolicitudDto {
  @IsMongoId()
  @IsNotEmpty()
  solicitudId: ObjectId;
}


export class CreateWordOrdenDto {
  @IsNotEmpty()
  radicado: string;

  @IsMongoId()
  @IsNotEmpty()
  tecnicoId: Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  instructorId: Types.ObjectId;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  fechaInicio: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaFin?: Date;

  @IsEnum(['alta', 'media', 'baja'])
  @IsNotEmpty()
  prioridad: string;

  @ValidateNested()
  @Type(() => SolicitudDto)
  @IsNotEmpty()
  solicitud: SolicitudDto;

  @IsBoolean()
  @IsOptional()
  state?: boolean;
}
