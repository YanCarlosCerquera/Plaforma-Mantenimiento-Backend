import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { format, addDays, formatISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

@Injectable()
export class GoogleCalendarService {
  private calendar;
  private readonly calendarId = '88a04ca3fc815a9da58b34b1a8ed7d952cb8a4c9b09ba3d296c60eeb87691ee4@group.calendar.google.com';
  private readonly timeZone = 'America/Bogota';

  constructor() {
    const credentials = {
      client_email: "test-901@avid-math-446600-c5.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCKYbosk7jNL+D6\nTf5LsgUCmYi98yljjgUftX3XYbf+SoQBKIN076hDQ6yYyOjlaSxPM0Pojs4OwQ0C\nGZa3Dojnl1As4GM4cbDL4drdNjWL1EeJzWHuzBf7a+aPNA2/uh0OJk520YT6Fixh\nEZUZrGl87UFk7m5/Y6751+3r0rdAQ+1OZxPOttv2tBWHFavexNgTbcBBBdiL+VMA\ny2Xsv12xfVsriJ1+hQ7VT8O94HrQ2WdggFuTxriqwnFP2ebfvKebSPtrFb9k2ced\nMXAX1ljG3gyij2sUuX7D7icUQKRK8I2hzZiY3pVMpCRhTDR32eh6jXfOjKnDQO8C\nBYIlbAyjAgMBAAECggEADVLJqYp5g9JYMp4fkN5gqoNQAQKwWZD7DLZqAAdwPyM7\nU9Jr21TkJvT7lH3d8PfJpKbjb9JcClvRxE6xZ6OWUKUnB4MWzbO7v9pZh7kbhubj\n3zBilveYix3OH4iPMFM1G/LAbqLPaLXwBOwiWZjAUuv6KV0ZgqaW2lOANhd3velu\nf9TRF6hP4tMcxYH5Pz4/oJmlV8ybgz2IkTp4YmS6GD2XmLGKYwpiabqPVYumpjSi\ntkQuCqhfCeyTcodg563uhnceqTZ+n60YuqP459X4To763DLSRXQnAPLqvMHYHxhu\nRnfwQ+xIvQRszQzyBSZlnTGXdClNdFP/fgVieLN/qQKBgQDBOX/hTzHRiFx0JUmV\nOLyiM9ZSDrRHTmu8yq7zzwJtTkQDUodB2er0lVpEAaqU64abkyD9ETUmfSLefmKz\n7y6PHZdyT3LoH1RfOZfky+Ttmxd5LdYTNcAYBHiuOvbXnsCMnOox4Q2rM5XEvvJK\n4M9FD442IFy/q8taWD4jStWPuwKBgQC3VvG3ZexUQLlh+gGYdqQdTTEKDIIgYbZY\nIHofwyFHtMfbIesV0Ani110SDxcE/9l2mDduO+B9fLMy7ZaoD+1gef3YRezbgiVS\np1Eq16m7UXRk8BwaUUMiEJ3ZW0E0DfAELft1ZOkzsJplZnyQw4C314RBSe3x79Xa\n8qpzoo5kOQKBgGCX1//QUT1IB7/gLAq21EXZ2BgpVaIX5+/2+sLTB4mRCJsIlKks\nwTIHv5ojoxzTKPV49ZLNGV7mS5oiYEFHHmVZC66PXQgBMXJxHie4bfcCAxgG+++a\nfS8EfTfMLj3YFLW2c7T/po+hOAuk0Qbxn2wMvLD+OJ9wyDWfy2BlNqGlAoGAfAB8\nQFTZgSq9t/zGM36bBY5+CpPnN0ufbv+YWf86dStauWW5gOlSpnCPbHV0VldNmB7f\n7tjkvzsmYN29NjJ/lO8tt6ejydu+rqaoCVgQXrd7CAI2n74yr8mZWbeU5EZA/jKz\njvUPnXxnEQo+WhNA7hcARsBgBXD3rbzPeKKLuFECgYEAv/O1j3rRP6Xei3hmchbj\nt3rd1bTSdiJUBY/5lyBjUOCWXfrFY/nZk8YeDekMwL/noRG5lfv2V0UuT6sVZsQs\njDMmATNble2fpf/UlESXByXQPKj6tuHeHvj60VjH2d4K6EKIrcCUlIMZAH+Eluny\nnHfqvjcklTHh5KBDrGns6uo=\n-----END PRIVATE KEY-----\n",
      project_id: "avid-math-446600-c5",
    };

    const client = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    this.calendar = google.calendar({ version: 'v3', auth: client });
  }

  async createEvent(assetName: string, acquisitionDate: string, eventName?: string, eventColor?: string) {
    const isoDate = new Date(acquisitionDate);
    const zonedDate = toZonedTime(isoDate, this.timeZone);
    const nextDay = addDays(zonedDate, 1);

    const event = {
      summary: eventName || `Adquisición de ${assetName}`,
      description: `Fecha de adquisición del activo: ${assetName}`,
      start: {
        dateTime: formatISO(zonedDate),
        timeZone: this.timeZone,
      },
      end: {
        dateTime: formatISO(nextDay),
        timeZone: this.timeZone,
      },
      colorId: this.getColorId(eventColor),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`, // ID único para la solicitud de Meet
          conferenceSolutionKey: {
            type: 'hangoutsMeet', // Tipo de conferencia (Google Meet)
          },
        },
      },
    };

    try {
      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
        conferenceDataVersion: 1, // Habilitar la creación de la conferencia
      });

      console.log('Evento creado: %s', response.data.htmlLink);
      return response.data;
    } catch (error) {
      console.error('Error al crear el evento:', error);
      throw new Error('No se pudo crear el evento en Google Calendar');
    }
  }

  private getColorId(color: string): string {
    const colorMap = {
      'blue': '1',
      'green': '2',
      'purple': '3',
      'red': '4',
      'yellow': '5',
      'orange': '6',
      'turquoise': '7',
      'gray': '8',
      'bold blue': '9',
      'bold green': '10',
      'bold red': '11',
    };
    return colorMap[color?.toLowerCase()] || '4';
  }
}