import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, Package, Truck } from 'lucide-angular';
import { DELIVERY_METHODS, DELIVERY_METHOD_IDS, PAYMENT_METHOD_IDS } from '@cikloni/shared';
import { InfoPage } from '../../shared/info-page/info-page';
import { InfoSection } from '../../shared/info-page/info-section';
import { PricePipe } from '../../shared/price/price.pipe';

/**
 * Delivery areas, fees and timeframes. Fees come from the checkout config the server charges;
 * names and timeframes reuse the checkout copy, so this page always matches checkout.
 */
@Component({
  selector: 'app-delivery-page',
  imports: [TranslatePipe, LucideAngularModule, InfoPage, InfoSection, PricePipe],
  template: `
    <app-info-page titleKey="DELIVERY.TITLE" introKey="DELIVERY.INTRO">
      <app-info-section sectionId="delivery-areas" titleKey="DELIVERY.AREAS.TITLE">
        <ul class="m-0 grid list-none gap-4 p-0 sm:grid-cols-2" data-testid="delivery-methods">
          @for (method of methods; track method.id) {
            <li class="flex flex-col gap-2 rounded-card border-2 border-border p-6">
              <lucide-icon [img]="truckIcon" [size]="28" class="text-coral" aria-hidden="true" />
              <h3 class="m-0">{{ method.key + '.NAME' | translate }}</h3>
              <p class="m-0">{{ method.areaKey | translate }}</p>
              <dl class="m-0 mt-auto grid grid-cols-2 gap-4 pt-2">
                <div>
                  <dt class="text-sm">{{ 'DELIVERY.AREAS.TIME' | translate }}</dt>
                  <dd class="m-0 font-bold">{{ method.key + '.TIME' | translate }}</dd>
                </div>
                <div>
                  <dt class="text-sm">{{ 'DELIVERY.AREAS.FEE' | translate }}</dt>
                  <dd class="m-0 font-brand text-xl font-semibold" data-testid="delivery-fee">
                    {{ method.feeGel | price }}
                  </dd>
                </div>
              </dl>
            </li>
          }
        </ul>
        <p class="m-0">{{ 'DELIVERY.AREAS.NOTE' | translate }}</p>
      </app-info-section>

      <app-info-section
        sectionId="delivery-how"
        titleKey="DELIVERY.HOW.TITLE"
        [bullets]="howSteps"
        [after]="['DELIVERY.HOW.MISSED']"
      />

      <app-info-section sectionId="delivery-packaging" titleKey="DELIVERY.PACKAGING.TITLE">
        <div class="flex items-start gap-4 rounded-card bg-lilac-tint p-6">
          <lucide-icon
            [img]="packageIcon"
            [size]="28"
            class="shrink-0 text-lilac-strong"
            aria-hidden="true"
          />
          <p class="m-0">{{ 'DELIVERY.PACKAGING.TEXT' | translate }}</p>
        </div>
      </app-info-section>
    </app-info-page>
  `,
})
export class DeliveryPage {
  protected readonly truckIcon = Truck;
  protected readonly packageIcon = Package;

  protected readonly methods = DELIVERY_METHOD_IDS.map((id) => ({
    id,
    key: `CHECKOUT.DELIVERY.METHODS.${id.toUpperCase()}`,
    areaKey: `DELIVERY.AREAS.${id.toUpperCase()}`,
    feeGel: DELIVERY_METHODS[id].feeGel,
  }));

  protected readonly howSteps = [
    'DELIVERY.HOW.CONFIRM',
    'DELIVERY.HOW.COURIER',
    // One line per enabled payment method, from the checkout copy.
    ...PAYMENT_METHOD_IDS.map((id) => `CHECKOUT.PAYMENT.METHODS.${id.toUpperCase()}.TEXT`),
  ];
}
