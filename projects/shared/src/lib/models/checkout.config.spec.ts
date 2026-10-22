import { normalizeGeorgianPhone, parseCreateOrderRequest } from './checkout.config';

describe('normalizeGeorgianPhone', () => {
  it.each([
    '555123456',
    '555 12 34 56',
    '555-123-456',
    '(555) 12-34-56',
    '+995 555 12 34 56',
    '995555123456',
  ])('accepts %s', (value) => {
    expect(normalizeGeorgianPhone(value)).toBe('+995555123456');
  });

  it.each(['', '32 2 12 34 56', '55512345', '5551234567', '+1 555 123 456', 'abc'])(
    'rejects %s',
    (value) => {
      expect(normalizeGeorgianPhone(value)).toBeNull();
    },
  );
});

describe('parseCreateOrderRequest', () => {
  const id = (n: number) => `0000000${n}-0000-4000-8000-000000000000`;
  const valid = {
    items: [{ variantId: id(1), quantity: 2 }],
    customer: { name: ' ნინო ', phone: '555 12 34 56', address: 'ვაჟა-ფშაველას 1' },
    deliveryMethod: 'tbilisi',
    paymentMethod: 'cash',
  };

  it('cleans a valid request and sets the fixed city for Tbilisi', () => {
    const result = parseCreateOrderRequest({
      ...valid,
      customer: { ...valid.customer, city: 'ბათუმი', email: '', notes: '  ' },
    });
    expect(result).toEqual({
      ok: true,
      value: {
        items: [{ variantId: id(1), quantity: 2 }],
        customer: {
          name: 'ნინო',
          phone: '+995555123456',
          city: 'თბილისი',
          address: 'ვაჟა-ფშაველას 1',
        },
        deliveryMethod: 'tbilisi',
        paymentMethod: 'cash',
        language: 'ka',
      },
    });
  });

  it('keeps a known site language and falls back to Georgian otherwise', () => {
    const language = (value: unknown) => {
      const result = parseCreateOrderRequest({ ...valid, language: value });
      return result.ok && result.value.language;
    };
    expect(language('en')).toBe('en');
    expect(language('ka')).toBe('ka');
    expect(language(undefined)).toBe('ka');
    expect(language('de')).toBe('ka');
  });

  it('requires a city for regional delivery', () => {
    const regions = { ...valid, deliveryMethod: 'regions' };
    expect(parseCreateOrderRequest(regions)).toEqual({ ok: false, fields: ['city'] });

    const result = parseCreateOrderRequest({
      ...regions,
      customer: { ...valid.customer, city: 'ქუთაისი' },
    });
    expect(result.ok && result.value.customer.city).toBe('ქუთაისი');
  });

  it('merges duplicate variants', () => {
    const result = parseCreateOrderRequest({
      ...valid,
      items: [
        { variantId: id(1), quantity: 2 },
        { variantId: id(1).toUpperCase(), quantity: 3 },
      ],
    });
    expect(result.ok && result.value.items).toEqual([{ variantId: id(1), quantity: 5 }]);
  });

  it('ignores prices or totals sent by the browser', () => {
    const result = parseCreateOrderRequest({
      ...valid,
      items: [{ variantId: id(1), quantity: 1, unitPriceGel: 0.01 }],
      totalGel: 0.01,
    });
    expect(result.ok && result.value).not.toHaveProperty('totalGel');
    expect(result.ok && result.value.items[0]).toEqual({ variantId: id(1), quantity: 1 });
  });

  it('lists every invalid field', () => {
    expect(
      parseCreateOrderRequest({
        items: [{ variantId: 'not-a-uuid', quantity: 1 }],
        customer: { name: ' ', phone: '123', email: 'nope', address: '' },
        deliveryMethod: 'moon',
        paymentMethod: 'card',
      }),
    ).toEqual({
      ok: false,
      fields: [
        'deliveryMethod',
        'paymentMethod',
        'items',
        'name',
        'phone',
        'email',
        'city',
        'address',
      ],
    });
  });

  it.each([0, 11, 1.5, '2'])('rejects quantity %s', (quantity) => {
    const result = parseCreateOrderRequest({ ...valid, items: [{ variantId: id(1), quantity }] });
    expect(result).toEqual({ ok: false, fields: ['items'] });
  });

  it('rejects an empty cart and a non-object body', () => {
    expect(parseCreateOrderRequest({ ...valid, items: [] })).toEqual({
      ok: false,
      fields: ['items'],
    });
    expect(parseCreateOrderRequest(null).ok).toBe(false);
  });
});
