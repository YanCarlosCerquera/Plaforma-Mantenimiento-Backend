import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { View } from "src/Segurity/views/entities/view.entity";


@Schema({timestamps: true})
export class Rol extends Document {
   
    @Prop({required: true})
    name: string;

    @Prop({required: true})
    description: string;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'View'}], required: true })
    views: View[];

   
    @Prop()
    state?: boolean;
}

export type RolDocument = Rol & Document;
export const SchemaRol = SchemaFactory.createForClass(Rol);

