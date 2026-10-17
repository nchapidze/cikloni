import { LocalizedText } from '../i18n/localized-text';

/**
 * Product styles (cuts): the one config for both apps. Mirrors the public.product_style enum;
 * add a value there (new migration) and here together.
 */
export const PRODUCT_STYLES = [
  'bikini',
  'hipster',
  'boxer',
  'brazilian',
  'high_waist',
  'seamless',
] as const;
export type ProductStyle = (typeof PRODUCT_STYLES)[number];

/** Shown with the `localized` pipe in the shop and as `.ka` in the Georgian-only admin. */
export const PRODUCT_STYLE_LABELS: Record<ProductStyle, LocalizedText> = {
  bikini: { ka: 'ბიკინი', en: 'Bikini' },
  hipster: { ka: 'ჰიპსტერი', en: 'Hipster' },
  boxer: { ka: 'ბოქსერი', en: 'Boxer' },
  brazilian: { ka: 'ბრაზილიანა', en: 'Brazilian' },
  high_waist: { ka: 'მაღალი წელით', en: 'High waist' },
  seamless: { ka: 'უნაკერო', en: 'Seamless' },
};

export const DEFAULT_PRODUCT_STYLE: ProductStyle = 'bikini';

export function isProductStyle(value: unknown): value is ProductStyle {
  return PRODUCT_STYLES.includes(value as ProductStyle);
}
