import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsMongoId, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRolDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción del rol es obligatoria' })
  description: string;

  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true, message: 'Cada vista debe ser un ObjectId válido' })
  @Type(() => String)
  views: string[];

  @IsOptional()
  @IsBoolean()
  state?: boolean;
}
