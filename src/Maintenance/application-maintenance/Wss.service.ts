import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from 'src/Parametrization/config/config.service';

@Injectable()
export class WssService {

    private hostname: string;
    private apiKey: string;
    private fromNumber: string;
    constructor
        (
            private readonly httpService: HttpService,
            private readonly configService: ConfigService,
        ) { }

    private async loadConfig() {
        const config = await this.configService.findWssConfig();
        this.hostname = config.hostname;
        this.apiKey = config.apiKey;
        this.fromNumber = config.fromNumber;
    }


    async sendWhatsappTemplateMessage(to: string, placeholderText: string = 'default message') {
        await this.loadConfig()

        const url = `https://${this.hostname}/whatsapp/1/message/template`;

        const sanitizedText = placeholderText.trim().replace(/👋/g, ''); // Elimina caracteres o emojis no deseados.

        const postData = {
            messages: [
                {
                    type: 'text',
                    from: this.fromNumber,
                    to: to,
                    content: {
                        text: sanitizedText,
                        templateName: 'abandoned_buttons1',
                        templateData: {
                            body: {
                                placeholders: [sanitizedText]
                            }
                        },
                        language: 'en',
                    }
                }
            ]
        };

        const headers = {
            'Authorization': `App ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        try {
            const response = await lastValueFrom(
                this.httpService.post(url, postData, { headers })
            );

            if (response.data.messages) {
                console.log('Mensaje enviado correctamente:', response.data.messages[0]);
            }

            return response.data;
        } catch (error) {
            console.error('Error al enviar el mensaje de WhatsApp:', error);
            throw error;
        }
    }
}