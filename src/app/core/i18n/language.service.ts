import { DOCUMENT, Injectable, Provider, computed, inject } from '@angular/core';
import { CURRENT_LANG, DEFAULT_LANG, LANGUAGES, Lang, isLang } from '@cikloni/shared';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

const STORAGE_KEY = 'cikloni.lang';

/** Switches between Georgian (default) and English, persisting the choice. */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly current = computed<Lang>(() => {
    const lang = this.translate.currentLang();
    return isLang(lang) ? lang : DEFAULT_LANG;
  });

  /** Restores the saved language. Runs as an app initializer so the first render is translated. */
  init(): Observable<unknown> {
    this.translate.addLangs([...LANGUAGES]);
    return this.use(this.readStored() ?? DEFAULT_LANG);
  }

  use(lang: Lang): Observable<unknown> {
    this.document.documentElement.lang = lang;
    this.store(lang);
    return this.translate.use(lang);
  }

  toggle(): void {
    this.use(this.current() === 'ka' ? 'en' : 'ka').subscribe();
  }

  private readStored(): Lang | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return isLang(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  private store(lang: Lang): void {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage unavailable (private mode etc.); the choice just won't persist.
    }
  }
}

/** Shows database text (the shared `localized` pipe) in the shop's current language. */
export function provideShopLanguage(): Provider {
  return { provide: CURRENT_LANG, useFactory: () => inject(LanguageService).current };
}
