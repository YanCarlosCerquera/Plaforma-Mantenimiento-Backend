import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Positions } from "src/enum/position.enum";
import { TypeDocuments } from "src/enum/typeDocument.enum";
import { Rol } from "src/Segurity/rol/entities/rol.entity";

export type DocumentUser = User & Document;

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: false })
    photoUrl?: string | null;

    @Prop({
        required: true,
        unique: true,
        match: [
            /@(soy\.sena\.edu\.co|sena\.edu\.co|gmail\.com)$/i,
            'El correo debe pertenecer a los dominios @soy.sena.edu.co, @sena.edu.co o @gmail.com.',
        ],
    })
    
    email: string;

  @Prop({
    required: true,
    validate: {
      validator: function (v: string) {
        return /^57\d{7,14}$/.test(v);
      },
      message: 'El número de teléfono debe ser válido y seguir el formato internacional, como +5736615144.',
    },
  })
  phone: string

    @Prop({ enum: Object.values(TypeDocuments), required: true })
    typeDocument: TypeDocuments;

    @Prop({
        required: true,
        match: [/^\d+$/, 'El número de documento debe contener solo números.'],
        minlength: [6, 'El número de documento debe tener al menos 6 dígitos.'],
        maxlength: [10, 'El número de documento debe tener un máximo de 10 dígitos.'],
    })
    numberDocument: string;

    @Prop({
        required: true,
        validate: {
            validator: function (v: string) {
                const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
                return regex.test(v);
            },
            message:
                'La contraseña debe tener al menos 8 caracteres, incluir una letra mayúscula, una letra minúscula, un número y al menos un carácter especial.',
        },
    })
    password: string;

    @Prop({ enum: Object.values(Positions) })
    assignedPosition?: Positions;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Rol' })
  assignedRol?: Rol 

    @Prop()
    resetCode?: string;

    @Prop()
    resetCodeExpiresAt?: Date;

    @Prop({ required: true, default: false })
    state: false;
}

export const SchemaUser = SchemaFactory.createForClass(User);
SchemaUser.index({ typeDocument: 1, numberDocument: 1 }, { unique: true });

SchemaUser.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();

    const updateObj = update as {
        config?: { email: boolean; sms: boolean; whattsapp: boolean };
        email?: string;
        phone?: string;
        numberDocument?: string;
        typeDocument?: string;
        password?: string;
    };

    if (updateObj.config) {
        const configValues = Object.values(updateObj.config);
        if (!configValues.some(value => value === true)) {
            return next(new Error('Al menos una opción en la configuración debe estar habilitada.'));
        }
    }

    if (updateObj.email && !/@(soy\.sena\.edu\.co|sena\.edu\.co)$/i.test(updateObj.email)) {
        return next(new Error('El correo debe pertenecer al dominio @soy.sena.edu.co o @sena.edu.co.'));
    }

    if (updateObj.phone && !/^\+\d{1,3}\d{7,14}$/.test(updateObj.phone)) {
        return next(new Error('El número de teléfono debe ser válido y seguir el formato internacional, como +573219906598.'));
    }

    if (updateObj.numberDocument) {
        if (!/^\d+$/.test(updateObj.numberDocument)) {
            return next(new Error('El número de documento debe contener solo números.'));
        }
        if (updateObj.numberDocument.length < 6 || updateObj.numberDocument.length > 10) {
            return next(new Error('El número de documento debe tener entre 6 y 10 dígitos.'));
        }
    }

    if (updateObj.typeDocument && !Object.values(TypeDocuments).includes(updateObj.typeDocument as TypeDocuments)) {
        return next(new Error('El tipo de documento es inválido.'));
    }

    if (updateObj.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(updateObj.password)) {
        return next(new Error('La contraseña debe tener al menos 8 caracteres, incluir una letra mayúscula, una letra minúscula, un número y al menos un carácter especial.'));
    }

    next();
});
