import { Logger } from '@nestjs/common';
import { getBullLogger } from './bullLogger';

export class BullJobLogger extends Logger {
  private getLogger(jobName?: string, jobId?: number) {
    return getBullLogger(jobName, jobId);
  }

  private formatMessage(
    message: string,
    jobName?: string,
    jobId?: number,
  ): string {
    if (jobName && jobId) {
      return `[JOB ${jobId} - ${jobName}] ${message}`;
    } else if (jobId) {
      return `[JOB ${jobId}] ${message}`;
    } else if (jobName) {
      return `[JOB ${jobName}] ${message}`;
    }
    return message; // Si no hay jobId ni jobName, deja el mensaje original
  }

  log(message: string, ...optionalParams: any[]) {
    const [jobName, jobId] = optionalParams;
    this.getLogger(jobName, jobId).info(
      this.formatMessage(message, jobName, jobId),
    );
  }

  error(message: string, ...optionalParams: any[]) {
    const [jobName, jobId] = optionalParams;
    this.getLogger(jobName, jobId).error(
      this.formatMessage(`❌ ${message}`, jobName, jobId),
    );
  }

  warn(message: string, ...optionalParams: any[]) {
    const [jobName, jobId] = optionalParams;
    this.getLogger(jobName, jobId).warn(
      this.formatMessage(`⚠️ ${message}`, jobName, jobId),
    );
  }

  debug(message: string, ...optionalParams: any[]) {
    const [jobName, jobId] = optionalParams;
    this.getLogger(jobName, jobId).debug(
      this.formatMessage(`🐛 ${message}`, jobName, jobId),
    );
  }

  verbose(message: string, ...optionalParams: any[]) {
    const [jobName, jobId] = optionalParams;
    this.getLogger(jobName, jobId).verbose(
      this.formatMessage(`🔍 ${message}`, jobName, jobId),
    );
  }
}
