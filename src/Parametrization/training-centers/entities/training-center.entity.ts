import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

export class TrainingCenter extends Document{
    @Prop({required: true})
    name: string

    @Prop({required: true})
    regional: string

    @Prop({required: true})
    code: string

    /*@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true})
    CityId: City*/

    @Prop()
    state?: boolean

}
export type DocumentTrainingCenter = TrainingCenter & Document
export const SchemaTrainingCenter = SchemaFactory.createForClass(TrainingCenter)
