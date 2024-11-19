import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ObjectId } from "mongoose";

export class CreateDependeceDto {
   @IsNotEmpty()
   @IsString()
   name:string; 

   @IsBoolean()
   @IsOptional()
   state?:boolean;

   @IsMongoId()
   TrainingCenterId:string
}
