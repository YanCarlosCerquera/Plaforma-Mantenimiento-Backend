import { IsNotEmpty, IsString, IsUrl } from "class-validator";

export class CreateConfigDto {
    @IsNotEmpty({ message: 'La configuración de correo electrónico es obligatoria.' })
    emailConfig: {
        host: string;
        user: string;
        password: string;
        defaults: string;
    };

    @IsNotEmpty({ message: 'La configuración de SMS es obligatoria.' })
    smsConfig: {
        url: string;
        apiKey: string;
        number: string;
    };
}
