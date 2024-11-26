import { IsString, IsEmail, IsPhoneNumber, IsBoolean, IsOptional, IsNotEmpty, IsIdentityCard, IsMongoId, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { TypeDocuments } from 'src/enum/typeDocument.enum';
import { Positions } from 'src/enum/position.enum';

export class CreateUserDto {
  
  @ApiProperty({ description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio y no puede estar vacío.' })
  name: string;

  @ApiProperty({ description: 'Imagen de perfil del usuario' })
  @IsString()
  @IsOptional()
  photoUrl?: string   

  @ApiProperty({ description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio y no puede estar vacío.' })
  email: string;

  @ApiProperty({ description: 'Número de teléfono del usuario' })
  //@IsPhoneNumber(null, { message: 'El número de teléfono debe ser válido.' })
  @IsNotEmpty({ message: 'El número de teléfono es obligatorio y no puede estar vacío.' })
  phone: string;

  @ApiProperty({ description: 'Tipo de documento (ej. cédula, pasaporte)' })
  @IsEnum(TypeDocuments)
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio y no puede estar vacío.' })
  typeDocument: TypeDocuments;

  @ApiProperty({ description: 'Número de documento (ej. número de cédula, pasaporte)' })
  //@IsIdentityCard()	
  @IsNotEmpty({ message: 'El número de documento es obligatorio y no puede estar vacío.' })
  numberDocument: string;

  @ApiProperty({ description: 'Contraseña para la cuenta del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria y no puede estar vacía.' })
  password: string;

  @ApiProperty({ description: 'Cargo asignado al usuario (opcional)', required: false })
  @IsOptional()
  @IsEnum(Positions)
  assignedPosition?: Positions;

  @ApiProperty({ description: 'Rol asignado al usuario (opcional)', required: false })
  @IsOptional()
  @IsMongoId({ message: 'El rol debe ser un ObjectId válido' })
  assignedRol?: ObjectId;

  @ApiProperty({ description: 'Estado del usuario (activo o no, opcional)', required: false })
  @IsOptional()
  state?: boolean;
}
