import { transports, format, createLogger } from 'winston';
import 'winston-mongodb';

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(), 
    format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${JSON.stringify(meta)}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.MongoDB({
      level: 'info',
      db: 'mongodb://localhost:4040/sena', // URL de conexión a MongoDB
      options: { useUnifiedTopology: true },
      collection: 'actionlogs', // Nombre de la colección
      format: format.combine(
        format.timestamp(),
        format((info) => {
          return {
            ...info, 
            timestamp: info.timestamp,
            userId: info.userId,
            dateTime: info.dateTime,
            action: info.action,
            moduloId: info.moduloId,
            state: info.state,
            level: info.level, 
            message: info.message, 
          };
        })(),
        format.json() 
      ),
    }),
  ],
});
