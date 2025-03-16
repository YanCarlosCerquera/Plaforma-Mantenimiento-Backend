import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Environment } from 'src/environments/entities/environment.entity';
import { Category } from 'src/maintenance/categories/entities/category.entity';
import { TrainingCenter } from 'src/parametrization/training-centers/entities/training-center.entity';
import { User } from 'src/users/entities/user.entity';

export type AssetsDocument = Assets & Document;

@Schema({ timestamps: true })
export class Assets extends Document {
  @Prop({ required: false })
  image?: string | null;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  acquisitionDate: Date;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  modelo: string;

  @Prop({ required: true })
  equipmentType: string;

/*   @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'TrainingCenter', required: true })
  trainingCenterId: TrainingCenter; */

  @Prop({ required: true, unique: true })
  serialNumber: string;

  @Prop({ required: true })
  inventoryCode: string;

  @Prop({required: true})
  accountHolder: string ;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true })
  categoryId: Category;


  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Environment", required: true })
  environmentId: Environment

  @Prop({ type: Object, required: true })
  manufacturer: {
    name: string;
    address: string;
    phone: string;
  };

  @Prop({ type: Object, required: true })
  supplier: {
    name: string;
    address: string;
    phone: string;
  };

  @Prop()
  lastReportDate: Date;

  @Prop({ required: true })
  status: boolean;
}

export const AssetsSchema = SchemaFactory.createForClass(Assets);

