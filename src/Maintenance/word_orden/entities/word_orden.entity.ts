import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { MaintenanceRequest } from 'src/Maintenance/application-maintenance/entities/application-maintenance.entity';
import { User } from 'src/users/entities/user.entity';
import { Maintenance } from 'src/Maintenance/maintenance/entities/maintenance.entity';

@Schema({ timestamps: true }) 
export class OrdenesTrabajo extends Document {
  @Prop({ type: String, required: true, unique: true })
  radicado: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  tecnicoId: User;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  instructorId: User;

  @Prop({ type: Date, required: true })
  fechaInicio: Date;

  @Prop({ type: Date })
  fechaFin: Date;

  @Prop({ 
    type: String, 
    enum: ['alta', 'media', 'baja', 'Sin Terminar'],
    required: true 
  })
  prioridad: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'MaintenanceRequest' })
  solicitud: {
    solicitudId: Types.ObjectId;
  };

  

  @Prop({ type: Boolean, default: true })
  state: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  maintenances?: Maintenance[];

}

export const OrdenesTrabajoSchema = SchemaFactory.createForClass(OrdenesTrabajo);

OrdenesTrabajoSchema.virtual('maintenances', {
  ref: 'Maintenance',
  localField: '_id',
  foreignField: 'wordOrdenId',
});

// 🔹 Habilitar virtuals en las conversiones JSON y objeto
OrdenesTrabajoSchema.set('toObject', { virtuals: true });
OrdenesTrabajoSchema.set('toJSON', { virtuals: true });

export type OrdenDocument = OrdenesTrabajo & Document;
