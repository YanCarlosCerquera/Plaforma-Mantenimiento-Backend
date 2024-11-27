import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { OrdenesTrabajo } from "src/Maintenance/word_orden/entities/word_orden.entity";

@Schema({timestamps : true})
export class WorkReport extends Document {

  
    @Prop({ required: true })
    costs: number; 
  
    @Prop({ required: true })
    hours: number;
  
    @Prop({ required: true }) 
    responses: string;
  
    @Prop()
    observation: string;
  
    @Prop({ required: true })
    workDone: string; 

    @Prop({ type: Types.ObjectId, ref: 'OrdenesTrabajo', required: true })
    orderId: OrdenesTrabajo;
  
    @Prop({ required: true })
    status: boolean;  
}
export type DocumentWorkReport  = WorkReport & Document;
export const SchemaWorkReport = SchemaFactory.createForClass(WorkReport)
