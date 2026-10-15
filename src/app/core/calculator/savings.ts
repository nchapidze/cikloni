import { CALCULATOR_CONFIG, CalculatorConfig } from './calculator.config';

export interface SavingsInput {
  productsPerDay: number;
  periodDays: number;
  packPriceGel: number;
  packSize: number;
}

export interface SavingsResult {
  disposablesPerYear: number;
  costPerYear: number;
  /** Disposables cost over the Cikloni lifespan. */
  disposableCost: number;
  cikloniCost: number;
  /** Negative when disposables are cheaper; the page shows a message instead. */
  savings: number;
  itemsAvoided: number;
}

export type SavingsField = keyof SavingsInput;

/** Fields with an invalid value: not a finite number, negative, or (packSize) below 1. */
export function invalidFields(input: SavingsInput): SavingsField[] {
  const invalid: SavingsField[] = [];
  const nonNegative = (value: number) => Number.isFinite(value) && value >= 0;

  if (!nonNegative(input.productsPerDay)) invalid.push('productsPerDay');
  if (!nonNegative(input.periodDays)) invalid.push('periodDays');
  if (!nonNegative(input.packPriceGel)) invalid.push('packPriceGel');
  if (!(Number.isFinite(input.packSize) && input.packSize >= 1)) invalid.push('packSize');
  return invalid;
}

/** Returns null when any input is invalid (see invalidFields). */
export function calculateSavings(
  input: SavingsInput,
  config: CalculatorConfig = CALCULATOR_CONFIG,
): SavingsResult | null {
  if (invalidFields(input).length > 0) return null;

  const disposablesPerYear = input.productsPerDay * input.periodDays * config.CYCLES_PER_YEAR;
  const costPerYear = disposablesPerYear * (input.packPriceGel / input.packSize);
  const disposableCost = costPerYear * config.LIFESPAN_YEARS;
  const cikloniCost = config.PAIRS_NEEDED * config.PAIR_PRICE_GEL;

  return {
    disposablesPerYear,
    costPerYear,
    disposableCost,
    cikloniCost,
    savings: disposableCost - cikloniCost,
    itemsAvoided: disposablesPerYear * config.LIFESPAN_YEARS,
  };
}
