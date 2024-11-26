import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Positions } from "src/enum/position.enum";
import { TypeDocuments } from "src/enum/typeDocument.enum";
import { Rol } from "src/Segurity/rol/entities/rol.entity";

export type DocumentUser = User & Document;

@Schema({timestamps : true})
export class User extends Document {
    @Prop({required: true})
    name: string

    @Prop({ required: false })
    photoUrl?: string | null;
    
    @Prop({required: true})
    email: string

    @Prop({required: true})
    phone: string

    @Prop({enum: Object.values(TypeDocuments), required: true})
    typeDocument: TypeDocuments

    @Prop({required: true})
    numberDocument: string

    @Prop({required: true})
    password: string

    @Prop({enum: Object.values(Positions)})
    assignedPosition?: Positions

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Rol'})
    assignedRol?: Rol

    @Prop({ required: false })
    tokenReference?: string; 

    @Prop({required: true, default: true})
    state: boolean; // This will allow state to be either true or false
    
}

export const SchemaUser = SchemaFactory.createForClass(User);