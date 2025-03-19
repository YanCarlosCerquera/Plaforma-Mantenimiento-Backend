import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Modulo } from "src/security/modulos/entities/modulo.entity";
import { User } from "src/users/entities/user.entity";

@Schema({timestamps: true})
export class ActionLog extends Document{
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    userId: User

    @Prop({required: true})
    dateTime: Date

    @Prop({required: true})
    action: string

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Modulo', required: true })
    moduloId: Modulo

    @Prop()
    state?: boolean
}
export type DocumentActionLog = Document & ActionLog
export const SchemaActionLog = SchemaFactory.createForClass(ActionLog)
