import { LocalizedText } from '../i18n/localized-text';
import { ProductStyle } from './product-style';

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type Size = (typeof SIZES)[number];

/** Preselected on the product page when the product comes in it. */
export const DEFAULT_SIZE: Size = 'M';

export function isSize(value: unknown): value is Size {
  return SIZES.includes(value as Size);
}

/** Color id from the database, e.g. "coral". */
export type ColorId = string;

/** A product color option (design/PRODUCT.md color table). */
export interface ProductColor {
  id: ColorId;
  name: LocalizedText;
  /** Swatch button color (any CSS color). */
  swatch: string;
  /** Soft tint used behind product photos (a CSS color, usually a theme var()). */
  soft: string;
}

export interface ProductVariant {
  /** The only thing checkout sends for a line, with its quantity. */
  id: string;
  colorId: ColorId;
  size: Size;
  /** For display only; the server checks stock when an order is placed. */
  stock: number;
}

export interface ProductImage {
  url: string;
  /** null = shown for every color. */
  colorId: ColorId | null;
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
  id: string;
  /** URL identifier, used in /product/:slug. */
  slug: string;
  name: LocalizedText;
  description: LocalizedText | null;
  care: LocalizedText | null;
  /** Price in GEL for display; null until set (render PRODUCTS.PRICE_PLACEHOLDER). */
  price: number | null;
  /** Shows the "bestseller" badge and lists the product in the home bestsellers section. */
  bestseller: boolean;
  absorbency: AbsorbencyLevel;
  style: ProductStyle;
  /** When the product was added (for "newest" sorting). */
  createdAt: Date;
  /** Colors the product comes in, in display order. */
  colors: readonly ProductColor[];
  /** Sizes the product comes in, XS to XXL. */
  sizes: readonly Size[];
  variants: readonly ProductVariant[];
  /** In display order. */
  images: readonly ProductImage[];
  defaultColor: ColorId;
  defaultSize: Size;
}

/** The first photo for `colorId`, else the first photo shared by all colors. */
export function productImage(product: Product, colorId: ColorId): ProductImage | undefined {
  return (
    product.images.find((image) => image.colorId === colorId) ??
    product.images.find((image) => image.colorId === null)
  );
}

/**
 * A small picture for lists (cards, cart, checkout): the photo for `colorId` if there is one,
 * else any photo of the product, so a thumbnail is never empty while the product has photos.
 */
export function productThumbnail(product: Product, colorId: ColorId): ProductImage | undefined {
  return productImage(product, colorId) ?? product.images[0];
}

export function findVariant(
  product: Product,
  colorId: ColorId,
  size: Size,
): ProductVariant | undefined {
  return product.variants.find((v) => v.colorId === colorId && v.size === size);
}

/** True when the product is sold in this color and size. */
export function hasVariant(product: Product, colorId: ColorId, size: Size): boolean {
  return !!findVariant(product, colorId, size);
}
