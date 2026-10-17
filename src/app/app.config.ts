import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { DEFAULT_LANG, provideSupabaseConfig } from '@cikloni/shared';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { LanguageService, provideShopLanguage } from './core/i18n/language.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withFetch()),
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
      fallbackLang: DEFAULT_LANG,
      lang: DEFAULT_LANG,
    }),
    // Load the saved (or default) language before the first render so no raw keys flash.
    provideAppInitializer(() => inject(LanguageService).init()),
    provideShopLanguage(),
    provideSupabaseConfig(environment.supabase),
  ],
};
