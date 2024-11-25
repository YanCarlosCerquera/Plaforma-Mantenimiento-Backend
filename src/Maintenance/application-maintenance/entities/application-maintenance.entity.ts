import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MaintenanceRequest extends Document {
  @Prop({ required: true })
  requesterName: string;

  @Prop({ required: true })
  requesterPhone: string;

  @Prop({ unique: true })
  trackingNumber: string; 

  @Prop({ type: Types.ObjectId, ref: 'Assets', required: true })
  serialNumber: string;

  @Prop({ required: true })
  maintenanceType: string; 

  @Prop({ required: true })
  issueDescription: string;

  @Prop({ default: false })
  workOrderStatus: boolean;

  @Prop({ type: Date })
  deletedAt?: Date; 
}

export type DocumentMaintenance = MaintenanceRequest & Document;
export const MaintenanceRequestSchema = SchemaFactory.createForClass(MaintenanceRequest);

MaintenanceRequestSchema.pre('validate', function(next) {
    if (this.isNew && !this.trackingNumber) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-4); 
      const idStr = (this._id || new Types.ObjectId()).toString();
      const shortId = idStr.substring(0, 3); 
  
      this.trackingNumber = `SO-MT-${year}-${shortId}`;
    }
    next();
  });