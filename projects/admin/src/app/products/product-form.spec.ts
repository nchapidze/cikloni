import { AdminProduct } from '@cikloni/shared';
import {
  VariantValue,
  assignColorIds,
  findVariantProblems,
  nextVariant,
  productForm,
  toProductToSave,
} from './product-form';

const row = (fields: Partial<VariantValue>): VariantValue => ({
  id: null,
  colorId: null,
  colorName: { ka: 'ვარდისფერი', en: 'Pink' },
  colorHex: '#e8546b',
  size: 'M',
  stock: 5,
  loadedStock: null,
  sku: '',
  ...fields,
});

describe('assignColorIds', () => {
  it('keeps saved color ids and names new colors after their English name', () => {
    const ids = assignColorIds([
      row({ colorId: 'coral', colorHex: '#E8546B' }),
      row({ colorHex: '#e8546b', size: 'L' }),
      row({ colorHex: '#123456', colorName: { ka: 'ლურჯი', en: 'Deep blue' } }),
      row({ colorHex: '#abcdef', colorName: { ka: 'ცისფერი' } }),
    ]);

    expect([...ids]).toEqual([
      ['#e8546b', 'coral'],
      ['#123456', 'deep-blue'],
      ['#abcdef', 'color-abcdef'],
    ]);
  });

  it('gives a recolored row a new id instead of sharing the old one', () => {
    const ids = assignColorIds([
      row({ colorId: 'coral', colorHex: '#e8546b' }),
      row({ colorId: 'coral', colorHex: '#ff0000', colorName: { ka: 'წითელი', en: 'Pink' } }),
    ]);

    expect(ids.get('#e8546b')).toBe('coral');
    expect(ids.get('#ff0000')).toBe('pink');
  });

  it('never reuses an id', () => {
    const ids = assignColorIds([
      row({ colorId: 'pink', colorHex: '#000001' }),
      row({ colorHex: '#000002', colorName: { ka: 'ვ', en: 'Pink' } }),
    ]);

    expect(ids.get('#000002')).toBe('pink-2');
  });
});

describe('findVariantProblems', () => {
  it('finds the same color and size twice, repeated SKUs and mismatched color names', () => {
    const problems = findVariantProblems([
      row({ size: 'M', sku: 'a-1' }),
      row({ size: 'M', colorHex: '#E8546B' }),
      row({ size: 'L', sku: 'A-1' }),
      row({ size: 'XL', colorName: { ka: 'წითელი' } }),
    ]);

    expect(problems).toEqual({
      duplicateVariants: [0, 1],
      duplicateSkus: [0, 2],
      colorNameMismatch: [3],
    });
  });
});

describe('nextVariant', () => {
  it('continues the last color with its first missing size', () => {
    expect(nextVariant([row({ size: 'XS' }), row({ size: 'S' })])).toMatchObject({
      colorHex: '#e8546b',
      size: 'M',
    });
    expect(nextVariant([])).toEqual({});
  });
});

describe('productForm', () => {
  it('validates slug, price and variant rows', () => {
    const form = productForm();
    form.patchValue({ slug: 'Not a slug', priceGel: 10.555 });

    expect(form.controls.slug.hasError('pattern')).toBe(true);
    expect(form.controls.priceGel.hasError('decimals')).toBe(true);

    form.controls.priceGel.setValue(39.9);
    expect(form.controls.priceGel.valid).toBe(true);
  });
});

describe('toProductToSave', () => {
  it('trims text, generates missing SKUs and keeps the loaded stock', () => {
    const product = {
      id: 'p1',
      slug: 'floral-bikini',
      name: { ka: ' ბიკინი ', en: ' ' },
      description: { ka: 'აღწერა' },
      care: { ka: 'მოვლა' },
      priceGel: 39.9,
      absorbency: 'medium',
      style: 'bikini',
      sortOrder: 1,
      isActive: true,
      variants: [
        {
          id: 'v1',
          colorId: 'coral',
          colorName: { ka: 'ვარდისფერი', en: 'Pink' },
          colorHex: '#E8546B',
          size: 'M',
          stock: 7,
          loadedStock: 5,
          sku: '',
        },
      ],
      images: [],
    } satisfies AdminProduct;
    const value = productForm(product).getRawValue();

    const saved = toProductToSave('p1', value, assignColorIds(value.variants));

    expect(saved.name).toEqual({ ka: 'ბიკინი' });
    expect(saved.variants[0]).toMatchObject({
      colorHex: '#e8546b',
      sku: 'FLORAL-BIKINI-CORAL-M',
      stock: 7,
      loadedStock: 5,
    });
  });
});
