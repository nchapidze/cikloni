import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  let cart: CartService;
  const bikiniM = { slug: 'floral-bikini', colorId: 'coral', size: 'M' } as const;
  const bikiniL = { slug: 'floral-bikini', colorId: 'coral', size: 'L' } as const;

  beforeEach(() => {
    cart = TestBed.inject(CartService);
  });

  it('starts empty', () => {
    expect(cart.items()).toEqual([]);
    expect(cart.totalCount()).toBe(0);
  });

  it('merges the same product, color and size into one line', () => {
    cart.addItem(bikiniM, 2);
    cart.addItem(bikiniM, 3);

    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0].quantity).toBe(5);
    expect(cart.totalCount()).toBe(5);
  });

  it('keeps different sizes on separate lines', () => {
    cart.addItem(bikiniM);
    cart.addItem(bikiniL, 2);

    expect(cart.items()).toHaveLength(2);
    expect(cart.totalCount()).toBe(3);
  });

  it('ignores invalid quantities when adding', () => {
    cart.addItem(bikiniM, 0);
    cart.addItem(bikiniM, -1);
    cart.addItem(bikiniM, 1.5);

    expect(cart.totalCount()).toBe(0);
  });

  it('updates and removes lines', () => {
    cart.addItem(bikiniM);
    cart.addItem(bikiniL);
    const [m, l] = cart.items();

    cart.updateQuantity(m.id, 4);
    expect(cart.totalCount()).toBe(5);

    cart.removeItem(l.id);
    expect(cart.items().map((i) => i.id)).toEqual([m.id]);

    cart.updateQuantity(m.id, 0);
    expect(cart.items()).toEqual([]);
  });
});
