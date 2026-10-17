import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InfoPage } from '../../shared/info-page/info-page';
import { InfoSection } from '../../shared/info-page/info-section';

/** Returns policy: unopened items only (hygiene), the window, how to ask, and refunds. */
@Component({
  selector: 'app-returns-page',
  imports: [TranslatePipe, InfoPage, InfoSection],
  template: `
    <app-info-page titleKey="RETURNS.TITLE" introKey="RETURNS.INTRO" updatedKey="RETURNS.UPDATED">
      <app-info-section
        sectionId="returns-conditions"
        titleKey="RETURNS.CONDITIONS.TITLE"
        [bullets]="[
          'RETURNS.CONDITIONS.UNOPENED',
          'RETURNS.CONDITIONS.UNUSED',
          'RETURNS.CONDITIONS.WINDOW',
        ]"
        [after]="['RETURNS.CONDITIONS.HYGIENE']"
      />

      <app-info-section
        sectionId="returns-wrong-item"
        titleKey="RETURNS.WRONG_ITEM.TITLE"
        [paragraphs]="['RETURNS.WRONG_ITEM.TEXT']"
      />

      <app-info-section sectionId="returns-how" titleKey="RETURNS.HOW.TITLE">
        <ol class="m-0 flex list-none flex-col gap-3 p-0" data-testid="returns-steps">
          @for (step of steps; track step; let i = $index) {
            <li class="flex items-start gap-3">
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-sunny font-brand font-semibold"
                aria-hidden="true"
                >{{ i + 1 }}</span
              >
              <span class="pt-0.5">{{ step | translate }}</span>
            </li>
          }
        </ol>
        <p class="m-0">{{ 'RETURNS.HOW.SHIPPING' | translate }}</p>
      </app-info-section>

      <app-info-section
        sectionId="returns-refund"
        titleKey="RETURNS.REFUND.TITLE"
        [paragraphs]="['RETURNS.REFUND.TEXT', 'RETURNS.REFUND.DELIVERY_FEE']"
      />
    </app-info-page>
  `,
})
export class ReturnsPage {
  protected readonly steps = [
    'RETURNS.HOW.STEPS.CONTACT',
    'RETURNS.HOW.STEPS.DETAILS',
    'RETURNS.HOW.STEPS.HANDOVER',
    'RETURNS.HOW.STEPS.REFUND',
  ];
}
