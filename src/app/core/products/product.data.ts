import { ColorId, Product, ProductColor, SIZES } from './product.model';

/** Mock catalog from design/HOME.md section 5 and design/PRODUCT.md. */

/** Colors reference theme tokens in src/styles.css (rendered as inline background colors). */
export const PRODUCT_COLORS: Record<ColorId, ProductColor> = {
  coral: {
    id: 'coral',
    nameKey: 'PRODUCT.COLOR.OPTIONS.CORAL',
    swatch: 'var(--color-coral-strong)',
    soft: 'var(--color-coral-soft)',
  },
  lilac: {
    id: 'lilac',
    nameKey: 'PRODUCT.COLOR.OPTIONS.LILAC',
    swatch: 'var(--color-lilac-strong)',
    soft: 'var(--color-lilac)',
  },
  orange: {
    id: 'orange',
    nameKey: 'PRODUCT.COLOR.OPTIONS.ORANGE',
    swatch: 'var(--color-orange)',
    soft: 'var(--color-sunny)',
  },
  mint: {
    id: 'mint',
    nameKey: 'PRODUCT.COLOR.OPTIONS.MINT',
    swatch: 'var(--color-mint-strong)',
    soft: 'var(--color-mint)',
  },
};

const CARE_KEY = 'PRODUCT.DETAILS.CARE.TEXT';

export const PRODUCTS: readonly Product[] = [
  {
    slug: 'floral-bikini',
    nameKey: 'PRODUCTS.ITEMS.FLORAL_BIKINI.NAME',
    price: null,
    bestseller: true,
    absorbency: 'medium',
    // PRODUCT.md lists four colors for this product.
    colors: ['coral', 'lilac', 'orange', 'mint'],
    defaultColor: 'coral',
    sizes: SIZES,
    defaultSize: 'M',
    descriptionKey: 'PRODUCTS.ITEMS.FLORAL_BIKINI.DESCRIPTION',
    careKey: CARE_KEY,
    cardColor: 'coral',
  },
  {
    slug: 'seamless-hipster',
    nameKey: 'PRODUCTS.ITEMS.SEAMLESS_HIPSTER.NAME',
    price: null,
    bestseller: true,
    absorbency: 'light',
    // HOME.md cards show these three color dots.
    colors: ['coral', 'lilac', 'orange'],
    defaultColor: 'coral',
    sizes: SIZES,
    defaultSize: 'M',
    descriptionKey: 'PRODUCTS.ITEMS.SEAMLESS_HIPSTER.DESCRIPTION',
    careKey: CARE_KEY,
    cardColor: 'lilac',
  },
  {
    slug: 'colorful-boxer',
    nameKey: 'PRODUCTS.ITEMS.COLORFUL_BOXER.NAME',
    price: null,
    bestseller: true,
    absorbency: 'heavy',
    colors: ['coral', 'lilac', 'orange'],
    defaultColor: 'coral',
    sizes: SIZES,
    defaultSize: 'M',
    descriptionKey: 'PRODUCTS.ITEMS.COLORFUL_BOXER.DESCRIPTION',
    careKey: CARE_KEY,
    cardColor: 'orange',
  },
  {
    slug: 'lace-brazilian',
    nameKey: 'PRODUCTS.ITEMS.LACE_BRAZILIAN.NAME',
    price: null,
    bestseller: true,
    absorbency: 'light',
    colors: ['coral', 'lilac', 'orange'],
    defaultColor: 'coral',
    sizes: SIZES,
    defaultSize: 'M',
    descriptionKey: 'PRODUCTS.ITEMS.LACE_BRAZILIAN.DESCRIPTION',
    careKey: CARE_KEY,
    cardColor: 'mint',
  },
];
