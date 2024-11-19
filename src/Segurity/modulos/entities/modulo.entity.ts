import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
@Schema({timestamps : true})
export class Modulo extends Document {

    @Prop()
    name:string

    @Prop()
    description:string

    @Prop()
    state?:boolean

}
export type DocumentModulo = Modulo & Document;
export const SchemaModulo = SchemaFactory.createForClass(Modulo);