import { ColorId } from './product.model';

/**
 * Soft tints (theme tokens in src/styles.css) behind photos for the brand colors from
 * design/PRODUCT.md, in display order. Swatch colors come from the database.
 */
const COLOR_TINTS: Record<string, string> = {
  coral: 'var(--color-coral-soft)',
  lilac: 'var(--color-lilac)',
  orange: 'var(--color-sunny)',
  mint: 'var(--color-mint)',
};

const COLOR_ORDER = Object.keys(COLOR_TINTS);

/** Home page card backgrounds, cycled by position (design/HOME.md section 5). */
export const CARD_TINTS: readonly string[] = Object.values(COLOR_TINTS);

/** Photo tint for a color; colors outside the brand palette get a light mix of their swatch. */
export function colorTint(id: ColorId, swatch: string): string {
  return COLOR_TINTS[id] ?? `color-mix(in srgb, ${swatch} 40%, var(--color-background))`;
}

/** Sorts brand colors in palette order, with any other colors after them. */
export function compareColors(a: ColorId, b: ColorId): number {
  const rank = (id: ColorId) => {
    const index = COLOR_ORDER.indexOf(id);
    return index === -1 ? COLOR_ORDER.length : index;
  };
  return rank(a) - rank(b);
}
