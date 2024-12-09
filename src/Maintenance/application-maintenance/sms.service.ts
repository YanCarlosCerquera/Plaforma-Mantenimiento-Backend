import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from 'src/Parametrization/config/config.service';

@Injectable()
export class InfobipService {
<<<<<<< HEAD
  private baseUrl: string;
  private apiKey: string;
  private fromNumber: string;
=======
  private readonly baseUrl: string = 'https://d93n3l.api.infobip.com'; 
  private readonly apiKey: string = '742b53b58015390644c8e0f7fc517906-25d23d03-ef60-4ab0-bed4-bc6c7563d2f7'; 
  private readonly fromNumber: string = '+44 7491 163443';  
>>>>>>> 9ae5e83a3941a2205c8d9a4b0c636a56624c767b

  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {
  }

  private async loadConfig() {
    const config = await this.configService.findSMSConfig();
    this.baseUrl = config.url;
    this.apiKey = config.apiKey;
    this.fromNumber = config.number;
  }

<<<<<<< HEAD
  async sendSms(to: string, text: string) {
    await this.loadConfig();

=======
  async sendSms(to: string, text: string ) {
>>>>>>> 9ae5e83a3941a2205c8d9a4b0c636a56624c767b
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
