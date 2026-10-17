import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ArrowRight, ChevronDown, LucideAngularModule } from 'lucide-angular';
import { CALCULATOR_CONFIG } from '../../../core/calculator/calculator.config';

/** design/HOME.md section 8: native details/summary accordion. */
@Component({
  selector: 'app-faq-section',
  imports: [RouterLink, TranslatePipe, LucideAngularModule],
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
            <p class="m-0 pt-1 pb-3">{{ item.answerKey | translate: item.params }}</p>
            @if (item.link; as link) {
              <a
                [routerLink]="link.route"
                class="mb-2 inline-flex min-h-11 items-center gap-1 font-bold"
                >{{ link.labelKey | translate }}
                <lucide-icon [img]="arrow" [size]="18" aria-hidden="true" />
              </a>
            }
          </details>
        }
      </div>
    </section>
  `,
})
export class FaqSection {
  protected readonly chevron = ChevronDown;
  protected readonly arrow = ArrowRight;

  protected readonly items: FaqItem[] = [
    { questionKey: 'FAQ.ITEMS.WEAR_TIME.QUESTION', answerKey: 'FAQ.ITEMS.WEAR_TIME.ANSWER' },
    { questionKey: 'FAQ.ITEMS.WASHING.QUESTION', answerKey: 'FAQ.ITEMS.WASHING.ANSWER' },
    {
      questionKey: 'FAQ.ITEMS.PAIRS.QUESTION',
      answerKey: 'FAQ.ITEMS.PAIRS.ANSWER',
      // Same number the savings calculator assumes.
      params: { pairs: CALCULATOR_CONFIG.PAIRS_NEEDED },
    },
    {
      questionKey: 'FAQ.ITEMS.DELIVERY.QUESTION',
      answerKey: 'FAQ.ITEMS.DELIVERY.ANSWER',
      link: { labelKey: 'FAQ.ITEMS.DELIVERY.LINK', route: '/delivery' },
    },
  ];
}

interface FaqItem {
  questionKey: string;
  answerKey: string;
  params?: Record<string, unknown>;
  /** "Read more" link under the answer. */
  link?: { labelKey: string; route: string };
}
