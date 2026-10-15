import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CircleAlert, LucideAngularModule } from 'lucide-angular';
import {
  CALCULATOR_CONFIG,
  CALCULATOR_DEFAULTS,
  CALCULATOR_LIMITS,
  CURRENT_PRODUCTS,
  CurrentProduct,
} from '../../core/calculator/calculator.config';
import { SavingsField, calculateSavings, invalidFields } from '../../core/calculator/savings';
import { LanguageService } from '../../core/i18n/language.service';

const PRODUCT_KEYS: Record<CurrentProduct, string> = {
  pads: 'PADS',
  tampons: 'TAMPONS',
  both: 'BOTH',
};

/** Savings calculator: disposables vs Cikloni over the underwear's lifespan. */
@Component({
  selector: 'app-calculator-page',
  imports: [RouterLink, TranslatePipe, LucideAngularModule],
  templateUrl: './calculator.html',
})
export class CalculatorPage {
  private readonly language = inject(LanguageService);

  protected readonly config = CALCULATOR_CONFIG;
  protected readonly defaults = CALCULATOR_DEFAULTS;
  protected readonly limits = CALCULATOR_LIMITS;
  protected readonly alertIcon = CircleAlert;
  protected readonly productOptions = CURRENT_PRODUCTS.map((id) => ({
    id,
    labelKey: `CALCULATOR.PRODUCT.OPTIONS.${PRODUCT_KEYS[id]}`,
  }));

  protected readonly currentProduct = signal<CurrentProduct>(CALCULATOR_DEFAULTS.currentProduct);
  protected readonly productsPerDay = signal(CALCULATOR_DEFAULTS.productsPerDay);
  protected readonly periodDays = signal(CALCULATOR_DEFAULTS.periodDays);
  protected readonly packPriceGel = signal(CALCULATOR_DEFAULTS.packPriceGel);
  protected readonly packSize = signal(CALCULATOR_DEFAULTS.packSize);

  private readonly input = computed(() => ({
    productsPerDay: this.productsPerDay(),
    periodDays: this.periodDays(),
    packPriceGel: this.packPriceGel(),
    packSize: this.packSize(),
  }));

  private readonly invalid = computed(() => new Set(invalidFields(this.input())));
  protected readonly result = computed(() => calculateSavings(this.input()));

  protected readonly itemsAvoidedKey = computed(
    () => `CALCULATOR.RESULT.ITEMS_AVOIDED.${PRODUCT_KEYS[this.currentProduct()]}`,
  );

  /** Bar widths as a percentage of the larger cost. */
  protected readonly bars = computed(() => {
    const result = this.result();
    if (!result) return null;
    const max = Math.max(result.disposableCost, result.cikloniCost);
    const percent = (value: number) => (max > 0 ? (value / max) * 100 : 0);
    return { disposable: percent(result.disposableCost), cikloni: percent(result.cikloniCost) };
  });

  private readonly locale = computed(() => (this.language.current() === 'ka' ? 'ka-GE' : 'en-US'));

  protected isInvalid(field: SavingsField): boolean {
    return this.invalid().has(field);
  }

  /** Whole numbers by default; pass 2 for prices per piece. */
  protected format(value: number, fractionDigits = 0): string {
    return new Intl.NumberFormat(this.locale(), {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  }

  /** An empty or partial number input gives NaN, which validation then flags. */
  protected readNumber(event: Event): number {
    return (event.target as HTMLInputElement).valueAsNumber;
  }
}
