import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsMongoId, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRolDto {
  @ApiProperty({ description: 'Nombre del rol' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  name: string;

  @ApiProperty({ description: 'Descripción del rol',})
  @IsString()
  @IsNotEmpty({ message: 'La descripción del rol es obligatoria' })
  description: string;

  @ApiProperty({
    description: 'Lista de vistas asociadas al rol (referencias a ObjectId de las vistas)',
    required: false,
  })
  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true, message: 'Cada vista debe ser un ObjectId válido' })
  @Type(() => String) 
  views: string[];

  @ApiProperty({
    description: 'Estado del rol (activo o inactivo)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  state?: boolean;
}
