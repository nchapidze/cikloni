import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BenefitCard } from '../../../shared/benefit-card/benefit-card';

/** design/HOME.md section 4. */
@Component({
  selector: 'app-benefits-section',
  imports: [TranslatePipe, BenefitCard],
  template: `
    <section class="bg-blush" aria-labelledby="benefits-title">
      <div class="mx-auto max-w-page px-6 py-14">
        <h2 id="benefits-title" class="sr-only">{{ 'BENEFITS.TITLE' | translate }}</h2>
        <ul class="m-0 flex list-none flex-wrap gap-5 p-0">
          @for (benefit of benefits; track benefit.titleKey) {
            <li class="grow basis-57.5">
              <app-benefit-card
                [number]="$index + 1"
                [title]="benefit.titleKey | translate"
                [text]="benefit.textKey | translate"
                [circleClass]="benefit.circleClass"
              />
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class BenefitsSection {
  protected readonly benefits = [
    { titleKey: 'BENEFITS.SAVE.TITLE', textKey: 'BENEFITS.SAVE.TEXT', circleClass: 'bg-sunny' },
    { titleKey: 'BENEFITS.NATURE.TITLE', textKey: 'BENEFITS.NATURE.TEXT', circleClass: 'bg-mint' },
    {
      titleKey: 'BENEFITS.COMFORT.TITLE',
      textKey: 'BENEFITS.COMFORT.TEXT',
      circleClass: 'bg-lilac',
    },
    {
      titleKey: 'BENEFITS.PROTECTION.TITLE',
      textKey: 'BENEFITS.PROTECTION.TEXT',
      circleClass: 'bg-coral-soft',
    },
  ];
}
