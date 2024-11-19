import { Prop,Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from 'mongoose';
import { Modulo } from "src/Segurity/modulos/entities/modulo.entity";

@Schema({timestamps: true})
export class View extends mongoose.Document{

    @Prop()
    name: string

    @Prop()
    description: string

    @Prop()
    route: string

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Modulo'})
    moduloId: Modulo

    @Prop()
    state?: boolean
}
export type ViewDocument = View & Document;
export const SchemaView = SchemaFactory.createForClass(View);
