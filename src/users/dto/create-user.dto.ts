import { IsString, IsEmail, IsPhoneNumber, IsBoolean, IsOptional, IsNotEmpty, IsIdentityCard, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';

export class CreateUserDto {
  
  @ApiProperty({ description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio y no puede estar vacío.' })
  name: string;

  @ApiProperty({ description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio y no puede estar vacío.' })
  email: string;

  @ApiProperty({ description: 'Número de teléfono del usuario' })
  @IsPhoneNumber(null, { message: 'El número de teléfono debe ser válido.' })
  @IsNotEmpty({ message: 'El número de teléfono es obligatorio y no puede estar vacío.' })
  phone: string;

  @ApiProperty({ description: 'Tipo de documento (ej. cédula, pasaporte)' })
  @IsString()
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio y no puede estar vacío.' })
  typeDocument: string;

  @ApiProperty({ description: 'Número de documento (ej. número de cédula, pasaporte)' })
  @IsIdentityCard()	
  @IsNotEmpty({ message: 'El número de documento es obligatorio y no puede estar vacío.' })
  numberDocument: string;

  @ApiProperty({ description: 'Contraseña para la cuenta del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria y no puede estar vacía.' })
  password: string;

  @ApiProperty({ description: 'Cargo asignado al usuario (opcional)', required: false })
  @IsOptional()
  @IsString({ message: 'El cargo debe ser una cadena de texto.' })
  assignedPosition?: string;

  @ApiProperty({ description: 'Rol asignado al usuario (opcional)', required: false })
  @IsOptional()
  @IsMongoId({ message: 'El rol debe ser un ObjectId válido' })
  assignedRol?: ObjectId;

  @ApiProperty({ description: 'Estado del usuario (activo o no, opcional)', required: false })
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser un valor booleano (true o false).' })
  state?: boolean;
}
