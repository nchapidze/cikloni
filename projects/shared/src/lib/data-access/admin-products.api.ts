import { Injectable, inject } from '@angular/core';
import { LocalizedText } from '../i18n/localized-text';
import {
  AdminImage,
  AdminProduct,
  AdminProductListItem,
  AdminVariant,
  LOW_STOCK_THRESHOLD,
  ProductSaveFailure,
} from '../models/admin-product.model';
import { compareColors } from '../models/product.palette';
import { AbsorbencyLevel, SIZES, Size } from '../models/product.model';
import { ADMIN_SUPABASE } from '../supabase/admin-supabase.client';
import { PRODUCT_IMAGES_BUCKET } from './products.api';

export class ProductSaveError extends Error {
  constructor(readonly failure: ProductSaveFailure) {
    super(failure);
  }
}

/** An image in the edit form: already stored (storagePath) or picked but not uploaded (file). */
export type ImageToSave =
  | { id: string; storagePath: string; colorId: string | null }
  | { id: null; file: File; colorId: string | null };

export interface ProductToSave {
  product: Omit<AdminProduct, 'images'>;
  /** In display order. */
  images: ImageToSave[];
  /** Storage paths of saved images the admin removed; deleted after a successful save. */
  removedPaths: string[];
}

interface ProductListRow {
  id: string;
  slug: string;
  name: LocalizedText;
  price_gel: number | string | null;
  absorbency: AbsorbencyLevel;
  is_active: boolean;
  product_variants: { stock: number }[];
  product_images: { storage_path: string; sort_order: number }[];
}

interface ProductRowForEdit {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText | null;
  care: LocalizedText | null;
  price_gel: number | string | null;
  absorbency: AbsorbencyLevel;
  sort_order: number;
  is_active: boolean;
  product_variants: {
    id: string;
    color_id: string;
    color_name: LocalizedText;
    color_hex: string;
    size: Size;
    stock: number;
    sku: string;
  }[];
  product_images: {
    id: string;
    storage_path: string;
    color_id: string | null;
    sort_order: number;
  }[];
}

const LIST_SELECT = `
  id, slug, name, price_gel, absorbency, is_active,
  product_variants (stock),
  product_images (storage_path, sort_order)
`;

const EDIT_SELECT = `
  id, slug, name, description, care, price_gel, absorbency, sort_order, is_active,
  product_variants (id, color_id, color_name, color_hex, size, stock, sku),
  product_images (id, storage_path, color_id, sort_order)
`;

const SAVE_FAILURES: readonly ProductSaveFailure[] = [
  'FORBIDDEN',
  'SLUG_TAKEN',
  'SKU_TAKEN',
  'DUPLICATE_VARIANT',
  'STOCK_CHANGED',
  'INVALID_PRODUCT',
];

/** Must match the bucket's allowed_mime_types and file_size_limit. */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const price = (value: number | string | null) => (value === null ? null : Number(value));

/** Colors in palette order, then sizes XS to XXL. */
function compareVariants(a: AdminVariant, b: AdminVariant): number {
  return (
    compareColors(a.colorId, b.colorId) ||
    a.colorId.localeCompare(b.colorId) ||
    SIZES.indexOf(a.size) - SIZES.indexOf(b.size)
  );
}

export function toAdminListItem(
  row: ProductListRow,
  imageUrl: (path: string) => string,
): AdminProductListItem {
  const stocks = row.product_variants.map((v) => v.stock);
  const first = [...row.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    priceGel: price(row.price_gel),
    absorbency: row.absorbency,
    isActive: row.is_active,
    totalStock: stocks.reduce((sum, stock) => sum + stock, 0),
    variantCount: stocks.length,
    lowStock: stocks.some((stock) => stock <= LOW_STOCK_THRESHOLD),
    imageUrl: first ? imageUrl(first.storage_path) : null,
  };
}

export function toAdminProduct(row: ProductRowForEdit): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    care: row.care,
    priceGel: price(row.price_gel),
    absorbency: row.absorbency,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    variants: row.product_variants
      .map((v) => ({
        id: v.id,
        colorId: v.color_id,
        colorName: v.color_name,
        colorHex: v.color_hex,
        size: v.size,
        stock: v.stock,
        loadedStock: v.stock,
        sku: v.sku,
      }))
      .sort(compareVariants),
    images: [...row.product_images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({ id: image.id, storagePath: image.storage_path, colorId: image.color_id })),
  };
}

/** Catalog management for the admin app (all products, active or not). */
@Injectable({ providedIn: 'root' })
export class AdminProductsApi {
  private readonly supabase = inject(ADMIN_SUPABASE);

  readonly imageUrl = (path: string): string =>
    this.supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;

  async listProducts(signal?: AbortSignal): Promise<AdminProductListItem[]> {
    let request = this.supabase
      .from('products')
      .select(LIST_SELECT)
      .order('sort_order')
      .order('slug');
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return (data as unknown as ProductListRow[]).map((row) => toAdminListItem(row, this.imageUrl));
  }

  /** null when there is no such product. */
  async getProduct(id: string, signal?: AbortSignal): Promise<AdminProduct | null> {
    let request = this.supabase.from('products').select(EDIT_SELECT).eq('id', id);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request.maybeSingle();
    if (error) {
      // invalid_text_representation: the id is not a uuid, so there is no such product.
      if (error.code === '22P02') return null;
      throw error;
    }
    return data ? toAdminProduct(data as unknown as ProductRowForEdit) : null;
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { data, error } = await this.supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!data.length) throw new Error('PRODUCT_NOT_FOUND');
  }

  /**
   * Uploads new images, then saves the product, its variants and images in one transaction
   * (save_product). If the save fails, the new uploads are removed again; if it succeeds, the
   * removed images' files are deleted. Throws ProductSaveError.
   */
  async saveProduct({ product, images, removedPaths }: ProductToSave): Promise<string> {
    const uploaded: string[] = [];
    const saved: AdminImage[] = [];
    try {
      for (const image of images) {
        if (image.id === null) {
          const storagePath = await this.upload(product.id, image.file);
          uploaded.push(storagePath);
          saved.push({ id: null, storagePath, colorId: image.colorId });
        } else {
          saved.push(image);
        }
      }
    } catch {
      await this.removeFiles(uploaded);
      throw new ProductSaveError('UPLOAD_FAILED');
    }

    const { error } = await this.supabase.rpc('save_product', {
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        care: product.care,
        price_gel: product.priceGel,
        absorbency: product.absorbency,
        sort_order: product.sortOrder,
        is_active: product.isActive,
      },
      variants: product.variants.map((v) => ({
        id: v.id,
        color_id: v.colorId,
        color_name: v.colorName,
        color_hex: v.colorHex.toLowerCase(),
        size: v.size,
        stock: v.stock,
        loaded_stock: v.loadedStock,
        sku: v.sku,
      })),
      images: saved.map((image, index) => ({
        id: image.id,
        storage_path: image.storagePath,
        color_id: image.colorId,
        sort_order: index,
      })),
    });

    if (error) {
      await this.removeFiles(uploaded);
      throw new ProductSaveError(SAVE_FAILURES.find((f) => f === error.message) ?? 'NETWORK');
    }
    await this.removeFiles(removedPaths);
    return product.id;
  }

  /** Deletes the product (variants and image rows cascade), then its image files. */
  async deleteProduct(id: string, imagePaths: string[]): Promise<void> {
    const { data, error } = await this.supabase.from('products').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data.length) throw new Error('PRODUCT_NOT_FOUND');
    await this.removeFiles(imagePaths);
  }

  private async upload(productId: string, file: File): Promise<string> {
    const extension = IMAGE_EXTENSIONS[file.type];
    if (!extension || file.size > MAX_IMAGE_BYTES) throw new Error('INVALID_IMAGE');
    const path = `${productId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await this.supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, {
      contentType: file.type,
      // Paths are never reused, so browsers and the CDN may cache them for good.
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw error;
    return path;
  }

  /** Best effort: a leftover file costs storage but breaks nothing. */
  private async removeFiles(paths: string[]): Promise<void> {
    if (!paths.length) return;
    await this.supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(paths)
      .catch(() => undefined);
  }
}
