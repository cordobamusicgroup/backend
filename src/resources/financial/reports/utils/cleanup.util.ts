import * as fs from 'fs';

async function cleanUp(filePath, logger) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.log(`Temporary file ${filePath} deleted successfully.`);
    }
  } catch (error) {
    logger.error(`Error during clean up: ${error.message}`);
  }
}

export default cleanUp;
