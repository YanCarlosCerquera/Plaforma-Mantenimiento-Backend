import { IsArray, IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString()
    name: string;

    @IsNotEmpty({ message: 'Las variables de operación son obligatorias' })
    @IsArray()
    @IsString({ each: true })
    operationVars: string[];

    @IsNotEmpty({ message: 'Las especificaciones son obligatorias' })
    @IsArray()
    @IsString({ each: true })
    specs: string[];
    
    @IsMongoId()
    assignedRol?:string

    @IsOptional()
    @IsBoolean()
    state?: boolean;
}

