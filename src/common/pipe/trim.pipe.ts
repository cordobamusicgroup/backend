import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return value.trim(); // Elimina espacios al inicio y al final
    }

    // Si es un objeto, recorre sus propiedades para limpiarlas
    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach((key) => {
        if (typeof value[key] === 'string') {
          value[key] = value[key].trim();
        }
      });
    }

    return value; // Devuelve el valor procesado
  }
}
