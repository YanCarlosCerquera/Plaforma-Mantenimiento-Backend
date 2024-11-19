import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
@Schema({timestamps : true})
export class Modulo extends Document {

    @Prop({required: true})
    name:string

    @Prop({required: true})
    description:string

    @Prop()
    state?:boolean

}
export type DocumentModulo = Modulo & Document;
export const SchemaModulo = SchemaFactory.createForClass(Modulo);