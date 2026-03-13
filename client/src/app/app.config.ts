import { ApplicationConfig, APP_INITIALIZER, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { lastValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorNotificationInterceptor } from './core/interceptors/error-notification.interceptor';

const LOCALE_KEY = 'app_lang';

function getInitialLang(): 'en' | 'ar' {
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored === 'ar' || stored === 'en') return stored;
  const raw = typeof navigator !== 'undefined' ? navigator.language : '';
  const code = (raw || '').toLowerCase().slice(0, 2);
  return code === 'ar' ? 'ar' : 'en';
}

function initTranslations(translate: TranslateService): () => Promise<unknown> {
  return () => {
    const lang = getInitialLang();
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    return lastValueFrom(translate.use(lang));
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, errorNotificationInterceptor])),
    provideAnimations(),
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en',
      loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    }),
    { provide: APP_INITIALIZER, useFactory: initTranslations, deps: [TranslateService], multi: true },
  ],
};
