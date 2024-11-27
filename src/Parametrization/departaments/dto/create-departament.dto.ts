import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDepartamentDto {
    @IsNotEmpty({ message: 'El nombre es obligatoria' })
    @IsString()
    name: string

    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    @IsString()
    description: string

    @IsOptional()
    @IsBoolean()
    state?: boolean;
}
