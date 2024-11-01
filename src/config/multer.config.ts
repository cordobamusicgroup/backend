// src/config/multer.config.ts
import { diskStorage } from 'multer';

export const multerConfig = {
  storage: diskStorage({
    destination: './temp', // Directorio temporal
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
  }),
};
