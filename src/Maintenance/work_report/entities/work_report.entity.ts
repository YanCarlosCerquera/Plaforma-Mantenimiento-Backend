import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, Types } from "mongoose";
import { OrdenesTrabajo } from "src/Maintenance/word_orden/entities/word_orden.entity";

@Schema({timestamps : true})
export class WorkReport extends Document {

  
    @Prop({ })
    costs: number; 
  
    @Prop({ })
    hours: number;
  
    @Prop({}) 
    responses: string;
  
    @Prop()
    observation: string;
  
    @Prop({ })
    workDone: string; 

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'OrdenesTrabajo', required: true })
    orderId: OrdenesTrabajo;
  
    @Prop({ required: true })
    status: boolean;  
}
export type DocumentWorkReport  = WorkReport & Document;
export const SchemaWorkReport = SchemaFactory.createForClass(WorkReport)
