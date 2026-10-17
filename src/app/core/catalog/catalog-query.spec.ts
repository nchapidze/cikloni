import { Product } from '@cikloni/shared';
import { SEED_ROWS, mapRows } from '@cikloni/shared/testing';
import {
  EMPTY_QUERY,
  activeFilterCount,
  applyCatalogQuery,
  catalogOptions,
  clearFilters,
  isOutOfStock,
  parseCatalogQuery,
  toQueryParams,
  toggleValue,
} from './catalog-query';

const [bikini, hipster, boxer, brazilian] = mapRows(SEED_ROWS);

/** A copy of `product` with every variant's stock replaced. */
const withStock = (
  product: Product,
  stock: (v: Product['variants'][number]) => number,
): Product => ({
  ...product,
  variants: product.variants.map((v) => ({ ...v, stock: stock(v) })),
});

const slugs = (products: Product[]) => products.map((p) => p.slug);

describe('parseCatalogQuery / toQueryParams', () => {
  it('reads comma-separated values and drops unknown ones', () => {
    expect(
      parseCatalogQuery({
        absorbency: 'light,extreme,light',
        style: 'bikini,thong',
        size: 'M,XXXL',
        color: 'coral,Not A Color',
        sort: 'cheapest',
      }),
    ).toEqual({
      absorbency: ['light'],
      style: ['bikini'],
      size: ['M'],
      color: ['coral'],
      sort: 'featured',
    });
  });

  it('round-trips, and leaves defaults out of the URL', () => {
    const query = { ...EMPTY_QUERY, size: ['S', 'M'] as const, sort: 'newest' as const };
    const params = toQueryParams({ ...query, size: [...query.size] });

    expect(params).toEqual({
      absorbency: null,
      style: null,
      size: 'S,M',
      color: null,
      sort: 'newest',
    });
    expect(parseCatalogQuery({ size: params.size!, sort: params.sort! })).toEqual({
      ...query,
      size: ['S', 'M'],
    });
    expect(toQueryParams(EMPTY_QUERY)).toEqual({
      absorbency: null,
      style: null,
      size: null,
      color: null,
      sort: null,
    });
  });
});

describe('toggleValue / clearFilters / activeFilterCount', () => {
  it('adds and removes a value, and clearing keeps the sort', () => {
    let query = toggleValue(EMPTY_QUERY, 'style', 'boxer');
    query = toggleValue(query, 'size', 'L');
    expect(query.style).toEqual(['boxer']);
    expect(activeFilterCount(query)).toBe(2);

    query = toggleValue(query, 'style', 'boxer');
    expect(query.style).toEqual([]);

    expect(clearFilters({ ...query, sort: 'price-asc' })).toEqual({
      ...EMPTY_QUERY,
      sort: 'price-asc',
    });
  });
});

describe('applyCatalogQuery', () => {
  it('keeps featured order by default', () => {
    expect(slugs(applyCatalogQuery([bikini, hipster, boxer, brazilian], EMPTY_QUERY))).toEqual([
      'floral-bikini',
      'seamless-hipster',
      'colorful-boxer',
      'lace-brazilian',
    ]);
  });

  it('matches any value within a filter and all filters together', () => {
    const all = [bikini, hipster, boxer, brazilian];
    expect(
      slugs(applyCatalogQuery(all, { ...EMPTY_QUERY, absorbency: ['light', 'heavy'] })),
    ).toEqual(['seamless-hipster', 'colorful-boxer', 'lace-brazilian']);
    expect(
      slugs(
        applyCatalogQuery(all, { ...EMPTY_QUERY, absorbency: ['light'], style: ['brazilian'] }),
      ),
    ).toEqual(['lace-brazilian']);
    expect(slugs(applyCatalogQuery(all, { ...EMPTY_QUERY, color: ['mint'] }))).toEqual([
      'floral-bikini',
    ]);
  });

  it('only matches a size that is in stock, in the selected color', () => {
    const noMintM = withStock(bikini, (v) => (v.colorId === 'mint' && v.size === 'M' ? 0 : 5));
    const noM = withStock(hipster, (v) => (v.size === 'M' ? 0 : 5));

    expect(slugs(applyCatalogQuery([noMintM, noM], { ...EMPTY_QUERY, size: ['M'] }))).toEqual([
      'floral-bikini',
    ]);
    expect(
      slugs(applyCatalogQuery([noMintM], { ...EMPTY_QUERY, size: ['M'], color: ['mint'] })),
    ).toEqual([]);
  });

  it('sorts by price with unpriced products last, and by newest', () => {
    const priced = [
      { ...bikini, price: 45 },
      { ...hipster, price: null },
      { ...boxer, price: 30, createdAt: new Date('2026-10-18') },
      { ...brazilian, price: 39.9, createdAt: new Date('2026-10-17') },
    ];

    expect(slugs(applyCatalogQuery(priced, { ...EMPTY_QUERY, sort: 'price-asc' }))).toEqual([
      'colorful-boxer',
      'lace-brazilian',
      'floral-bikini',
      'seamless-hipster',
    ]);
    expect(slugs(applyCatalogQuery(priced, { ...EMPTY_QUERY, sort: 'price-desc' }))).toEqual([
      'floral-bikini',
      'lace-brazilian',
      'colorful-boxer',
      'seamless-hipster',
    ]);
    expect(slugs(applyCatalogQuery(priced, { ...EMPTY_QUERY, sort: 'newest' }))).toEqual([
      'colorful-boxer',
      'lace-brazilian',
      'floral-bikini',
      'seamless-hipster',
    ]);
  });

  it('puts out-of-stock products last, whatever the sort', () => {
    const soldOut = { ...withStock(bikini, () => 0), price: 1 };
    expect(isOutOfStock(soldOut)).toBe(true);

    const result = applyCatalogQuery([soldOut, { ...hipster, price: 50 }], {
      ...EMPTY_QUERY,
      sort: 'price-asc',
    });
    expect(slugs(result)).toEqual(['seamless-hipster', 'floral-bikini']);
  });
});

describe('catalogOptions', () => {
  it('offers what the catalog has: in-stock sizes and colors in palette order', () => {
    const options = catalogOptions([
      withStock(bikini, (v) => (v.size === 'XXL' ? 0 : 5)),
      withStock(boxer, (v) => (v.size === 'XXL' ? 0 : 5)),
    ]);

    expect(options.absorbency).toEqual(['medium', 'heavy']);
    expect(options.style).toEqual(['bikini', 'boxer']);
    expect(options.size).toEqual(['XS', 'S', 'M', 'L', 'XL']);
    expect(options.color.map((c) => c.id)).toEqual(['coral', 'lilac', 'orange', 'mint']);
  });
});
