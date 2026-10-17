import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../core/i18n/language.service';

/**
 * Formats a GEL amount for the current language ("39,90 ₾" / "39.90 ₾"); whole amounts drop
 * the decimals. null renders the price placeholder.
 * Impure so it re-runs when the language signal changes (see LocalizedPipe).
 */
@Pipe({ name: 'price', pure: false })
export class PricePipe implements PipeTransform {
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  transform(amount: number | null | undefined): string {
    const lang = this.language.current();
    if (amount === null || amount === undefined) {
      return this.translate.instant('PRODUCTS.PRICE_PLACEHOLDER');
    }
    const digits = Number.isInteger(amount) ? 0 : 2;
    const price = new Intl.NumberFormat(lang === 'ka' ? 'ka-GE' : 'en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
    return this.translate.instant('PRODUCTS.PRICE', { price });
  }
}
