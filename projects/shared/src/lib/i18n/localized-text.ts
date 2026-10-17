import { InjectionToken, Signal, signal } from '@angular/core';

export const LANGUAGES = ['ka', 'en'] as const;
export type Lang = (typeof LANGUAGES)[number];
export const DEFAULT_LANG: Lang = 'ka';

export function isLang(value: unknown): value is Lang {
  return LANGUAGES.includes(value as Lang);
}

/**
 * The language database text is shown in. The shop provides its LanguageService signal;
 * an app that does not provide it (the Georgian-only admin) gets Georgian.
 */
export const CURRENT_LANG = new InjectionToken<Signal<Lang>>('CURRENT_LANG', {
  providedIn: 'root',
  factory: () => signal(DEFAULT_LANG).asReadonly(),
});

/** Translatable database text: Georgian is required, English is optional. */
export interface LocalizedText {
  ka: string;
  en?: string;
}

/** Picks the text for `lang`, falling back to Georgian when it is missing or blank. */
export function localize(text: LocalizedText | null | undefined, lang: Lang): string {
  if (!text) return '';
  const value = text[lang];
  return value?.trim() ? value : text.ka;
}
