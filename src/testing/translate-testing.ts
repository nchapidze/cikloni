import { Provider } from '@angular/core';
import {
  TranslateLoader,
  provideTranslateLoader,
  provideTranslateService,
} from '@ngx-translate/core';
import { of } from 'rxjs';
import en from '../assets/i18n/en.json';
import ka from '../assets/i18n/ka.json';

/** Loads the real translation files synchronously, without HTTP. For specs only. */
class StaticTranslateLoader implements TranslateLoader {
  getTranslation(lang: string) {
    return of(lang === 'en' ? en : ka);
  }
}

export function provideTranslateTesting(): Provider[] {
  return provideTranslateService({
    loader: provideTranslateLoader(StaticTranslateLoader),
    fallbackLang: 'ka',
    lang: 'ka',
  });
}
