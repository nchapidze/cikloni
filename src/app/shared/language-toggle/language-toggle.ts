import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../core/i18n/language.service';

/**
 * Outlined "KA / EN" pill; the active language is emphasized.
 * The accessible name keeps the visible "KA / EN" (so voice control can target it) and adds the
 * action, written in the target language.
 */
@Component({
  selector: 'app-language-toggle',
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="inline-flex min-h-11 cursor-pointer items-center rounded-pill border-2 border-plum bg-transparent px-4 font-brand text-sm font-medium text-plum/72 hover:bg-blush"
      (click)="language.toggle()"
    >
      <span
        [class.font-semibold]="language.current() === 'ka'"
        [class.text-plum]="language.current() === 'ka'"
        >KA</span
      >
      <span>&nbsp;/&nbsp;</span>
      <span
        [class.font-semibold]="language.current() === 'en'"
        [class.text-plum]="language.current() === 'en'"
        >EN</span
      >
      <span class="sr-only" [attr.lang]="target()"
        >&nbsp;{{ 'HEADER.LANGUAGE_SWITCH' | translate }}</span
      >
    </button>
  `,
})
export class LanguageToggle {
  protected readonly language = inject(LanguageService);
  protected readonly target = computed(() => (this.language.current() === 'ka' ? 'en' : 'ka'));
}
