import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PAYMENT_METHOD_IDS } from '@cikloni/shared';
import { InfoPage } from '../../shared/info-page/info-page';
import { InfoSection } from '../../shared/info-page/info-section';

/** Terms of sale. Payment methods are listed from the checkout config. */
@Component({
  selector: 'app-terms-page',
  imports: [RouterLink, TranslatePipe, InfoPage, InfoSection],
  template: `
    <app-info-page titleKey="TERMS.TITLE" introKey="TERMS.INTRO" updatedKey="TERMS.UPDATED">
      <app-info-section
        sectionId="terms-seller"
        titleKey="TERMS.SELLER.TITLE"
        [paragraphs]="['TERMS.SELLER.TEXT']"
      />

      <app-info-section
        sectionId="terms-prices"
        titleKey="TERMS.PRICES.TITLE"
        [bullets]="[
          'TERMS.PRICES.GEL',
          'TERMS.PRICES.VAT',
          'TERMS.PRICES.DELIVERY',
          'TERMS.PRICES.FIXED',
        ]"
      />

      <app-info-section
        sectionId="terms-order"
        titleKey="TERMS.ORDER.TITLE"
        [bullets]="[
          'TERMS.ORDER.NUMBER',
          'TERMS.ORDER.CONFIRMATION',
          'TERMS.ORDER.UNAVAILABLE',
          'TERMS.ORDER.CANCEL',
        ]"
      />

      <app-info-section
        sectionId="terms-payment"
        titleKey="TERMS.PAYMENT.TITLE"
        [paragraphs]="['TERMS.PAYMENT.INTRO']"
      >
        <ul
          class="m-0 flex list-disc flex-col gap-2 pl-6 marker:text-coral"
          data-testid="terms-payment"
        >
          @for (key of paymentKeys; track key) {
            <li>
              <strong>{{ key + '.NAME' | translate }}</strong> — {{ key + '.TEXT' | translate }}
            </li>
          }
        </ul>
      </app-info-section>

      <app-info-section sectionId="terms-delivery" titleKey="TERMS.DELIVERY_RETURNS.TITLE">
        <p class="m-0">{{ 'TERMS.DELIVERY_RETURNS.TEXT' | translate }}</p>
        <ul class="m-0 flex list-none flex-wrap gap-x-6 p-0">
          <li>
            <a routerLink="/delivery" class="inline-flex min-h-11 items-center font-bold">{{
              'FOOTER.INFO.DELIVERY' | translate
            }}</a>
          </li>
          <li>
            <a routerLink="/returns" class="inline-flex min-h-11 items-center font-bold">{{
              'FOOTER.INFO.RETURNS' | translate
            }}</a>
          </li>
        </ul>
      </app-info-section>

      <app-info-section
        sectionId="terms-changes"
        titleKey="TERMS.CHANGES.TITLE"
        [paragraphs]="['TERMS.CHANGES.TEXT', 'TERMS.CHANGES.LAW']"
      />
    </app-info-page>
  `,
})
export class TermsPage {
  protected readonly paymentKeys = PAYMENT_METHOD_IDS.map(
    (id) => `CHECKOUT.PAYMENT.METHODS.${id.toUpperCase()}`,
  );
}
