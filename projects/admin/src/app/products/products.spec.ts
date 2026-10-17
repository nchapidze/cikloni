import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminProductListItem } from '@cikloni/shared';
import { AdminProductsApi } from '@cikloni/shared/admin';
import { ToastService } from '../ui/toast/toast.service';
import { AdminProductsPage } from './products';

const item = (fields: Partial<AdminProductListItem>): AdminProductListItem => ({
  id: 'p1',
  slug: 'floral-bikini',
  name: { ka: 'ყვავილოვანი ბიკინი' },
  priceGel: 39.9,
  absorbency: 'medium',
  isActive: true,
  totalStock: 40,
  variantCount: 4,
  lowStock: false,
  imageUrl: null,
  ...fields,
});

async function render(
  products: AdminProductListItem[],
  setActive = vi.fn().mockResolvedValue(undefined),
) {
  const toast = { success: vi.fn(), error: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AdminProductsApi,
        useValue: { listProducts: vi.fn().mockResolvedValue(products), setActive },
      },
      { provide: ToastService, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(AdminProductsPage);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement, toast, setActive };
}

describe('AdminProductsPage', () => {
  it('lists products with price, absorbency, stock and the low-stock badge', async () => {
    const { el } = await render([
      item({}),
      item({ id: 'p2', name: { ka: 'ჰიპსტერი' }, priceGel: null, lowStock: true, totalStock: 5 }),
    ]);
    const rows = [...el.querySelectorAll('li')].map((li) => li.textContent!.replace(/\s+/g, ' '));

    expect(rows[0]).toContain('ყვავილოვანი ბიკინი');
    expect(rows[0]).toMatch(/39[,.]90 ₾/);
    expect(rows[0]).toContain('საშუალო');
    expect(rows[0]).not.toContain('მარაგი იწურება');
    expect(rows[1]).toContain('ფასი არ არის');
    expect(rows[1]).toContain('5 ც.');
    expect(rows[1]).toContain('მარაგი იწურება');
  });

  it('switches is_active right away and confirms with a toast', async () => {
    const { el, fixture, setActive, toast } = await render([item({})]);
    const toggle = el.querySelector<HTMLButtonElement>('[role="switch"]')!;

    toggle.click();
    await fixture.whenStable();

    expect(setActive).toHaveBeenCalledWith('p1', false);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(toast.success).toHaveBeenCalled();
  });

  it('switches back and shows an error when saving fails', async () => {
    const { el, fixture, toast } = await render([item({})], vi.fn().mockRejectedValue(new Error()));
    const toggle = el.querySelector<HTMLButtonElement>('[role="switch"]')!;

    toggle.click();
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled());
    await fixture.whenStable();

    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });
});
