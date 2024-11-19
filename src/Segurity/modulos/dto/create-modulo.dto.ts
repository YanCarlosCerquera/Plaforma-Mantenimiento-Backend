import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CreateModuloDto {
    @ApiProperty({ description: 'nombre del modulo' })
    @IsNotEmpty({ message: 'El nombre es obligatoria' })
    @IsString()
    name: string

    @ApiProperty({ description: 'descripción del modulo' })
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    @IsString()
    description: string

    @ApiProperty({
      description: 'Estado del modulo (activo o inactivo)',
      required: false,
    })
    @IsOptional()
    @IsBoolean()
    state?: boolean;
}
