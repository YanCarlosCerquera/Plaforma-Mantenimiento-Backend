import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { TrainingCenter } from "src/Parametrization/training-centers/entities/training-center.entity";

@Schema({timestamps : true})
export class Dependece extends Document{
    @Prop()
    name: string;

    @Prop()
    state?:boolean;

    @Prop({type:mongoose.Schema.Types.ObjectId, ref :'TrainingCenter'})
    TrainingCenterId:TrainingCenter;
}

export type DependeceDocumet = Dependece & Document;
export const SchemaDepende = SchemaFactory.createForClass(Dependece)
