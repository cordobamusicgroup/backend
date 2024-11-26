import * as fs from 'fs';

/**
 * Logs errors to a specified error file.
 * @param {string} filePath - Path to the error log file.
 * @param {string} message - Error message to log.
 */
export function logError(filePath: string, message: string) {
  fs.appendFileSync(filePath, `${new Date().toISOString()} - ${message}\n`);
}

/**
 * Cleans up temporary files after processing.
 * @param {string} filePath - Path to the processed file.
 * @param {string} errorLogPath - Path to the error log file.
 */
export function cleanUp(filePath: string, errorLogPath: string) {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  this.logger.log(`Temporary file ${filePath} deleted successfully.`);

  if (fs.existsSync(errorLogPath)) {
    this.logger.log(`Error log saved at ${errorLogPath}`);
  }
}
