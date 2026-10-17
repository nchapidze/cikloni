import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/i18n/language.service';
import { LocalizedText, localize } from '../../core/i18n/localized-text';

/**
 * Renders database text in the current language, falling back to Georgian.
 * Usage: {{ product.name | localized }}
 *
 * Impure so it reads the language signal on every run; the template then tracks that
 * signal and re-renders when the language changes. The work is a single property lookup.
 */
@Pipe({ name: 'localized', pure: false })
export class LocalizedPipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(text: LocalizedText | null | undefined): string {
    return localize(text, this.language.current());
  }
}
