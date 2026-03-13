import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const LOCALE_KEY = 'app_lang';

export type AppLang = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private translate = inject(TranslateService);

  constructor() {
    const saved = this.getStoredLang();
    const lang: AppLang = saved ?? this.getBrowserLang();
    this.translate.use(lang);
    this.applyDirection(lang);
  }

  private getBrowserLang(): AppLang {
    const raw = typeof navigator !== 'undefined' ? navigator.language : '';
    const code = (raw || '').toLowerCase().slice(0, 2);
    return code === 'ar' ? 'ar' : 'en';
  }

  get currentLang(): AppLang {
    const lang = this.translate.currentLang as AppLang;
    return lang === 'ar' ? 'ar' : 'en';
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  setLanguage(lang: AppLang): void {
    this.translate.use(lang);
    localStorage.setItem(LOCALE_KEY, lang);
    this.applyDirection(lang);
  }

  toggleLanguage(): void {
    const next: AppLang = this.currentLang === 'ar' ? 'en' : 'ar';
    this.setLanguage(next);
  }

  private getStoredLang(): AppLang | null {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === 'ar' || stored === 'en') return stored;
    return null;
  }

  private applyDirection(lang: AppLang): void {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const html = document.documentElement;
    html.setAttribute('dir', dir);
    html.setAttribute('lang', lang);
  }
}
