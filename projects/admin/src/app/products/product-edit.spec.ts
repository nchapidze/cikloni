import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AdminProduct } from '@cikloni/shared';
import { AdminProductsApi, ProductSaveError, ProductToSave } from '@cikloni/shared/admin';
import { ConfirmService } from '../ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../ui/toast/toast.service';
import { AdminProductEditPage } from './product-edit';

const PRODUCT: AdminProduct = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'floral-bikini',
  name: { ka: 'ყვავილოვანი ბიკინი', en: 'Floral bikini' },
  description: { ka: 'აღწერა' },
  care: { ka: 'მოვლა' },
  priceGel: 39.9,
  absorbency: 'medium',
  sortOrder: 1,
  isActive: true,
  variants: [
    {
      id: 'v1',
      colorId: 'coral',
      colorName: { ka: 'ვარდისფერი', en: 'Pink' },
      colorHex: '#e8546b',
      size: 'M',
      stock: 2,
      loadedStock: 2,
      sku: 'FLORAL-BIKINI-CORAL-M',
    },
  ],
  images: [{ id: 'i1', storagePath: 'p/i1.jpg', colorId: 'coral' }],
};

async function render(
  id?: string,
  overrides: { confirm?: boolean; saveError?: ProductSaveError } = {},
) {
  const saveProduct = vi.fn(async (input: ProductToSave) => {
    if (overrides.saveError) throw overrides.saveError;
    return input.product.id;
  });
  const api = {
    getProduct: vi.fn().mockResolvedValue(structuredClone(PRODUCT)),
    imageUrl: (path: string) => `https://cdn.example/${path}`,
    saveProduct,
    deleteProduct: vi.fn().mockResolvedValue(undefined),
  };
  const toast = { success: vi.fn(), error: vi.fn() };
  const confirm = { confirm: vi.fn().mockResolvedValue(overrides.confirm ?? true) };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AdminProductsApi, useValue: api },
      { provide: ToastService, useValue: toast },
      { provide: ConfirmService, useValue: confirm },
    ],
  });
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(AdminProductEditPage);
  if (id) fixture.componentRef.setInput('id', id);
  await fixture.whenStable();

  const el: HTMLElement = fixture.nativeElement;
  const field = (id: string) => el.querySelector<HTMLInputElement>(`#${id}`)!;
  const type = async (id: string, value: string) => {
    field(id).value = value;
    field(id).dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const click = async (text: string) => {
    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!.click();
    await fixture.whenStable();
  };
  const submit = async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };
  return { fixture, el, field, type, click, submit, api, toast, confirm, navigate };
}

describe('AdminProductEditPage', () => {
  it('creates a product: slug from the English name, generated color id and SKU', async () => {
    const { type, click, field, submit, api, toast, navigate, fixture } = await render();

    await type('product-name', 'ბიკინი');
    await click('EN');
    await type('product-name', 'Lace Brazilian');
    expect(field('product-slug').value).toBe('lace-brazilian');

    await type('product-description', 'აღწერა');
    await type('product-care', 'მოვლა');
    await click('ვარიანტის დამატება');
    await type('variant-0-color-name', 'მწვანე');
    await type('variant-0-hex', '#2AA79B');
    await submit();
    await vi.waitFor(() => expect(api.saveProduct).toHaveBeenCalled());
    await fixture.whenStable();

    const { product, images } = api.saveProduct.mock.calls[0][0];
    expect(product).toMatchObject({
      slug: 'lace-brazilian',
      name: { ka: 'ბიკინი', en: 'Lace Brazilian' },
      priceGel: null,
      isActive: false,
    });
    expect(product.variants).toEqual([
      expect.objectContaining({
        id: null,
        colorId: 'color-2aa79b',
        colorHex: '#2aa79b',
        size: 'M',
        sku: 'LACE-BRAZILIAN-COLOR-2AA79B-M',
      }),
    ]);
    expect(images).toEqual([]);
    expect(toast.success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/products', product.id], { replaceUrl: true });
  });

  it('does not save an invalid form', async () => {
    const { submit, api, toast } = await render();

    await submit();

    expect(api.saveProduct).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('შეასწორეთ მონიშნული ველები.');
  });

  it('loads a product and saves it with its image color and loaded stock', async () => {
    const { el, type, submit, api } = await render(PRODUCT.id);
    expect(el.querySelector('h1')!.textContent).toContain('ყვავილოვანი ბიკინი');

    await type('variant-0-stock', '7');
    await submit();
    await vi.waitFor(() => expect(api.saveProduct).toHaveBeenCalled());

    const { product, images, removedPaths } = api.saveProduct.mock.calls[0][0];
    expect(product.variants[0]).toMatchObject({
      id: 'v1',
      colorId: 'coral',
      stock: 7,
      loadedStock: 2,
    });
    expect(images).toEqual([{ id: 'i1', storagePath: 'p/i1.jpg', colorId: 'coral' }]);
    expect(removedPaths).toEqual([]);
  });

  it('asks before removing a saved variant', async () => {
    const { el, confirm, fixture } = await render(PRODUCT.id, { confirm: false });
    const remove = () => el.querySelector<HTMLButtonElement>('[aria-label^="ვარიანტის წაშლა"]')!;

    remove().click();
    await fixture.whenStable();

    expect(confirm.confirm).toHaveBeenCalledWith(expect.objectContaining({ danger: true }));
    expect(el.querySelector('#variant-0-stock')).not.toBeNull();
  });

  it('shows the reason when saving fails', async () => {
    const { submit, toast, field, fixture } = await render(PRODUCT.id, {
      saveError: new ProductSaveError('SLUG_TAKEN'),
    });

    await submit();
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled());
    await fixture.whenStable();

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('slug უკვე სხვა პროდუქტს'));
    expect(field('product-slug').getAttribute('aria-invalid')).toBe('true');
  });

  it('deletes after confirmation', async () => {
    const { click, api, navigate, confirm } = await render(PRODUCT.id);

    await click('პროდუქტის წაშლა');
    await vi.waitFor(() => expect(api.deleteProduct).toHaveBeenCalled());

    expect(confirm.confirm).toHaveBeenCalled();
    expect(api.deleteProduct).toHaveBeenCalledWith(PRODUCT.id, ['p/i1.jpg']);
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/products']));
  });
});
