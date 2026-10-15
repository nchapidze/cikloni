import { TestBed } from '@angular/core/testing';
import ka from '../../../assets/i18n/ka.json';
import { ProductService } from './product.service';

function hasKey(key: string): boolean {
  let node: unknown = ka;
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object' || !(part in node)) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string';
}

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    service = TestBed.inject(ProductService);
  });

  it('has the four bestsellers from HOME.md with unique slugs', () => {
    const slugs = service.products().map((p) => p.slug);
    expect(slugs).toEqual([
      'floral-bikini',
      'seamless-hipster',
      'colorful-boxer',
      'lace-brazilian',
    ]);
  });

  it('finds a product by slug', () => {
    expect(service.getBySlug('floral-bikini')?.absorbency).toBe('medium');
    expect(service.getBySlug('nope')).toBeUndefined();
  });

  it('resolves colors to swatch and soft theme tokens', () => {
    const colors = service.getColors(service.getBySlug('floral-bikini')!);
    expect(colors.map((c) => c.id)).toEqual(['coral', 'lilac', 'orange', 'mint']);
    expect(colors[0]).toMatchObject({
      swatch: 'var(--color-coral-strong)',
      soft: 'var(--color-coral-soft)',
    });
  });

  it('keeps defaults valid for every product', () => {
    for (const product of service.products()) {
      expect(product.colors).toContain(product.defaultColor);
      expect(product.sizes).toContain(product.defaultSize);
      expect(product.price).toBeNull();
    }
  });

  it('only references translation keys that exist', () => {
    for (const product of service.products()) {
      for (const key of [product.nameKey, product.descriptionKey, product.careKey]) {
        expect(hasKey(key), key).toBe(true);
      }
      for (const color of service.getColors(product)) {
        expect(hasKey(color.nameKey), color.nameKey).toBe(true);
      }
    }
  });
});
