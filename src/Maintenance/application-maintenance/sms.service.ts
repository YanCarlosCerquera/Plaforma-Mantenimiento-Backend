import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from 'src/Parametrization/config/config.service';

@Injectable()
export class InfobipService {
  private baseUrl: string;
  private apiKey: string;
  private fromNumber: string;

  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {
  }

  private async loadConfig() {
    const config = await this.configService.findSMSConfig();
    this.baseUrl = config.url;
    this.apiKey = config.apiKey;
    this.fromNumber = config.number;
  }

  async sendSms(to: string, text: string) {
    await this.loadConfig();

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
