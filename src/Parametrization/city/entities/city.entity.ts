import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Departament } from "src/Parametrization/departaments/entities/departament.entity";

@Schema({timestamps : true})
export class City extends Document {
  @Prop()
  name:string;
  
  @Prop()
  description:string;

  @Prop()
  state?:boolean

  @Prop({type:mongoose.Schema.Types.ObjectId, ref:'Departament'})
  departamentId: Departament;
}
export type DocumentCity = City & Document
export const SchemaCity = SchemaFactory.createForClass(City);
