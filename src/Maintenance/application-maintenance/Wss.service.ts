import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { text } from 'stream/consumers';

@Injectable()
export class WssService {

    private readonly hostname: string = 'm385mw.api.infobip.com';
    private readonly apiKey: string = '984bba7ce8d7a19450ab1c5f37330053-91317876-4244-4914-8e08-a51c71906fb4';
    private readonly fromNumber: string = '447860099299';// Removed the space
  constructor
  (
    private readonly httpService: HttpService,
   

  ) {
    
  }

  async sendWhatsappTemplateMessage(to: string, placeholderText: string = 'default message') {
    const url = `https://${this.hostname}/whatsapp/1/message/template`;

    const sanitizedText = placeholderText.trim().replace(/👋/g, ''); // Elimina caracteres o emojis no deseados.

    const postData = {
        messages: [
            {
                type:'text',
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