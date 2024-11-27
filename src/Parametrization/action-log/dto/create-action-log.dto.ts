import { IsString, IsNotEmpty, IsMongoId, IsDate, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActionLogDto {
  @IsMongoId({ message: 'El userId debe ser un ObjectId válido' })
  @IsNotEmpty({ message: 'El userId es obligatorio' })
  userId: string;

  @IsDate({ message: 'El campo dateTime debe ser una fecha válida' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'El campo dateTime es obligatorio' })
  dateTime: Date;

  @IsString({ message: 'El campo action debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El campo action es obligatorio' })
  action: string;

  @IsMongoId({ message: 'El moduloId debe ser un ObjectId válido' })
  @IsNotEmpty({ message: 'El moduloId es obligatorio' })
  moduloId: string;

  @IsOptional()
  @IsBoolean()
  state?: boolean;
}