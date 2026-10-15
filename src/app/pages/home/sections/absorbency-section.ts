import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ABSORBENCY } from '../../../core/products/product.model';
import { AbsorbencyDrops } from '../../../shared/absorbency-drops/absorbency-drops';

/** design/HOME.md section 7. */
@Component({
  selector: 'app-absorbency-section',
  imports: [TranslatePipe, AbsorbencyDrops],
  template: `
    <section
      id="absorbency"
      class="mx-auto flex max-w-page scroll-mt-4 flex-col gap-8 px-6 py-20"
      aria-labelledby="absorbency-title"
    >
      <div class="flex flex-col items-center gap-2 text-center">
        <h2 id="absorbency-title" class="m-0">{{ 'ABSORBENCY.TITLE' | translate }}</h2>
        <p class="m-0 max-w-140">{{ 'ABSORBENCY.SUBTITLE' | translate }}</p>
      </div>
      <ul class="m-0 flex list-none flex-wrap gap-5 p-0">
        @for (level of levels; track level.nameKey) {
          <li
            class="flex grow basis-full flex-col gap-3.5 rounded-card border-2 border-border p-7 md:basis-0"
          >
            <app-absorbency-drops [level]="level.drops" />
            <h3 class="m-0">{{ level.nameKey | translate }}</h3>
            <p class="m-0">{{ level.textKey | translate }}</p>
          </li>
        }
      </ul>
    </section>
  `,
})
export class AbsorbencySection {
  protected readonly levels = [ABSORBENCY.light, ABSORBENCY.medium, ABSORBENCY.heavy];
}
