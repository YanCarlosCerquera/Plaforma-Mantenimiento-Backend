import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Types } from 'mongoose';
import { MaintenanceRequest } from 'src/Maintenance/application-maintenance/entities/application-maintenance.entity';
import { User } from 'src/users/entities/user.entity';

@Schema({ timestamps: true }) 
export class OrdenesTrabajo extends Document {

  @Prop({ type: String, required: true })
  radicado: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  tecnicoId: User;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  instructorId: User;

  @Prop({ type: Date, required: true })
  fechaInicio: Date;

  @Prop({ type: Date })
  fechaFin: Date;

  @Prop({ type: String, 
  enum: ['alta', 'media', 'baja'],
required: true })
  prioridad: string;

  @Prop({ type: Object, required: true  , ref:'MaintenanceRequest'})
  solicitud:{
    solicirud: MaintenanceRequest,
  };

  @Prop({ type: Types.ObjectId, ref: 'Mantenimiento' })
  Mantenimiento?:{
   // mantenimientiId: MATENIMMIENT
  };

  @Prop({ type: Boolean, default: true })
  StateOT   : boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const OrdenesTrabajoSchema = SchemaFactory.createForClass(OrdenesTrabajo);
export type OrdenDocument = OrdenesTrabajo & Document;