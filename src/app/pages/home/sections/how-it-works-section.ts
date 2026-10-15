import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** design/HOME.md section 6. */
@Component({
  selector: 'app-how-it-works-section',
  imports: [TranslatePipe],
  template: `
    <section id="how" class="scroll-mt-4 bg-plum text-blush" aria-labelledby="how-title">
      <div class="mx-auto flex max-w-page flex-col gap-10 px-6 py-20">
        <h2 id="how-title" class="m-0 text-center">{{ 'HOW_IT_WORKS.TITLE' | translate }}</h2>
        <ol class="m-0 flex list-none flex-wrap gap-6 p-0">
          @for (step of steps; track step.titleKey) {
            <li class="flex grow basis-full flex-col items-center gap-3 p-4 text-center md:basis-0">
              <span
                class="flex size-18 items-center justify-center rounded-full border-3 border-coral font-brand text-3xl font-semibold"
                aria-hidden="true"
                >{{ $index + 1 }}</span
              >
              <h3 class="m-0">{{ step.titleKey | translate }}</h3>
              <p class="m-0 max-w-75">{{ step.textKey | translate }}</p>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
})
export class HowItWorksSection {
  protected readonly steps = [
    { titleKey: 'HOW_IT_WORKS.STEPS.WEAR.TITLE', textKey: 'HOW_IT_WORKS.STEPS.WEAR.TEXT' },
    { titleKey: 'HOW_IT_WORKS.STEPS.WASH.TITLE', textKey: 'HOW_IT_WORKS.STEPS.WASH.TEXT' },
    { titleKey: 'HOW_IT_WORKS.STEPS.REPEAT.TITLE', textKey: 'HOW_IT_WORKS.STEPS.REPEAT.TEXT' },
  ];
}
