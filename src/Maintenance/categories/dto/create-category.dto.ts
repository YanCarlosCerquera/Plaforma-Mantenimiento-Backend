import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {
    @ApiProperty({ description: 'Nombre de la categoría' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString()
    name: string;

    @ApiProperty({ 
        description: 'Variables de operación relacionadas con la categoría',
        type: [String] 
    })
    @IsNotEmpty({ message: 'Las variables de operación son obligatorias' })
    @IsArray()
    @IsString({ each: true })
    operationVars: string[];

    @ApiProperty({ 
        description: 'Accesorios relacionados con la categoría', 
        type: [String] 
    })
    @IsNotEmpty({ message: 'Los accesorios son obligatorios' })
    @IsArray()
    @IsString({ each: true })
    accessories: string[];

    @ApiProperty({ 
        description: 'Especificaciones de la categoría', 
        type: [String] 
    })
    @IsNotEmpty({ message: 'Las especificaciones son obligatorias' })
    @IsArray()
    @IsString({ each: true })
    specs: string[];

    @ApiProperty({
        description: 'Estado de la categoría (activo o inactivo)',
        required: false
    })
    @IsOptional()
    @IsBoolean()
    state?: boolean;
}

