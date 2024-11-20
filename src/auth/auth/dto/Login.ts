import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { TypeDocuments } from "src/enum/typeDocument.enum";

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    document: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsEnum(TypeDocuments)
    @IsNotEmpty()
    typeDocument: TypeDocuments;
  }
  