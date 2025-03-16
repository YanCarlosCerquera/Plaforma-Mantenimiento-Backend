import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max, IsArray } from "class-validator";
import { EnvironmentType } from "../entities/environment.entity";

export class CreateEnvironmentDto {
  @ApiProperty({ example: "Aula 101", description: "Nombre del ambiente" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "A101", description: "Código único del ambiente" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ 
    example: ["Classroom"], 
    description: "Tipo de ambiente", 
    enum: EnvironmentType,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(EnvironmentType, { each: true })
  typeEnvironment?: EnvironmentType[];

  @ApiProperty({ example: 30, description: "Capacidad del ambiente", minimum: 1, maximum: 500 })
  @IsInt()
  @Min(1)
  @Max(500)
  capacity: number;

  @ApiProperty({ example: 2, description: "Número de piso", required: false })
  @IsOptional()
  @IsInt()
  floor?: number;

  @ApiProperty({ example: "Edificio A", description: "Nombre del edificio", required: false })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiProperty({ example: "60f2b5c7c25e6a0015d36a3b", description: "ID del centro de formación" })
  @IsString()
  @IsNotEmpty()
  trainingCenter: string;

  @ApiProperty({ example: "60f2b5c7c25e6a0015d36a4c", description: "ID del usuario responsable", required: false })
  @IsOptional()
  @IsString()
  responsibleUser?: string;

  @ApiProperty({ example: true, description: "Estado del ambiente", default: true })
  @IsOptional()
  status?: boolean;
}

export class UpdateEnvironmentDto extends CreateEnvironmentDto {}
