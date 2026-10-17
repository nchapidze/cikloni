import { TestBed } from '@angular/core/testing';
import { AdminProduct } from '../models/admin-product.model';
import { ADMIN_SUPABASE } from '../supabase/admin-supabase.client';
import {
  AdminProductsApi,
  ProductSaveError,
  ProductToSave,
  toAdminListItem,
  toAdminProduct,
} from './admin-products.api';

const imageUrl = (path: string) => `https://cdn.example/${path}`;

describe('toAdminListItem', () => {
  const row = {
    id: 'p1',
    slug: 'floral-bikini',
    name: { ka: 'ბიკინი' },
    price_gel: '39.90',
    absorbency: 'medium' as const,
    is_active: true,
    product_variants: [{ stock: 10 }, { stock: 3 }],
    product_images: [
      { storage_path: 'p1/b.jpg', sort_order: 1 },
      { storage_path: 'p1/a.jpg', sort_order: 0 },
    ],
  };

  it('sums the stock, flags low stock and picks the first image', () => {
    expect(toAdminListItem(row, imageUrl)).toMatchObject({
      priceGel: 39.9,
      totalStock: 13,
      variantCount: 2,
      lowStock: true,
      imageUrl: 'https://cdn.example/p1/a.jpg',
    });
  });

  it('is not low on stock above the threshold, and handles no images or variants', () => {
    expect(
      toAdminListItem(
        { ...row, price_gel: null, product_variants: [{ stock: 4 }], product_images: [] },
        imageUrl,
      ),
    ).toMatchObject({ priceGel: null, lowStock: false, imageUrl: null });
    expect(toAdminListItem({ ...row, product_variants: [] }, imageUrl)).toMatchObject({
      totalStock: 0,
      lowStock: false,
    });
  });
});

describe('toAdminProduct', () => {
  it('orders variants by palette color then size, and keeps the loaded stock', () => {
    const variant = (id: string, color_id: string, size: 'S' | 'M' | 'L') => ({
      id,
      color_id,
      color_name: { ka: color_id },
      color_hex: '#000000',
      size,
      stock: 4,
      sku: id,
    });
    const product = toAdminProduct({
      id: 'p1',
      slug: 's',
      name: { ka: 'ს' },
      description: null,
      care: null,
      price_gel: null,
      absorbency: 'light',
      sort_order: 0,
      is_active: false,
      product_variants: [
        variant('a', 'teal', 'S'),
        variant('b', 'coral', 'L'),
        variant('c', 'coral', 'S'),
        variant('d', 'mint', 'M'),
      ],
      product_images: [],
    });

    expect(product.variants.map((v) => v.id)).toEqual(['c', 'b', 'd', 'a']);
    expect(product.variants[0].loadedStock).toBe(4);
  });
});

describe('AdminProductsApi.saveProduct', () => {
  const product: ProductToSave['product'] = {
    id: 'p1',
    slug: 'floral-bikini',
    name: { ka: 'ბიკინი' },
    description: { ka: 'აღწერა' },
    care: { ka: 'მოვლა' },
    priceGel: 39.9,
    absorbency: 'medium',
    sortOrder: 0,
    isActive: true,
    variants: [
      {
        id: null,
        colorId: 'coral',
        colorName: { ka: 'ვარდისფერი' },
        colorHex: '#E8546B',
        size: 'M',
        stock: 5,
        loadedStock: null,
        sku: 'SKU-1',
      },
    ] satisfies AdminProduct['variants'],
  };
  const jpeg = new File([new Uint8Array(10)], 'a.jpg', { type: 'image/jpeg' });

  function setup(rpcError: { message: string } | null = null, uploadError: Error | null = null) {
    const upload = vi.fn().mockResolvedValue({ error: uploadError });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const rpc = vi.fn().mockResolvedValue({ data: 'p1', error: rpcError });
    const client = { rpc, storage: { from: () => ({ upload, remove }) } };
    TestBed.configureTestingModule({ providers: [{ provide: ADMIN_SUPABASE, useValue: client }] });
    return { api: TestBed.inject(AdminProductsApi), upload, remove, rpc };
  }

  it('uploads new images under the product, then saves everything in one call', async () => {
    const { api, upload, remove, rpc } = setup();

    await api.saveProduct({
      product,
      images: [
        { id: 'i1', storagePath: 'p1/old.jpg', colorId: null },
        { id: null, file: jpeg, colorId: 'coral' },
      ],
      removedPaths: ['p1/gone.jpg'],
    });

    const path = upload.mock.calls[0][0] as string;
    expect(path).toMatch(/^p1\/[0-9a-f-]{36}\.jpg$/);
    expect(rpc).toHaveBeenCalledWith('save_product', {
      product: expect.objectContaining({ id: 'p1', slug: 'floral-bikini', price_gel: 39.9 }),
      variants: [expect.objectContaining({ id: null, color_hex: '#e8546b', loaded_stock: null })],
      images: [
        { id: 'i1', storage_path: 'p1/old.jpg', color_id: null, sort_order: 0 },
        { id: null, storage_path: path, color_id: 'coral', sort_order: 1 },
      ],
    });
    expect(remove).toHaveBeenCalledWith(['p1/gone.jpg']);
  });

  it('removes the new uploads and keeps old files when the save fails', async () => {
    const { api, upload, remove } = setup({ message: 'SKU_TAKEN' });

    await expect(
      api.saveProduct({
        product,
        images: [{ id: null, file: jpeg, colorId: null }],
        removedPaths: ['p1/gone.jpg'],
      }),
    ).rejects.toEqual(new ProductSaveError('SKU_TAKEN'));

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0][0]]);
  });

  it('does not save when an upload fails', async () => {
    const { api, rpc } = setup(null, new Error('boom'));

    await expect(
      api.saveProduct({
        product,
        images: [{ id: null, file: jpeg, colorId: null }],
        removedPaths: [],
      }),
    ).rejects.toMatchObject({ failure: 'UPLOAD_FAILED' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('reports unknown errors as NETWORK', async () => {
    const { api } = setup({ message: 'Failed to fetch' });

    await expect(api.saveProduct({ product, images: [], removedPaths: [] })).rejects.toMatchObject({
      failure: 'NETWORK',
    });
  });
});
