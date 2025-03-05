import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from 'src/Parametrization/config/config.service';

@Injectable()
export class UltraMsgService {
  private readonly apiBaseUrl = 'https://api.ultramsg.com';
  private readonly instance = 'instance109127';
  private readonly token = '3oh314mu1xhnz3ka';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Enviar un mensaje de WhatsApp utilizando UltraMsg.
   * @param to Número de teléfono del destinatario (formato internacional con +)
   * @param body Contenido del mensaje a enviar
   */
  async sendMessage(to: string, body: string): Promise<any> {
    const url = `${this.apiBaseUrl}/${this.instance}/messages/chat`;

    const data = {
      token: this.token,
      to,
      body,
    };

    const headers = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, data, { headers }),
      );

      console.log('Mensaje enviado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al enviar el mensaje:', error?.response?.data || error.message);
      throw error;
    }
  }
}
