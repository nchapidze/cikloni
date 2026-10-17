import { canChangeStatus } from './order.model';

describe('canChangeStatus', () => {
  it('moves forward, skipping steps if needed', () => {
    expect(canChangeStatus('new', 'confirmed')).toBe(true);
    expect(canChangeStatus('new', 'shipped')).toBe(true);
    expect(canChangeStatus('shipped', 'delivered')).toBe(true);
  });

  it('never moves backward', () => {
    expect(canChangeStatus('confirmed', 'new')).toBe(false);
    expect(canChangeStatus('shipped', 'confirmed')).toBe(false);
  });

  it('allows cancelling until delivery', () => {
    expect(canChangeStatus('new', 'cancelled')).toBe(true);
    expect(canChangeStatus('shipped', 'cancelled')).toBe(true);
    expect(canChangeStatus('delivered', 'cancelled')).toBe(false);
  });

  it('treats delivered and cancelled as final', () => {
    expect(canChangeStatus('delivered', 'shipped')).toBe(false);
    expect(canChangeStatus('cancelled', 'new')).toBe(false);
    expect(canChangeStatus('cancelled', 'cancelled')).toBe(true);
  });
});
