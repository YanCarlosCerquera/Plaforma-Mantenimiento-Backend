import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDepartamentDto {
    @ApiProperty({ description: 'nombre del departamento' })
    @IsNotEmpty({ message: 'El nombre es obligatoria' })
    @IsString()
    name: string

    @ApiProperty({ description: 'descripción del departamento' })
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    @IsString()
    description: string

    @ApiProperty({
        description: 'Estado del departamento (activo o inactivo)',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    state?: boolean;
}
