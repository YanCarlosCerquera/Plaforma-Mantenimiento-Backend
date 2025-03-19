import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { City } from "src/parametrization/city/entities/city.entity";

@Schema({timestamps: true})
export class TrainingCenter extends Document{
    @Prop({required: true})
    name: string

    @Prop({required: true})
    regional: string

    @Prop({required: true})
    code: string

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true})
    cityId: City

    @Prop()
    state?: boolean

}
export type DocumentTrainingCenter = TrainingCenter & Document
export const SchemaTrainingCenter = SchemaFactory.createForClass(TrainingCenter)
