import { SLUG_PATTERN, slugify } from './admin-product.model';

describe('slugify', () => {
  it.each([
    ['Floral bikini', 'floral-bikini'],
    ['  Lace Brazilian!! ', 'lace-brazilian'],
    ['Crème brûlée 2.0', 'creme-brulee-2-0'],
    ['ყვავილოვანი Bikini', 'bikini'],
    ['ყვავილოვანი', ''],
  ])('%s -> %s', (text, slug) => {
    expect(slugify(text)).toBe(slug);
  });

  it('always matches the database slug check when not empty', () => {
    expect(slugify('--A  b__c--')).toMatch(SLUG_PATTERN);
  });
});
