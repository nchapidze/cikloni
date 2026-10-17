import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboard } from '@cikloni/shared';
import { AdminDashboardApi } from '@cikloni/shared/admin';
import { AdminDashboardPage } from './dashboard';

const DASHBOARD: AdminDashboard = {
  ordersToday: 3,
  ordersMonth: 42,
  revenueMonthGel: 1234.5,
  newOrders: 2,
  bestSellers: [
    { productId: 'p1', name: { ka: 'ყვავილოვანი ბიკინი' }, quantity: 12, revenueGel: 478.8 },
    { productId: null, name: { ka: 'ძველი მოდელი' }, quantity: 1, revenueGel: 30 },
  ],
  lowStock: [
    {
      variantId: 'v1',
      productId: 'p1',
      productName: { ka: 'ყვავილოვანი ბიკინი' },
      colorName: { ka: 'ვარდისფერი' },
      size: 'M',
      stock: 0,
      sku: 'FLORAL-BIKINI-CORAL-M',
      isActive: true,
    },
    {
      variantId: 'v2',
      productId: 'p2',
      productName: { ka: 'ჰიპსტერი' },
      colorName: { ka: 'პიტნისფერი' },
      size: 'S',
      stock: 2,
      sku: 'HIPSTER-MINT-S',
      isActive: false,
    },
  ],
};

async function render(dashboard: AdminDashboard | Error) {
  const getDashboard =
    dashboard instanceof Error
      ? vi.fn().mockRejectedValue(dashboard)
      : vi.fn().mockResolvedValue(dashboard);
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AdminDashboardApi, useValue: { getDashboard } }],
  });
  const fixture = TestBed.createComponent(AdminDashboardPage);
  await fixture.whenStable();
  return { el: fixture.nativeElement as HTMLElement, getDashboard };
}

const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('AdminDashboardPage', () => {
  it('shows the cards, with new orders linking to the filtered order list', async () => {
    const { el } = await render(DASHBOARD);
    const cards = [...el.querySelectorAll('section[aria-label] li')].map(text);

    expect(cards[0]).toContain('3');
    expect(cards[1]).toContain('42');
    expect(cards[2]).toMatch(/1[\s.,]?234[,.]50 ₾/);
    expect(cards[3]).toContain('2');
    expect(el.querySelector('a[href="/orders?status=new"]')).not.toBeNull();
  });

  it('lists best sellers, linking only products that still exist', async () => {
    const { el } = await render(DASHBOARD);
    const rows = [...el.querySelectorAll('#best-sellers ~ div tbody tr')];

    expect(text(rows[0])).toContain('ყვავილოვანი ბიკინი');
    expect(text(rows[0])).toContain('12 ც.');
    expect(rows[0].querySelector('a')!.getAttribute('href')).toBe('/products/p1');
    expect(rows[1].querySelector('a')).toBeNull();
    expect(text(rows[1])).toContain('(წაშლილი)');
  });

  it('lists low-stock variants linking to the product edit page', async () => {
    const { el } = await render(DASHBOARD);
    const links = [...el.querySelectorAll<HTMLAnchorElement>('#low-stock ~ ul a')];

    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/products/p1', '/products/p2']);
    expect(text(links[0])).toContain('ამოიწურა');
    expect(text(links[1])).toContain('2 ც.');
    expect(text(links[1])).toContain('დამალული');
  });

  it('shows friendly empty states', async () => {
    const { el } = await render({ ...DASHBOARD, bestSellers: [], lowStock: [] });

    expect(text(el)).toContain('ამ თვეში გაყიდვები ჯერ არ არის');
    expect(text(el)).toContain('ყველა ვარიანტის მარაგი საკმარისია');
  });

  it('offers a retry when loading fails', async () => {
    const { el } = await render(new Error('boom'));

    expect(text(el.querySelector('[role="alert"]'))).toContain('თავიდან ცდა');
  });
});
