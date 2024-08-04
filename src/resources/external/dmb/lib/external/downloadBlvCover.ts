import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { Logger } from '@nestjs/common';

const logger = new Logger('DownloadBlvCover');

export async function downloadBlvCover(upc: string): Promise<string> {
  const coverUrl = `https://covers.believedigital.com/3000/${upc}.jpg`;
  const filePath = path.join(__dirname, `${upc}.jpg`);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https
      .get(coverUrl, (response) => {
        if (response.statusCode !== 200) {
          return reject(`Failed to get '${coverUrl}' (${response.statusCode})`);
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close((err) => {
            if (err) {
              reject(err);
            } else {
              logger.verbose(`Image downloaded from ${coverUrl}`);
              resolve(filePath);
            }
          });
        });
      })
      .on('error', (err) => {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            logger.error(
              'Error deleting file after download error:',
              unlinkErr.message,
            );
          }
          reject(err.message);
        });
      });
  });
}
