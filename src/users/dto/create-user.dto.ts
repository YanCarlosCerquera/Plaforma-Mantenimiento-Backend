import { IsString, IsEmail, IsPhoneNumber, IsBoolean, IsOptional, IsNotEmpty, IsIdentityCard, IsMongoId, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { TypeDocuments } from 'src/enum/typeDocument.enum';
import { Positions } from 'src/enum/position.enum';

export class CreateUserDto {

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio y no puede estar vacío.' })
  name: string;

  @IsString()
  @IsOptional()
  photo?: string

  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio y no puede estar vacío.' })
  email: string;

  @IsPhoneNumber(null, { message: 'El número de teléfono debe ser válido.' })
  @IsNotEmpty({ message: 'El número de teléfono es obligatorio y no puede estar vacío.' })
  phone: string;

  @IsEnum(TypeDocuments)
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio y no puede estar vacío.' })
  typeDocument: TypeDocuments;

  @ApiProperty({ description: 'Número de documento (ej. número de cédula, pasaporte)' })
  //@IsIdentityCard()	
  @IsNotEmpty({ message: 'El número de documento es obligatorio y no puede estar vacío.' })
  numberDocument: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria y no puede estar vacía.' })
  password: string;

  @IsOptional()
  @IsEnum(Positions)
  assignedPosition?: Positions;

  @IsOptional()
  @IsMongoId({ message: 'El rol debe ser un ObjectId válido' })
  assignedRol?: ObjectId;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser un valor booleano (true o false).' })
  state?: boolean;
}
