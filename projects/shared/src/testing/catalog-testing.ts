import { Provider } from '@angular/core';
import { ProductRow, ProductsApi, toProduct } from '../lib/data-access/products.api';
import { LocalizedText } from '../lib/i18n/localized-text';
import { Product, SIZES } from '../lib/models/product.model';

const COLORS: Record<string, { name: LocalizedText; hex: string }> = {
  coral: { name: { ka: 'ვარდისფერი', en: 'Pink' }, hex: '#e8546b' },
  lilac: { name: { ka: 'იასამნისფერი', en: 'Lilac' }, hex: '#8e5bd9' },
  orange: { name: { ka: 'ნარინჯისფერი', en: 'Orange' }, hex: '#f28c38' },
  mint: { name: { ka: 'პიტნისფერი', en: 'Mint' }, hex: '#2aa79b' },
};

const CARE: LocalizedText = {
  ka: 'გამოავლე ცივ წყალში, გარეცხე ცივ რეჟიმზე, გააშრე ჰაერზე. არ გამოიყენო ქსოვილის დამარბილებელი და საშრობი მანქანა.',
  en: "Rinse in cold water, machine wash on a cold cycle and air dry. Don't use fabric softener or a tumble dryer.",
};

/** A stable fake uuid per variant, e.g. for "floral-bikini", "coral", "M". */
export function variantId(slug: string, colorId: string, size: string): string {
  const hex = [...`${slug}:${colorId}:${size}`]
    .reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 7)
    .toString(16)
    .padStart(8, '0');
  return `${hex}-0000-4000-8000-000000000000`;
}

function variants(slug: string, colorIds: string[]): ProductRow['product_variants'] {
  return colorIds.flatMap((id) =>
    SIZES.map((size) => ({
      id: variantId(slug, id, size),
      color_id: id,
      color_name: COLORS[id].name,
      color_hex: COLORS[id].hex,
      size,
      stock: 20,
    })),
  );
}

function row(slug: string, fields: Partial<ProductRow>): ProductRow {
  return {
    id: `id-${slug}`,
    slug,
    name: { ka: slug },
    description: { ka: '[აღწერა]', en: '[description]' },
    care: CARE,
    price_gel: null,
    absorbency: 'light',
    is_bestseller: true,
    product_variants: variants(slug, ['coral', 'lilac', 'orange']),
    product_images: [],
    ...fields,
  };
}

/** Rows as Supabase returns them for supabase/seed.sql. Keep the two in sync. */
export const SEED_ROWS: readonly ProductRow[] = [
  row('floral-bikini', {
    name: { ka: 'ყვავილოვანი ბიკინი', en: 'Floral bikini' },
    description: {
      ka: 'ფერადი ყვავილოვანი ბიკინი რამდენიმეშრიანი შთამნთქმელი ფენით. [ქსოვილის შემადგენლობა, ფენების რაოდენობა, სერტიფიკატები]',
      en: 'A colorful floral bikini with a multi-layer absorbent lining. [fabric composition, number of layers, certificates]',
    },
    absorbency: 'medium',
    product_variants: variants('floral-bikini', ['coral', 'lilac', 'orange', 'mint']),
  }),
  row('seamless-hipster', { name: { ka: 'უნაკერო ჰიპსტერი', en: 'Seamless hipster' } }),
  row('colorful-boxer', {
    name: { ka: 'ფერადი ბოქსერი', en: 'Colorful boxer' },
    absorbency: 'heavy',
  }),
  row('lace-brazilian', { name: { ka: 'მაქმანიანი ბრაზილიანა', en: 'Lace Brazilian' } }),
];

export const testImageUrl = (path: string) => `https://storage.test/product-images/${path}`;

export function mapRows(rows: readonly ProductRow[]): Product[] {
  return rows.flatMap((r) => toProduct(r, testImageUrl) ?? []);
}

/**
 * Replaces the Supabase-backed ProductsApi. By default it resolves with the seed catalog;
 * pass `listProducts` to simulate slow or failing loads.
 */
export function provideCatalogTesting(
  listProducts: () => Promise<Product[]> = async () => mapRows(SEED_ROWS),
): Provider[] {
  return [{ provide: ProductsApi, useValue: { listProducts } satisfies Partial<ProductsApi> }];
}
