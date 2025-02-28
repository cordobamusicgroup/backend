import { Logger } from '@nestjs/common';
import { getBullLogger } from './bullLogger';

export class BullJobLogger extends Logger {
  private contextJobId?: string | number;
  private contextJobName?: string;

  constructor(jobId?: string | number, jobName?: string) {
    super();
    this.contextJobId = jobId;
    this.contextJobName = jobName;
  }

  private getLogger(jobName?: string, jobId?: number | string) {
    const finalJobName = jobName || this.contextJobName;
    const finalJobId = jobId || this.contextJobId;
    return getBullLogger(finalJobName, Number(finalJobId));
  }

  private formatMessage(
    message: string,
    jobName?: string,
    jobId?: number | string,
  ): string {
    const finalJobName = jobName || this.contextJobName;
    const finalJobId = jobId || this.contextJobId;

    if (finalJobName && finalJobId) {
      return `[JOB ${finalJobId} - ${finalJobName}] ${message}`;
    } else if (finalJobId) {
      return `[JOB ${finalJobId}] ${message}`;
    } else if (finalJobName) {
      return `[JOB ${finalJobName}] ${message}`;
    }
    return message;
  }

  // Overriding log methods to use either context from constructor or provided params
  log(message: string, ...optionalParams: any[]) {
    const [jobName, jobId] = optionalParams;
    this.getLogger(
      jobName || this.contextJobName,
      jobId || this.contextJobId,
    ).info(this.formatMessage(message, jobName, jobId));
  }

  error(message: string, ...optionalParams: any[]) {
    const [jobName, jobId] = optionalParams;
    this.getLogger(
      jobName || this.contextJobName,
      jobId || this.contextJobId,
    ).error(this.formatMessage(`❌ ${message}`, jobName, jobId));
  }

  warn(message: string, ...optionalParams: any[]) {
    const [jobName, jobId] = optionalParams;
    this.getLogger(
      jobName || this.contextJobName,
      jobId || this.contextJobId,
    ).warn(this.formatMessage(`⚠️ ${message}`, jobName, jobId));
  }

  debug(message: string, ...optionalParams: any[]) {
    const [jobName, jobId] = optionalParams;
    this.getLogger(
      jobName || this.contextJobName,
      jobId || this.contextJobId,
    ).debug(this.formatMessage(`🐛 ${message}`, jobName, jobId));
  }

  verbose(message: string, ...optionalParams: any[]) {
    const [jobName, jobId] = optionalParams;
    this.getLogger(
      jobName || this.contextJobName,
      jobId || this.contextJobId,
    ).verbose(this.formatMessage(`🔍 ${message}`, jobName, jobId));
  }
}
