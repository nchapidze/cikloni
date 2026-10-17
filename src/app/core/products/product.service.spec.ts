import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { mapRows, provideCatalogTesting, SEED_ROWS } from '@cikloni/shared/testing';
import { ProductService } from './product.service';

describe('ProductService', () => {
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  function setup(listProducts?: () => Promise<ReturnType<typeof mapRows>>) {
    TestBed.configureTestingModule({ providers: [provideCatalogTesting(listProducts)] });
    return TestBed.inject(ProductService);
  }

  it('loads the catalog in display order', async () => {
    const service = setup();
    expect(service.status()).toBe('loading');
    expect(service.products()).toEqual([]);

    await settle();

    expect(service.status()).toBe('ready');
    expect(service.products().map((p) => p.slug)).toEqual([
      'floral-bikini',
      'seamless-hipster',
      'colorful-boxer',
      'lace-brazilian',
    ]);
  });

  it('finds a product by slug', async () => {
    const service = setup();
    await settle();

    expect(service.getBySlug('floral-bikini')?.absorbency).toBe('medium');
    expect(service.getBySlug('nope')).toBeUndefined();
  });

  it('reports an error and recovers on reload', async () => {
    const listProducts = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(mapRows(SEED_ROWS));
    const service = setup(listProducts);
    await settle();

    expect(service.status()).toBe('error');
    expect(service.products()).toEqual([]);

    service.reload();
    await settle();

    expect(service.status()).toBe('ready');
    expect(service.products()).toHaveLength(4);
    expect(listProducts).toHaveBeenCalledTimes(2);
  });
});
