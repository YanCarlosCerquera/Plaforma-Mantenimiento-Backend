import { Prop,Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from 'mongoose';
import { Modulo } from "src/Segurity/modulos/entities/modulo.entity";

@Schema({timestamps: true})
export class View extends Document{

    @Prop({required: true})
    name: string

    @Prop({required: true})
    description: string

    @Prop({required: true})
    route: string

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Modulo', required: true})
    moduloId: Modulo

    @Prop()
    state?: boolean
}
export type ViewDocument = View & Document;
export const SchemaView = SchemaFactory.createForClass(View);
