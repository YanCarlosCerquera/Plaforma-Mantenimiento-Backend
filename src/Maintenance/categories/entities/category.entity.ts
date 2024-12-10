import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Rol } from "src/Segurity/rol/entities/rol.entity";

@Schema({timestamps: true})
export class Category extends Document{
    @Prop({required: true})
    name: string

    @Prop({ type:[String], required: true })
    operationVars: string[]

    @Prop({ type:[String], required: true })
    accessories: string[]

    @Prop({ type:[String], required: true})
    specs: string[]

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Rol' })
    assignedRol: Rol;

    @Prop()
    state?: boolean
}
export type DocumentCategory = Category & Document
export const SchemaCategory = SchemaFactory.createForClass(Category)