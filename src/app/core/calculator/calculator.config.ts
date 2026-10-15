/**
 * Savings calculator constants. Edit the numbers here; the page, the assumptions text and the
 * tests all read from this file.
 *
 * TODO: confirm PAIRS_NEEDED, PAIR_PRICE_GEL, LIFESPAN_YEARS and the input defaults
 * (placeholders until real prices are set, see design/DESIGN.md "Placeholders still to fill").
 */
export const CALCULATOR_CONFIG: CalculatorConfig = {
  CYCLES_PER_YEAR: 12,
  /** Pairs of Cikloni underwear needed for one full cycle. */
  PAIRS_NEEDED: 5,
  PAIR_PRICE_GEL: 40,
  /** How long a pair lasts with normal care. */
  LIFESPAN_YEARS: 2,
};

export interface CalculatorConfig {
  readonly CYCLES_PER_YEAR: number;
  readonly PAIRS_NEEDED: number;
  readonly PAIR_PRICE_GEL: number;
  readonly LIFESPAN_YEARS: number;
}

export const CURRENT_PRODUCTS = ['pads', 'tampons', 'both'] as const;
export type CurrentProduct = (typeof CURRENT_PRODUCTS)[number];

/** Starting values for the inputs. */
export const CALCULATOR_DEFAULTS = {
  currentProduct: 'pads' as CurrentProduct,
  productsPerDay: 4,
  periodDays: 5,
  packPriceGel: 10,
  packSize: 10,
};

/** Slider ranges. */
export const CALCULATOR_LIMITS = {
  productsPerDay: { min: 1, max: 10 },
  periodDays: { min: 3, max: 8 },
} as const;
