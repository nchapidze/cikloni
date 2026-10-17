import { SEED_ROWS, testImageUrl } from '../../../testing/catalog-testing';
import { ProductRow, toProduct } from './products.api';

describe('toProduct', () => {
  const bikini = SEED_ROWS[0];
  const map = (fields: Partial<ProductRow>) => toProduct({ ...bikini, ...fields }, testImageUrl);

  it('maps a seed row with defaults the product page can use', () => {
    const product = toProduct(bikini, testImageUrl)!;

    expect(product).toMatchObject({
      slug: 'floral-bikini',
      name: { ka: 'ყვავილოვანი ბიკინი', en: 'Floral bikini' },
      price: null,
      bestseller: true,
      absorbency: 'medium',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      defaultColor: 'coral',
      defaultSize: 'M',
    });
    expect(product.variants).toHaveLength(24);
    expect(product.colors[0]).toEqual({
      id: 'coral',
      name: { ka: 'ვარდისფერი', en: 'Pink' },
      swatch: '#e8546b',
      soft: 'var(--color-coral-soft)',
    });
  });

  it('orders brand colors by the palette and sizes XS to XXL', () => {
    const product = map({
      product_variants: [
        {
          color_id: 'teal',
          color_name: { ka: 'ფირუზი' },
          color_hex: '#008080',
          size: 'L',
          stock: 1,
        },
        {
          color_id: 'mint',
          color_name: { ka: 'პიტნისფერი' },
          color_hex: '#2aa79b',
          size: 'S',
          stock: 1,
        },
        {
          color_id: 'coral',
          color_name: { ka: 'ვარდისფერი' },
          color_hex: '#e8546b',
          size: 'L',
          stock: 0,
        },
      ],
    })!;

    expect(product.colors.map((c) => c.id)).toEqual(['coral', 'mint', 'teal']);
    expect(product.colors[2].soft).toBe('color-mix(in srgb, #008080 40%, var(--color-background))');
    expect(product.sizes).toEqual(['S', 'L']);
    // M is not available, so the first size is preselected.
    expect(product.defaultSize).toBe('S');
  });

  it('turns a numeric price into a number', () => {
    expect(map({ price_gel: 39.9 })!.price).toBe(39.9);
    expect(map({ price_gel: '45.00' as unknown as number })!.price).toBe(45);
  });

  it('resolves image URLs in sort order', () => {
    const product = map({
      product_images: [
        { color_id: 'lilac', storage_path: 'bikini/lilac.webp', sort_order: 2 },
        { color_id: null, storage_path: 'bikini/layers.webp', sort_order: 1 },
      ],
    })!;

    expect(product.images).toEqual([
      { url: 'https://storage.test/product-images/bikini/layers.webp', colorId: null },
      { url: 'https://storage.test/product-images/bikini/lilac.webp', colorId: 'lilac' },
    ]);
  });

  it('skips products without sellable variants', () => {
    expect(map({ product_variants: [] })).toBeNull();
  });
});
