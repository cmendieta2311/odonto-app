import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection, DEFAULT_CURRENCY_CODE, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localeEsPy from '@angular/common/locales/es-PY';

import { routes } from './app.routes';
import { jwtInterceptor } from './auth/jwt.interceptor';

registerLocaleData(localeEsPy, 'es-PY');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor])),
    provideAnimationsAsync(),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'es-PY' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'PYG' }
  ]
};
