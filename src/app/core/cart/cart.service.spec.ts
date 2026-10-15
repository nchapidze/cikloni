import { TestBed } from '@angular/core/testing';
import { CART_STORAGE_KEY, CartService, MAX_LINE_QUANTITY } from './cart.service';

describe('CartService', () => {
  let cart: CartService;
  const bikiniM = { slug: 'floral-bikini', colorId: 'coral', size: 'M' } as const;
  const bikiniL = { slug: 'floral-bikini', colorId: 'coral', size: 'L' } as const;

  beforeEach(() => {
    localStorage.clear();
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

  it('caps each line at the maximum quantity', () => {
    cart.addItem(bikiniM, 8);
    cart.addItem(bikiniM, 5);
    expect(cart.items()[0].quantity).toBe(MAX_LINE_QUANTITY);

    cart.updateQuantity(cart.items()[0].id, 50);
    expect(cart.items()[0].quantity).toBe(MAX_LINE_QUANTITY);
  });

  it('persists to localStorage and restores in a new session', () => {
    cart.addItem(bikiniM, 2);
    cart.addItem(bikiniL);

    TestBed.resetTestingModule();
    const restored = TestBed.inject(CartService);

    expect(restored.items()).toEqual(cart.items());
    expect(restored.totalCount()).toBe(3);
  });

  it('drops stored lines that are malformed or no longer sold', () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        { slug: 'floral-bikini', colorId: 'coral', size: 'M', quantity: 2 },
        { slug: 'floral-bikini', colorId: 'coral', size: 'M', quantity: 1 },
        { slug: 'discontinued', colorId: 'coral', size: 'M', quantity: 1 },
        { slug: 'floral-bikini', colorId: 'teal', size: 'M', quantity: 1 },
        { slug: 'floral-bikini', colorId: 'coral', size: 'XXXL', quantity: 1 },
        { slug: 'floral-bikini', colorId: 'coral', size: 'S', quantity: 0 },
        null,
      ]),
    );
    TestBed.resetTestingModule();

    expect(TestBed.inject(CartService).items()).toEqual([
      { id: 'floral-bikini:coral:M', ...bikiniM, quantity: 3 },
    ]);
  });

  it('ignores unreadable storage', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{not json');
    TestBed.resetTestingModule();

    expect(TestBed.inject(CartService).items()).toEqual([]);
  });

  it('picks up changes made in another tab', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ ...bikiniL, quantity: 4 }]));
    window.dispatchEvent(new StorageEvent('storage', { key: CART_STORAGE_KEY }));

    expect(cart.totalCount()).toBe(4);
  });
});
