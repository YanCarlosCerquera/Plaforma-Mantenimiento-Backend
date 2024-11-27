import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString()
    name: string;

    @IsNotEmpty({ message: 'Las variables de operación son obligatorias' })
    @IsArray()
    @IsString({ each: true })
    operationVars: string[];

    @IsNotEmpty({ message: 'Los accesorios son obligatorios' })
    @IsArray()
    @IsString({ each: true })
    accessories: string[];

    @IsNotEmpty({ message: 'Las especificaciones son obligatorias' })
    @IsArray()
    @IsString({ each: true })
    specs: string[];

    @IsOptional()
    @IsBoolean()
    state?: boolean;
}

