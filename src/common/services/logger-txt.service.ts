// src/common/services/logger-txt.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerTxtService {
  private readonly logger = new Logger(LoggerTxtService.name);
  private readonly logDir = path.resolve(__dirname, '../../../logs'); // Directorio de logs

  constructor() {
    this.ensureLogDirExists();
  }

  /**
   * Registra un mensaje de error en un archivo de log.
   * @param message - El mensaje de error a registrar
   * @param jobId - ID del trabajo para el archivo de log
   * @param action - Acción del trabajo (opcional)
   */
  async logError(
    message: string,
    jobId?: string,
    action?: string,
  ): Promise<void> {
    const logFilePath = this.getLogPath(jobId, action);
    const logMessage = `${new Date().toISOString()} - ERROR - ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
  }

  /**
   * Registra un mensaje de información en un archivo de log.
   * @param message - El mensaje de información a registrar
   * @param jobId - ID del trabajo para el archivo de log
   * @param action - Acción del trabajo (opcional)
   */
  async logInfo(
    message: string,
    jobId?: string,
    action?: string,
  ): Promise<void> {
    const logFilePath = this.getLogPath(jobId, action);
    const logMessage = `${new Date().toISOString()} - INFO - ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
  }

  /**
   * Registra un mensaje de advertencia en un archivo de log.
   * @param message - El mensaje de advertencia a registrar
   * @param jobId - ID del trabajo para el archivo de log
   * @param action - Acción del trabajo (opcional)
   */
  async logWarn(
    message: string,
    jobId?: string,
    action?: string,
  ): Promise<void> {
    const logFilePath = this.getLogPath(jobId, action);
    const logMessage = `${new Date().toISOString()} - WARN - ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
  }

  /**
   * Asegura que el directorio de logs exista.
   */
  public ensureLogDirExists(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
      this.logger.log(`Created log directory at ${this.logDir}`);
    }
  }

  /**
   * Genera una ruta para el archivo de log basado en el ID del trabajo y la acción.
   * @param jobId - ID del trabajo
   * @param action - Acción del trabajo (opcional)
   * @returns - Ruta para el archivo de log.
   */
  public getLogPath(jobId?: string, action?: string): string {
    const date = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const fileName = jobId
      ? `[JOB ${jobId} - ${action ? action : 'UNKNOWN'}] LOG ${date}.txt`
      : `LOG ${date}.txt`;
    return path.join(this.logDir, fileName);
  }
}
