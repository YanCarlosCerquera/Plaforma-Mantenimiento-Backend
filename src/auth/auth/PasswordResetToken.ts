import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

@Schema()
export class PasswordResetToken extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}
export type  DocumentToken = PasswordResetToken & Document;
export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);

