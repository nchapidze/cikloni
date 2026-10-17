import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideSupabaseConfig } from '@cikloni/shared';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

/** Georgian only: no ngx-translate here (shared's `localized` pipe defaults to Georgian). */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideSupabaseConfig(environment.supabase),
  ],
};
