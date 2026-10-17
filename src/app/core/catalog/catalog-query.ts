import {
  ABSORBENCY_LEVELS,
  AbsorbencyLevel,
  ColorId,
  PRODUCT_STYLES,
  Product,
  ProductColor,
  ProductStyle,
  SIZES,
  Size,
  compareColors,
  isProductStyle,
  isSize,
} from '@cikloni/shared';

export const CATALOG_SORTS = ['featured', 'price-asc', 'price-desc', 'newest'] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];
export const DEFAULT_SORT: CatalogSort = 'featured';

/** What the catalog shows; lives in the URL (?absorbency=light,medium&size=M&sort=newest). */
export interface CatalogQuery {
  absorbency: AbsorbencyLevel[];
  style: ProductStyle[];
  size: Size[];
  color: ColorId[];
  sort: CatalogSort;
}

export type CatalogFilter = Exclude<keyof CatalogQuery, 'sort'>;

export const EMPTY_QUERY: CatalogQuery = {
  absorbency: [],
  style: [],
  size: [],
  color: [],
  sort: DEFAULT_SORT,
};

/** The query string values, as bound to the page's inputs (undefined when absent). */
export type CatalogParams = Partial<Record<keyof CatalogQuery, string | undefined>>;

const isAbsorbency = (value: string): value is AbsorbencyLevel =>
  ABSORBENCY_LEVELS.includes(value as AbsorbencyLevel);
const isSort = (value: string): value is CatalogSort =>
  CATALOG_SORTS.includes(value as CatalogSort);
const isColorId = (value: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);

/** Comma-separated, de-duplicated, unknown values dropped (old or hand-edited links still work). */
function list<T extends string>(value: string | undefined, valid: (v: string) => v is T): T[] {
  const values = (value ?? '').split(',').map((v) => v.trim());
  return [...new Set(values.filter(valid))];
}

export function parseCatalogQuery(params: CatalogParams): CatalogQuery {
  return {
    absorbency: list(params.absorbency, isAbsorbency),
    style: list(params.style, isProductStyle),
    size: list(params.size, isSize),
    color: list(params.color, (v): v is ColorId => isColorId(v)),
    sort: params.sort && isSort(params.sort) ? params.sort : DEFAULT_SORT,
  };
}

/** Router queryParams for a query; null removes a param, so the default view has a clean URL. */
export function toQueryParams(query: CatalogQuery): Record<keyof CatalogQuery, string | null> {
  const join = (values: readonly string[]) => (values.length ? values.join(',') : null);
  return {
    absorbency: join(query.absorbency),
    style: join(query.style),
    size: join(query.size),
    color: join(query.color),
    sort: query.sort === DEFAULT_SORT ? null : query.sort,
  };
}

export function activeFilterCount(query: CatalogQuery): number {
  return query.absorbency.length + query.style.length + query.size.length + query.color.length;
}

export function toggleValue<K extends CatalogFilter>(
  query: CatalogQuery,
  filter: K,
  value: CatalogQuery[K][number],
): CatalogQuery {
  const values = query[filter] as string[];
  const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
  return { ...query, [filter]: next };
}

export function clearFilters(query: CatalogQuery): CatalogQuery {
  return { ...EMPTY_QUERY, sort: query.sort };
}

export function isOutOfStock(product: Product): boolean {
  return product.variants.every((variant) => variant.stock <= 0);
}

/**
 * Within a filter any selected value matches; across filters all must match. Size and color
 * are matched on the same variant, and a selected size must be in stock.
 */
export function matches(product: Product, query: CatalogQuery): boolean {
  if (query.absorbency.length && !query.absorbency.includes(product.absorbency)) return false;
  if (query.style.length && !query.style.includes(product.style)) return false;
  if (!query.size.length && !query.color.length) return true;
  return product.variants.some(
    (v) =>
      (!query.size.length || (query.size.includes(v.size) && v.stock > 0)) &&
      (!query.color.length || query.color.includes(v.colorId)),
  );
}

/** Products without a price go last when sorting by price. */
function comparePrice(a: Product, b: Product, direction: 1 | -1): number {
  if (a.price === null || b.price === null)
    return (a.price === null ? 1 : 0) - (b.price === null ? 1 : 0);
  return (a.price - b.price) * direction;
}

/**
 * Filters and sorts. `products` arrive in featured order (sort_order), which also breaks ties.
 * Out-of-stock products always come last.
 */
export function applyCatalogQuery(products: readonly Product[], query: CatalogQuery): Product[] {
  const featured = new Map(products.map((product, index) => [product.id, index]));
  const bySort = (a: Product, b: Product): number => {
    switch (query.sort) {
      case 'price-asc':
        return comparePrice(a, b, 1);
      case 'price-desc':
        return comparePrice(a, b, -1);
      case 'newest':
        return b.createdAt.getTime() - a.createdAt.getTime();
      default:
        return 0;
    }
  };
  return products
    .filter((product) => matches(product, query))
    .sort(
      (a, b) =>
        Number(isOutOfStock(a)) - Number(isOutOfStock(b)) ||
        bySort(a, b) ||
        featured.get(a.id)! - featured.get(b.id)!,
    );
}

export interface CatalogOptions {
  absorbency: AbsorbencyLevel[];
  style: ProductStyle[];
  /** Only sizes that some product has in stock. */
  size: Size[];
  color: ProductColor[];
}

/** The filter choices the catalog can actually satisfy, in display order. */
export function catalogOptions(products: readonly Product[]): CatalogOptions {
  const colors = new Map<ColorId, ProductColor>();
  for (const product of products) {
    for (const color of product.colors) if (!colors.has(color.id)) colors.set(color.id, color);
  }
  const inStock = new Set(
    products.flatMap((p) => p.variants.filter((v) => v.stock > 0).map((v) => v.size)),
  );
  return {
    absorbency: ABSORBENCY_LEVELS.filter((level) => products.some((p) => p.absorbency === level)),
    style: PRODUCT_STYLES.filter((style) => products.some((p) => p.style === style)),
    size: SIZES.filter((size) => inStock.has(size)),
    color: [...colors.values()].sort(
      (a, b) => compareColors(a.id, b.id) || a.id.localeCompare(b.id),
    ),
  };
}
