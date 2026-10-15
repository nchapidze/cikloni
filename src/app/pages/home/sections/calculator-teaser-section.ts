import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** Short teaser after Benefits, linking to the savings calculator. */
@Component({
  selector: 'app-calculator-teaser-section',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="mx-auto max-w-page px-6 py-14" aria-labelledby="calculator-teaser-title">
      <div
        class="flex flex-col items-start gap-5 rounded-card bg-sunny-soft p-7 sm:p-10 md:flex-row md:items-center md:justify-between"
      >
        <div class="flex flex-col gap-2">
          <h2 id="calculator-teaser-title" class="m-0">
            {{ 'CALCULATOR.TEASER.TITLE' | translate }}
          </h2>
          <p class="m-0 max-w-130">{{ 'CALCULATOR.TEASER.TEXT' | translate }}</p>
        </div>
        <a
          routerLink="/calculator"
          class="inline-flex min-h-13 shrink-0 items-center rounded-pill bg-plum px-7 font-bold text-blush no-underline"
          >{{ 'CALCULATOR.TEASER.CTA' | translate }}</a
        >
      </div>
    </section>
  `,
})
export class CalculatorTeaserSection {}
