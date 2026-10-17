import { mapRows, SEED_ROWS } from '../../testing/catalog-testing';
import { Product, productImage, productThumbnail } from './product.model';

const [bikini] = mapRows(SEED_ROWS);
const withImages = (images: Product['images']): Product => ({ ...bikini, images });

describe('productImage / productThumbnail', () => {
  const lilac = { url: 'lilac.jpg', colorId: 'lilac' };
  const shared = { url: 'all.jpg', colorId: null };

  it('prefers the photo of the color, then a photo shared by all colors', () => {
    expect(productImage(withImages([shared, lilac]), 'lilac')).toBe(lilac);
    expect(productImage(withImages([lilac, shared]), 'coral')).toBe(shared);
  });

  it('only the thumbnail falls back to a photo of another color', () => {
    const product = withImages([lilac]);

    expect(productImage(product, 'coral')).toBeUndefined();
    expect(productThumbnail(product, 'coral')).toBe(lilac);
    expect(productThumbnail(withImages([]), 'coral')).toBeUndefined();
  });
});
