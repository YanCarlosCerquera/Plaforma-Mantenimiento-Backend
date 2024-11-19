import { IsMongoId } from "class-validator";
import { ObjectId } from "mongoose";

export class CreateCityDto {
  name:string;
  description:string;
  state?:boolean;
  @IsMongoId()
  departamentId : ObjectId  
}
