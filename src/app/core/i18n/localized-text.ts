import { Lang } from './language.service';

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
