import { IsString, IsNotEmpty, IsDate, IsBoolean, IsObject, IsOptional, IsMongoId, isMongoId, isBase64 } from 'class-validator';
import { Types } from 'mongoose';

export class CreateAssetDto {
@IsString()
@IsOptional()
image?:string;

    
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  acquisitionDate: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  modelo: string;

  @IsString()
  @IsNotEmpty()
  equipmentType: string;

 

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsString()
  @IsNotEmpty()
  inventoryCode: string;

  @IsString()
  @IsNotEmpty()
  accountHolder:string;

  @IsMongoId()
  @IsNotEmpty()
  categoryId: string;

   @IsMongoId()
   @IsNotEmpty()
  environmentId : string

  @IsObject()
  @IsNotEmpty()
  manufacturer: {
    name: string;
    address: string;
    phone:string
  };

  @IsObject()
  @IsNotEmpty()
  supplier: {
    name: string;
    address: string;
    phone:string
  };

  @IsBoolean()
  @IsNotEmpty()
  status: boolean;


  
}
