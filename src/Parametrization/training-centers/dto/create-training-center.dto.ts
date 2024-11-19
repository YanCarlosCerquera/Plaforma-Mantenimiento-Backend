import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTrainingCenterDto {
    @ApiProperty({ description: 'nombre del centro de formacion' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString()
    name: string

    @ApiProperty({ description: 'regional del centro de formacion' })
    @IsNotEmpty({ message: 'La regional es obligatoria' })
    @IsString()
    regional: string

    @ApiProperty({ description: 'codigo del centro de formacion' })
    @IsNotEmpty({ message: 'El codigo es obligatorio' })
    @IsString()
    code: string

    /*@IsMongoId({ message: 'EL  municipio debe ser un ObjectId válido' })
    @ApiProperty({ description: 'municipio del centro de formacion' })
    @IsNotEmpty({ message: 'El municipio es obligatoria' })
    cityId: string*/

    @ApiProperty({
        description: 'Estado del cenro de formacion (activo o inactivo)',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    state?: boolean;
}
