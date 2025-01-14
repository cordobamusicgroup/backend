import { Logger } from '@nestjs/common';
import { LoggerTxtService } from 'src/common/services/logger-txt.service';

export async function doubleLog(
  level: 'log' | 'error' | 'warn',
  message: string,
  jobId: string,
  context: string,
  logger: Logger,
  loggerTxt: LoggerTxtService,
): Promise<void> {
  logger[level](message);
  switch (level) {
    case 'log':
      await loggerTxt.logInfo(message, jobId, context);
      break;
    case 'warn':
      await loggerTxt.logWarn(message, jobId, context);
      break;
    case 'error':
      await loggerTxt.logError(message, jobId, context);
      break;
  }
}
