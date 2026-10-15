import { CalculatorConfig } from './calculator.config';
import { SavingsInput, calculateSavings, invalidFields } from './savings';

describe('calculateSavings', () => {
  const config: CalculatorConfig = {
    CYCLES_PER_YEAR: 12,
    PAIRS_NEEDED: 5,
    PAIR_PRICE_GEL: 40,
    LIFESPAN_YEARS: 2,
  };
  const input: SavingsInput = { productsPerDay: 4, periodDays: 5, packPriceGel: 10, packSize: 10 };

  it('computes every value from the formulas', () => {
    expect(calculateSavings(input, config)).toEqual({
      disposablesPerYear: 240, // 4 * 5 * 12
      costPerYear: 240, // 240 * (10 / 10)
      disposableCost: 480, // 240 * 2
      cikloniCost: 200, // 5 * 40
      savings: 280,
      itemsAvoided: 480, // 240 * 2
    });
  });

  it('uses the price per piece, not the pack price', () => {
    const result = calculateSavings({ ...input, packPriceGel: 9, packSize: 20 }, config)!;
    expect(result.costPerYear).toBeCloseTo(108); // 240 * 0.45
    expect(result.disposableCost).toBeCloseTo(216);
  });

  it('returns negative savings when disposables cost less than Cikloni', () => {
    const result = calculateSavings({ ...input, productsPerDay: 1, periodDays: 3 }, config)!;
    expect(result.disposableCost).toBe(72); // 1 * 3 * 12 * 1 * 2
    expect(result.savings).toBe(-128);
  });

  it('treats free disposables as costing nothing but still counts items', () => {
    const result = calculateSavings({ ...input, packPriceGel: 0 }, config)!;
    expect(result.disposableCost).toBe(0);
    expect(result.savings).toBe(-200);
    expect(result.itemsAvoided).toBe(480);
  });

  it('reads the constants from the config', () => {
    const result = calculateSavings(input, { ...config, LIFESPAN_YEARS: 3, PAIR_PRICE_GEL: 50 })!;
    expect(result.disposableCost).toBe(720);
    expect(result.cikloniCost).toBe(250);
    expect(result.itemsAvoided).toBe(720);
  });

  it('works with the default config', () => {
    expect(calculateSavings(input)).not.toBeNull();
  });

  it('returns null for invalid input', () => {
    expect(calculateSavings({ ...input, packSize: 0 }, config)).toBeNull();
    expect(calculateSavings({ ...input, packPriceGel: -1 }, config)).toBeNull();
    expect(calculateSavings({ ...input, packPriceGel: NaN }, config)).toBeNull();
  });
});

describe('invalidFields', () => {
  const valid: SavingsInput = { productsPerDay: 4, periodDays: 5, packPriceGel: 10, packSize: 10 };

  it('accepts valid input, including a free pack', () => {
    expect(invalidFields(valid)).toEqual([]);
    expect(invalidFields({ ...valid, packPriceGel: 0 })).toEqual([]);
  });

  it('rejects negatives', () => {
    expect(
      invalidFields({ productsPerDay: -1, periodDays: -1, packPriceGel: -0.5, packSize: -2 }),
    ).toEqual(['productsPerDay', 'periodDays', 'packPriceGel', 'packSize']);
  });

  it('requires at least one piece per pack', () => {
    expect(invalidFields({ ...valid, packSize: 0 })).toEqual(['packSize']);
    expect(invalidFields({ ...valid, packSize: 0.5 })).toEqual(['packSize']);
    expect(invalidFields({ ...valid, packSize: 1 })).toEqual([]);
  });

  it('rejects empty or non-numeric values (NaN, Infinity)', () => {
    expect(invalidFields({ ...valid, packPriceGel: NaN, packSize: Infinity })).toEqual([
      'packPriceGel',
      'packSize',
    ]);
  });
});
