import * as winston from 'winston';
import 'winston-daily-rotate-file';

// Configurar transporte para logs diarios (archivo)
const fileTransport = new winston.transports.DailyRotateFile({
  dirname: 'logs',
  filename: 'application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true,
});

// Formato para los logs en archivo (sin colores)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }),
);

// Formato para los logs en consola (con colores)
const consoleFormat = winston.format.combine(
  winston.format((info) => {
    info.level = info.level.toUpperCase();
    return info;
  })(),
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] [${level}] ${message}`;
  }),
);

// Instancia de Winston Logger
export const logger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  transports: [
    fileTransport,
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});
