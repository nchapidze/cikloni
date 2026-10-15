export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type Size = (typeof SIZES)[number];

export type ColorId = 'coral' | 'lilac' | 'orange' | 'mint';

/** A product color option (design/PRODUCT.md color table). */
export interface ProductColor {
  id: ColorId;
  nameKey: string;
  /** Swatch button color (a CSS color, usually a theme var()). */
  swatch: string;
  /** Soft tint used behind product photos. */
  soft: string;
}

export type AbsorbencyLevel = 'light' | 'medium' | 'heavy';

export interface AbsorbencyInfo {
  /** Filled drops out of 3. */
  drops: 1 | 2 | 3;
  nameKey: string;
  textKey: string;
  /** Short "for which days" note shown in the product page absorbency box. */
  noteKey: string;
}

export const ABSORBENCY: Record<AbsorbencyLevel, AbsorbencyInfo> = {
  light: {
    drops: 1,
    nameKey: 'ABSORBENCY.LEVELS.LIGHT.NAME',
    textKey: 'ABSORBENCY.LEVELS.LIGHT.TEXT',
    noteKey: 'PRODUCT.ABSORBENCY.NOTES.LIGHT',
  },
  medium: {
    drops: 2,
    nameKey: 'ABSORBENCY.LEVELS.MEDIUM.NAME',
    textKey: 'ABSORBENCY.LEVELS.MEDIUM.TEXT',
    noteKey: 'PRODUCT.ABSORBENCY.NOTES.MEDIUM',
  },
  heavy: {
    drops: 3,
    nameKey: 'ABSORBENCY.LEVELS.HEAVY.NAME',
    textKey: 'ABSORBENCY.LEVELS.HEAVY.TEXT',
    noteKey: 'PRODUCT.ABSORBENCY.NOTES.HEAVY',
  },
};

export interface Product {
  /** URL identifier, used in /product/:slug. */
  slug: string;
  nameKey: string;
  /** Price in GEL; null until prices are set (render PRODUCTS.PRICE_PLACEHOLDER). */
  price: number | null;
  /** Shows the "bestseller" badge on the product page. */
  bestseller: boolean;
  absorbency: AbsorbencyLevel;
  /** Available colors, in display order. */
  colors: readonly ColorId[];
  defaultColor: ColorId;
  sizes: readonly Size[];
  defaultSize: Size;
  descriptionKey: string;
  careKey: string;
  /** Color whose soft tint is the home page card background (design/HOME.md section 5). */
  cardColor: ColorId;
}
