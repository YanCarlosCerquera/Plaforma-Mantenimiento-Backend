import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional } from "class-validator"

export class CreateViewDto {
  @IsNotEmpty({ message: 'El nombre es obligatoria' })
  name: string

  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description: string

  @IsNotEmpty({ message: 'La ruta es obligatoria' })
  route: string

  @IsMongoId({ message: 'El módulo debe ser un ObjectId válido' })
  @IsNotEmpty({ message: 'El módulo es obligatoria' })
  moduloId: string

  @IsOptional()
  @IsBoolean()
  state?: boolean;
}
