import * as fs from 'fs';

async function cleanUp(filePath, errorLogPath, logger) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.log(`Temporary file ${filePath} deleted successfully.`);
    }

    if (fs.existsSync(errorLogPath)) {
      logger.log(`Error log saved at ${errorLogPath}`);
    }
  } catch (error) {
    logger.error(`Error during clean up: ${error.message}`);
  }
}

export default cleanUp;
