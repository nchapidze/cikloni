import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';

/** design/HOME.md section 8: native details/summary accordion. */
@Component({
  selector: 'app-faq-section',
  imports: [TranslatePipe, LucideAngularModule],
  template: `
    <section id="faq" class="scroll-mt-4 bg-blush" aria-labelledby="faq-title">
      <div class="mx-auto flex max-w-205 flex-col gap-4 px-6 py-20">
        <h2 id="faq-title" class="m-0 mb-4 text-center">{{ 'FAQ.TITLE' | translate }}</h2>
        @for (item of items; track item.questionKey) {
          <details class="group rounded-panel bg-background px-6 py-3">
            <summary
              class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold"
            >
              {{ item.questionKey | translate }}
              <lucide-icon
                [img]="chevron"
                [size]="22"
                class="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>
            <p class="m-0 pt-1 pb-3">{{ item.answerKey | translate }}</p>
          </details>
        }
      </div>
    </section>
  `,
})
export class FaqSection {
  protected readonly chevron = ChevronDown;

  protected readonly items = [
    { questionKey: 'FAQ.ITEMS.WEAR_TIME.QUESTION', answerKey: 'FAQ.ITEMS.WEAR_TIME.ANSWER' },
    { questionKey: 'FAQ.ITEMS.WASHING.QUESTION', answerKey: 'FAQ.ITEMS.WASHING.ANSWER' },
    { questionKey: 'FAQ.ITEMS.PAIRS.QUESTION', answerKey: 'FAQ.ITEMS.PAIRS.ANSWER' },
    { questionKey: 'FAQ.ITEMS.DELIVERY.QUESTION', answerKey: 'FAQ.ITEMS.DELIVERY.ANSWER' },
  ];
}
