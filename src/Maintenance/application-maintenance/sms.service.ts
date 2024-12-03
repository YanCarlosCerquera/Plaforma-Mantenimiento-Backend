import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class InfobipService {
  private readonly baseUrl: string = 'https://m385mw.api.infobip.com';  // Directamente en el código
  private readonly apiKey: string = '984bba7ce8d7a19450ab1c5f37330053-91317876-4244-4914-8e08-a51c71906fb4';  // Directamente en el código
  private readonly fromNumber: string = '+44 7491 163443';  

  constructor(private readonly httpService: HttpService) {
  }

  async sendSms(to: string, text: string) {
    const url = `${this.baseUrl}/sms/2/text/advanced`;
    
    const data = {
      messages: [
        {
          destinations: [{ to }],
          from: this.fromNumber,
          text,
        },
      ],
    };

    const headers = {
      'Authorization': `App ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, data, { headers })
      );
      console.log('SMS enviado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al enviar SMS:', error.response?.data || error.message);
      throw error;
    }
  }
}
