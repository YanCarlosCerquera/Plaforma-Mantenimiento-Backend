import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional } from "class-validator"

export class CreateViewDto {
    @ApiProperty({ description: 'nombre de la vista' })
    @IsNotEmpty({ message: 'El nombre es obligatoria' })
    name: string

    @ApiProperty({ description: 'descripción de la vista' })
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    description: string

    @ApiProperty({ description: 'ruta de la vista' })
    @IsNotEmpty({ message: 'La ruta es obligatoria' })
    route: string

    @IsMongoId({ message: 'El módulo debe ser un ObjectId válido' })
    @ApiProperty({ description: 'módulo de la vista' })
    @IsNotEmpty({ message: 'El módulo es obligatoria' })
    moduloId: string

    @ApiProperty({
        description: 'Estado del rol (activo o inactivo)',
        required: false,
      })
      @IsOptional()
      @IsBoolean()
      state?: boolean;
}
