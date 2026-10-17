import { TestBed } from '@angular/core/testing';
import { OrderStatus } from '@cikloni/shared';
import { AdminOrdersApi, StatusChangeError } from '@cikloni/shared/admin';
import { OrderStatusForm } from './order-status-form';

async function render(status: OrderStatus, setStatus = vi.fn().mockResolvedValue(undefined)) {
  TestBed.configureTestingModule({
    providers: [{ provide: AdminOrdersApi, useValue: { setStatus } }],
  });
  const fixture = TestBed.createComponent(OrderStatusForm);
  fixture.componentRef.setInput('orderId', 'o1');
  fixture.componentRef.setInput('status', status);
  const changed = vi.fn();
  fixture.componentInstance.changed.subscribe(changed);
  await fixture.whenStable();

  const el: HTMLElement = fixture.nativeElement;
  const select = el.querySelector('select')!;
  const choose = async (value: OrderStatus) => {
    select.value = value;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };
  const button = () => el.querySelector('button');
  return { fixture, el, select, choose, button, setStatus, changed };
}

const enabledOptions = (select: HTMLSelectElement) =>
  [...select.options].filter((o) => !o.disabled).map((o) => o.value);

describe('OrderStatusForm', () => {
  it('offers only forward moves and cancelling', async () => {
    const { select } = await render('confirmed');

    expect(enabledOptions(select)).toEqual(['confirmed', 'shipped', 'delivered', 'cancelled']);
  });

  it('warns before cancelling, then cancels', async () => {
    const { el, choose, button, setStatus, changed } = await render('new');

    await choose('cancelled');
    expect(el.textContent).toContain('ნივთები მარაგში დაბრუნდება');
    expect(button()!.textContent).toContain('შეკვეთის გაუქმება');

    button()!.click();
    await vi.waitFor(() => expect(changed).toHaveBeenCalled());
    expect(setStatus).toHaveBeenCalledWith('o1', 'new', 'cancelled');
  });

  it('cannot save until the status is changed', async () => {
    const { button } = await render('new');

    expect(button()!.disabled).toBe(true);
  });

  it('locks a delivered or cancelled order', async () => {
    for (const status of ['delivered', 'cancelled'] as const) {
      TestBed.resetTestingModule();
      const { select, button } = await render(status);
      expect(select.disabled).toBe(true);
      expect(button()).toBeNull();
    }
  });

  it('reloads the order when someone else changed it first', async () => {
    const setStatus = vi.fn().mockRejectedValue(new StatusChangeError('STATUS_CHANGED'));
    const { el, fixture, choose, button, changed } = await render('new', setStatus);

    await choose('confirmed');
    button()!.click();
    await vi.waitFor(() => expect(changed).toHaveBeenCalled());
    await fixture.whenStable();

    expect(el.textContent).toContain('სტატუსი ამასობაში სხვამ შეცვალა');
  });
});
