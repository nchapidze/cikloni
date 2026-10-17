import { safeReturnUrl } from './login';

describe('safeReturnUrl', () => {
  it('keeps paths inside the admin app', () => {
    expect(safeReturnUrl('/orders?status=new')).toBe('/orders?status=new');
  });

  it.each([undefined, '', 'https://evil.example', '//evil.example', '/\\evil.example', '/login'])(
    'falls back to the dashboard for %o',
    (url) => {
      expect(safeReturnUrl(url)).toBe('/');
    },
  );
});
