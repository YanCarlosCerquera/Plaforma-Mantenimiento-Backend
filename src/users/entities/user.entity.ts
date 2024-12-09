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
  typeDocument: TypeDocuments

  @Prop({
    required: true,
    match: [/^\d+$/, 'El número de documento debe contener solo números.'],
    minlength: [6, 'El número de documento debe tener al menos 6 dígitos.'],
    maxlength: [10, 'El número de documento debe tener un máximo de 10 dígitos.'],
  })
  numberDocument: string

  @Prop({ required: true, })
  password: string

  @Prop({ enum: Object.values(Positions) })
  assignedPosition?: Positions

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Rol' })
  assignedRol?: {
      Rolid: Rol;
      enum: string;
  };  

  @Prop()
  resetCode?: string;
  @Prop()
  resetCodeExpiresAt?: Date;

  @Prop({ required: true, default: true })
  state: false;


}

export const SchemaUser = SchemaFactory.createForClass(User)
SchemaUser.index({ typeDocument: 1, numberDocument: 1 }, { unique: true });
