import { Pipe, PipeTransform, inject } from '@angular/core';
import { CURRENT_LANG, LocalizedText, localize } from './localized-text';

/**
 * Renders database text in the current language, falling back to Georgian.
 * Usage: {{ product.name | localized }}
 *
 * Impure so it reads the language signal on every run; the template then tracks that
 * signal and re-renders when the language changes. The work is a single property lookup.
 */
@Pipe({ name: 'localized', pure: false })
export class LocalizedPipe implements PipeTransform {
  private readonly lang = inject(CURRENT_LANG);

  transform(text: LocalizedText | null | undefined): string {
    return localize(text, this.lang());
  }
}
