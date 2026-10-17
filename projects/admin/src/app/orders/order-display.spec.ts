import { OrderDetails } from '@cikloni/shared';
import { courierAddress, formatGel } from './order-display';

describe('courierAddress', () => {
  it('puts name, phone and address on separate lines', () => {
    const order = {
      customerName: 'ნინო ბერიძე',
      phone: '+995555123456',
      city: 'თბილისი',
      address: 'ჭავჭავაძის 10, ბინა 5',
      notes: 'დარეკეთ მოსვლამდე',
    } as OrderDetails;

    expect(courierAddress(order)).toBe(
      'ნინო ბერიძე\n+995555123456\nთბილისი, ჭავჭავაძის 10, ბინა 5',
    );
  });
});

describe('formatGel', () => {
  it('always shows two decimals', () => {
    expect(formatGel(45)).toMatch(/^45[,.]00 ₾$/);
    expect(formatGel(39.9)).toMatch(/^39[,.]90 ₾$/);
  });
});
