import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, HydratedDocument } from "mongoose";
import { Rol } from "src/Segurity/rol/entities/rol.entity";

export type DocumentUser = User & Document;

@Schema({timestamps : true})
export class User extends Document{
    @Prop({required: true})
    name: string

    @Prop({required: true})
    email: string

    @Prop({required: true})
    phone: string

    @Prop({required: true})
    typeDocument: string

    @Prop({required: true})
    numberDocument: string

    @Prop({required: true})
    password: string

    @Prop()
    assignedPosition?: string

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Rol'})
    assignedRol?: Rol

    @Prop()
    state?: boolean
}

export const SchemaUser = SchemaFactory.createForClass(User);
