import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";

export type DocumentUser = User & Document;

@Schema({timestamps : true})
export class User extends Document{
    
    
    @Prop()
    name: string

    @Prop({required :[true , "fsfsdfsfsdfsfs"]})
    password: string
}

export const SchemaUser = SchemaFactory.createForClass(User);
