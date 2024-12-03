import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({timestamps: true})
export class Config extends Document{

    @Prop({type: Object, required: true})
    emailConfig: {
        host: string;
        user: string;
        password: string;
        defaults: string;
    }

    @Prop({type: Object, required: true})
    smsConfig: {
        url: string;
        apiKey: string;
        number: string;
    }

}
export type DocummentConfig = Document & Config
export const SchemaConfig = SchemaFactory.createForClass(Config)
