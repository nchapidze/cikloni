import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Layout for text pages (delivery, returns, privacy, terms, contact): title, intro, the
 * projected sections and, unless turned off, a "questions? contact us" footer.
 */
@Component({
  selector: 'app-info-page',
  imports: [RouterLink, TranslatePipe],
  template: `
    <article class="mx-auto flex max-w-205 flex-col gap-10 px-6 py-12 md:py-20">
      <header class="flex flex-col gap-3">
        <h1 class="m-0 text-3xl sm:text-4xl md:text-h1">{{ titleKey() | translate }}</h1>
        <p class="m-0 text-lg">{{ introKey() | translate }}</p>
        @if (updatedKey(); as updated) {
          <p class="m-0 text-sm text-plum/80">{{ updated | translate }}</p>
        }
      </header>

      <ng-content />

      @if (showContact()) {
        <aside class="flex flex-col items-start gap-3 rounded-card bg-blush p-6 sm:p-8">
          <p class="m-0 text-lg font-bold">{{ 'INFO_PAGE.QUESTIONS' | translate }}</p>
          <a
            routerLink="/contact"
            class="flex min-h-12 items-center rounded-pill bg-plum px-7 font-bold text-blush no-underline"
            >{{ 'INFO_PAGE.CONTACT_US' | translate }}</a
          >
        </aside>
      }
    </article>
  `,
})
export class InfoPage {
  readonly titleKey = input.required<string>();
  readonly introKey = input.required<string>();
  /** "Last updated" line, for policies. */
  readonly updatedKey = input<string>();
  readonly showContact = input(true);
}
