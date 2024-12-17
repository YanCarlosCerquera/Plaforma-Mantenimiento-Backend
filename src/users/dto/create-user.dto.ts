import { IsString, IsEmail, IsBoolean, IsOptional, IsNotEmpty, IsMongoId, IsEnum, Matches, Length, ValidateNested, IsObject } from 'class-validator';
import { ObjectId } from 'mongoose';
import { TypeDocuments } from 'src/enum/typeDocument.enum';
import { Positions } from 'src/enum/position.enum';
import { Type } from 'class-transformer';

class ConfigDto {
  @IsBoolean({ message: 'El valor de "gmail" debe ser un booleano.' })
  email: boolean;

  @IsBoolean({ message: 'El valor de "sms" debe ser un booleano.' })
  sms: boolean;

  @IsBoolean({ message: 'El valor de "whattsapp" debe ser un booleano.' })
  whattsapp: boolean;
}

export class CreateUserDto {

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio y no puede estar vacío.' })
  name: string;

  @IsString()
  @IsOptional()
  photoUrl?: string   

  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  @Matches(
    /@(soy\.sena\.edu\.co|sena\.edu\.co)$/i, 
    { message: 'El correo debe pertenecer al dominio @soy.sena.edu.co o @sena.edu.co.' }
  )
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio y no puede estar vacío.' })
  email: string;

  @Matches(/^\d{1,4}\d{7,10}$/, { message: 'El número de teléfono debe ser válido.' })
  @IsNotEmpty({ message: 'El número de teléfono es obligatorio y no puede estar vacío.' })
  phone: string;

  @IsEnum(TypeDocuments)
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio y no puede estar vacío.' })
  typeDocument: TypeDocuments; 

  @Matches(/^\d+$/, { message: 'El número de documento debe contener solo números.' })
  @Length(6, 10, { message: 'El número de documento debe tener entre 6 y 10 dígitos.' })
  @IsNotEmpty({ message: 'El número de documento es obligatorio y no puede estar vacío.' })
  numberDocument: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria y no puede estar vacía.' })
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
    { 
      message: 'La contraseña debe tener al menos 8 caracteres, incluir al menos una letra mayúscula, una letra minúscula, un número y un carácter especial.' 
    }
  )
  password: string;

  @IsOptional()
  @IsEnum(Positions)
  assignedPosition?: Positions;

  @IsOptional()
  @IsMongoId({ message: 'El rol debe ser un ObjectId válido' })
  assignedRol?: string;

  @ValidateNested()
  @IsObject({ message: 'La configuración debe ser un objeto válido.' })
  @Type(() => ConfigDto)
  @IsOptional()
  config?: ConfigDto;

  @IsOptional()
  state?: boolean;
}

