import { IsString, IsEmail, IsPhoneNumber, IsBoolean, IsOptional, IsNotEmpty, IsIdentityCard, IsMongoId, IsEnum, Matches, Length } from 'class-validator';
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
  photoUrl?: string   

  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  @Matches(
    /@(soy\.sena\.edu\.co|sena\.co)$/i, 
    { message: 'El correo debe pertenecer al dominio @soy.sena.edu.co o @sena.co.' }
  )
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio y no puede estar vacío.' })
  email: string;

  @IsPhoneNumber(null, { message: 'El número de teléfono debe ser válido.' })
  @IsNotEmpty({ message: 'El número de teléfono es obligatorio y no puede estar vacío.' })
  phone: string;

  @IsEnum(TypeDocuments)
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio y no puede estar vacío.' })
  typeDocument: TypeDocuments; 

  @ApiProperty({ description: 'Número de documento (ej. número de cédula, pasaporte)' })
  @Matches(/^\d+$/, { message: 'El número de documento debe contener solo números.' })
  @Length(6, 10, { message: 'El número de documento debe tener entre 6 y 10 dígitos.' })
  @IsNotEmpty({ message: 'El número de documento es obligatorio y no puede estar vacío.' })
  numberDocument: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria y no puede estar vacía.' })
  @Matches(
    /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/, 
    { message: 'La contraseña debe tener al menos 8 caracteres, incluir al menos un número y una letra mayúscula.' }
  )
  password: string;

  @IsOptional()
  @IsEnum(Positions)
  assignedPosition?: Positions;

  @IsOptional()
  @IsMongoId({ message: 'El rol debe ser un ObjectId válido' })
  assignedRol?: ObjectId;

  @IsOptional()
  state?: boolean;
}
