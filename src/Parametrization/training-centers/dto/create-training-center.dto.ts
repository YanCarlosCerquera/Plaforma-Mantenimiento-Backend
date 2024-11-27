import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTrainingCenterDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString()
    name: string

    @IsNotEmpty({ message: 'La regional es obligatoria' })
    @IsString()
    regional: string

    @IsNotEmpty({ message: 'El codigo es obligatorio' })
    @IsString()
    code: string

    @IsMongoId({ message: 'EL  municipio debe ser un ObjectId válido' })
    @IsNotEmpty({ message: 'El municipio es obligatoria' })
    cityId: string

    @IsOptional()
    @IsBoolean()
    state?: boolean;
}
