import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class InfobipService {
  private readonly baseUrl: string = 'https://d93n3l.api.infobip.com'; 
  private readonly apiKey: string = '742b53b58015390644c8e0f7fc517906-25d23d03-ef60-4ab0-bed4-bc6c7563d2f7'; 
  private readonly fromNumber: string = '+44 7491 163443';  

  constructor(private readonly httpService: HttpService) {
  }

  async sendSms(to: string, text: string ) {
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
