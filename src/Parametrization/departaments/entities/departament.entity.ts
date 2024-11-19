import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({timestamps: true})
export class Departament extends Document{

    @Prop({required: true})
    name: string

    @Prop({required : true})
    description: string

    @Prop()
    state: boolean

}
export type DocumentDepartament = Departament & Document
export const SchemaDepartament = SchemaFactory.createForClass(Departament);
