import { Injectable, inject } from '@angular/core';
import { LocalizedText } from '../i18n/localized-text';
import { colorTint, compareColors } from '../models/product.palette';
import {
  AbsorbencyLevel,
  DEFAULT_SIZE,
  Product,
  ProductColor,
  ProductVariant,
  SIZES,
  isSize,
} from '../models/product.model';
import { ProductStyle } from '../models/product-style';
import { SUPABASE } from '../supabase/supabase.client';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

/** Shape of a `products` row with its embedded variants and images (see PRODUCT_SELECT). */
export interface ProductRow {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText | null;
  care: LocalizedText | null;
  price_gel: number | null;
  absorbency: AbsorbencyLevel;
  style: ProductStyle;
  created_at: string;
  is_bestseller: boolean;
  product_variants: {
    id: string;
    color_id: string;
    color_name: LocalizedText;
    color_hex: string;
    size: string;
    stock: number;
  }[];
  product_images: {
    color_id: string | null;
    storage_path: string;
    sort_order: number;
  }[];
}

const PRODUCT_SELECT = `
  id, slug, name, description, care, price_gel, absorbency, style, created_at, is_bestseller,
  product_variants (id, color_id, color_name, color_hex, size, stock),
  product_images (color_id, storage_path, sort_order)
`;

/**
 * Maps a database row to the storefront model. Returns null for a product with no variants,
 * since it cannot be bought.
 */
export function toProduct(row: ProductRow, imageUrl: (path: string) => string): Product | null {
  const colors = new Map<string, ProductColor>();
  const variants: ProductVariant[] = [];
  for (const v of row.product_variants) {
    if (!isSize(v.size)) continue;
    variants.push({ id: v.id, colorId: v.color_id, size: v.size, stock: v.stock });
    if (!colors.has(v.color_id)) {
      colors.set(v.color_id, {
        id: v.color_id,
        name: v.color_name,
        swatch: v.color_hex,
        soft: colorTint(v.color_id, v.color_hex),
      });
    }
  }
  if (!variants.length) return null;

  const sortedColors = [...colors.values()].sort((a, b) => compareColors(a.id, b.id));
  const sizes = SIZES.filter((size) => variants.some((v) => v.size === size));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    care: row.care,
    // Postgres numeric arrives as a JSON number; Number() also covers a string.
    price: row.price_gel === null ? null : Number(row.price_gel),
    bestseller: row.is_bestseller,
    absorbency: row.absorbency,
    style: row.style,
    createdAt: new Date(row.created_at),
    colors: sortedColors,
    sizes,
    variants,
    images: [...row.product_images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({ url: imageUrl(image.storage_path), colorId: image.color_id })),
    defaultColor: sortedColors[0].id,
    defaultSize: sizes.includes(DEFAULT_SIZE) ? DEFAULT_SIZE : sizes[0],
  };
}

/** Reads the storefront catalog from Supabase. */
@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly supabase = inject(SUPABASE);

  /** All active products (RLS hides the rest) with their variants and images. */
  async listProducts(signal?: AbortSignal): Promise<Product[]> {
    let query = this.supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .order('sort_order')
      .order('slug');
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;
    if (error) throw error;

    const imageUrl = (path: string) =>
      this.supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
    return (data as unknown as ProductRow[]).flatMap((row) => toProduct(row, imageUrl) ?? []);
  }
}
