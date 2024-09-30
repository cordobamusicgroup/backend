import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class TranslationHelper {
  constructor(private readonly i18n: I18nService) {}

  translate(key: string, args?: object): string {
    const lang = I18nContext.current().lang;
    return this.i18n.translate(key, { args, lang });
  }

  translateError(key: string, args?: object): string {
    return this.translate(key, args);
  }
}
