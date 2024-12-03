import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Positions } from "src/enum/position.enum";
import { TypeDocuments } from "src/enum/typeDocument.enum";
import { Rol } from "src/Segurity/rol/entities/rol.entity";

export type DocumentUser = User & Document;

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true })
    name: string

    @Prop({ required: false })
    photoUrl?: string | null;

    @Prop({
        required: true,
        unique: true,
        match: [
            /@(soy\.sena\.edu\.co|sena\.edu\.co)$/i,
            'El correo debe pertenecer al dominio @soy.sena.edu.co o @sena.edu.co.',
        ],
    })
    email: string

    @Prop({
        required: true,
        validate: {
            validator: function (v: string) {
                return /^\+\d{1,3}\d{7,14}$/.test(v); 
            },
            message: 'El número de teléfono debe ser válido y seguir el formato internacional, como +573219906598.',
        },
    })
    phone: string

    @Prop({ enum: Object.values(TypeDocuments), required: true })
    typeDocument: TypeDocuments

    @Prop({
        required: true,
        match: [/^\d+$/, 'El número de documento debe contener solo números.'],
        minlength: [6, 'El número de documento debe tener al menos 6 dígitos.'],
        maxlength: [10, 'El número de documento debe tener un máximo de 10 dígitos.'],
    })
    numberDocument: string

    @Prop({required: true,})
    password: string

    @Prop({ enum: Object.values(Positions) })
    assignedPosition?: Positions

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Rol' })
    assignedRol?: Rol
<<<<<<< HEAD
@Prop()
    resetCode?: string;
    @Prop()
  resetCodeExpiresAt?: Date;

    @Prop({required: true, default: true})
    state: false; 
    
=======

    @Prop({ required: false })
    tokenReference?: string;

    @Prop({ required: true, default: true })
    state: boolean;

>>>>>>> 61fb0a8dd1a4709bd7b7034beb4ee4b1a3446fbc
}

export const SchemaUser = SchemaFactory.createForClass(User)
SchemaUser.index({ typeDocument: 1, numberDocument: 1 }, { unique: true });
