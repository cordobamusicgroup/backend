import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as fs from 'fs';
import * as path from 'path';

// Directorio donde se guardarán los logs
const LOGS_DIR = 'logs/jobs';

// Cache de loggers para evitar abrir múltiples archivos
const loggersCache: Record<string, winston.Logger> = {};

// Asegurar que el directorio de logs existe
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Función para obtener un logger reutilizable según el job
export function getBullLogger(jobName?: string, jobId?: number) {
  let fileName = 'bull-jobs'; // Default si no hay nombre de job

  if (jobName && jobId) {
    fileName = `${jobName}-${jobId}`;
  } else if (jobName) {
    fileName = jobName;
  }

  // Si ya existe un logger para este archivo, lo reutilizamos
  if (loggersCache[fileName]) {
    return loggersCache[fileName];
  }

  // Ruta del archivo de log
  const logFilePath = path.join(LOGS_DIR, `${fileName}-%DATE%.log`);

  // Crear y almacenar el nuevo logger
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      }),
    ),
    transports: [
      new winston.transports.DailyRotateFile({
        filename: logFilePath,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '15d', // Mantener solo 30 días
        zippedArchive: true,
      }),
    ],
  });

  loggersCache[fileName] = logger;
  return logger;
}
