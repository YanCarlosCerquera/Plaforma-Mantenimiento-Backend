import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { User } from "src/users/entities/user.entity";
import { TrainingCenter } from "src/parametrization/training-centers/entities/training-center.entity";

export enum EnvironmentType {
  LABORATORY = "Laboratory",
  OFFICE = "Office",
  CLASSROOM = "Classroom",
  WORKSHOP = "Workshop",
}

@Schema({ timestamps: true })
export class Environment extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ type: [String], enum: EnvironmentType })
  typeEnvironment?: EnvironmentType[];

  @Prop({ required: true })
  capacity: number;

  @Prop()
  floor?: number;

  @Prop()
  building?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "TrainingCenter", required: true })
  trainingCenter: typeof TrainingCenter;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: false })
  responsibleUser?: typeof User;

  @Prop({ required: true, default: true })
  status: boolean;
}

export const EnvironmentSchema = SchemaFactory.createForClass(Environment);

EnvironmentSchema.index({ code: 1 }, { unique: true });
EnvironmentSchema.index({ trainingCenter: 1 });
EnvironmentSchema.index({ name: 1 });
EnvironmentSchema.index({ typeEnvironment: 1 });

