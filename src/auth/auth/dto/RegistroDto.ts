import { PartialType } from "@nestjs/mapped-types";
import { IsString, IsEmail, IsEnum, IsOptional, IsMongoId } from 'class-validator';
import { Positions } from "src/enum/position.enum";
import { TypeDocuments } from "src/enum/typeDocument.enum";
import { Rol } from "src/Segurity/rol/entities/rol.entity";
import { User } from "src/users/entities/user.entity";

export class RegistroDto extends PartialType(User) {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsEnum(TypeDocuments)
  typeDocument: TypeDocuments;

  @IsString()
  numberDocument: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(Positions)
  assignedPosition?: Positions;
 
  @IsOptional()
  assignedRol?:Rol
}

