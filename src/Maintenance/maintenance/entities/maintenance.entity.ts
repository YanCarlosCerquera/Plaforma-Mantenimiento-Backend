import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { sparePartsStatus } from "src/enum/sparePartsStatus.enum";
import { typeMaintenance } from "src/enum/typeMaintenance.enum";
import { OrdenesTrabajo } from "src/maintenance/word_orden/entities/word_orden.entity";
import { User } from "src/users/entities/user.entity";

@Schema({timestamps: true})
export class Maintenance extends Document{
    @Prop({ enum: Object.values(typeMaintenance), required: true})
    typeMaintenance: typeMaintenance

    @Prop({required: true})
    description: string

    @Prop({required: true})
    observation: string

    @Prop({enum: Object.values(sparePartsStatus),required: true})
    sparePartsStatus: sparePartsStatus

    @Prop()
    sparePartsDetails?: string

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    technicalId: User

    @Prop({type : mongoose.Schema.Types.ObjectId , ref :'OrdenesTrabajo' , required:true})
    wordOrdenId:OrdenesTrabajo
    
    @Prop({required: true})
    technicalSignature: string

    @Prop()
    state?: boolean
}
export type DocumentMaintenance = Maintenance & Document
export const SchemaMaintenance = SchemaFactory.createForClass(Maintenance)
