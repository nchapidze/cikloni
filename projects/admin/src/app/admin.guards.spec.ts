import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { ADMIN_SUPABASE } from '@cikloni/shared/admin';
import { fakeAdminSupabase, fakeSession } from '@cikloni/shared/testing';
import { adminGuard, adminLoginGuard } from './admin.guards';

function setup(options: Parameters<typeof fakeAdminSupabase>[0]) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: ADMIN_SUPABASE, useValue: fakeAdminSupabase(options).client },
    ],
  });
}

const run = (guard: typeof adminGuard, url: string) =>
  TestBed.runInInjectionContext(() => guard({} as never, { url } as never));

const serialize = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

describe('adminGuard', () => {
  it('lets admins in', async () => {
    setup({ stored: fakeSession('ana'), admins: ['ana'] });

    expect(await run(adminGuard, '/orders')).toBe(true);
  });

  it('sends everyone else to the login page with a return URL', async () => {
    setup({ stored: fakeSession('gio'), admins: ['ana'] });

    expect(serialize(await run(adminGuard, '/orders'))).toBe('/login?returnUrl=%2Forders');
  });
});

describe('adminLoginGuard', () => {
  it('shows the login page to visitors', async () => {
    setup({});

    expect(await run(adminLoginGuard, '/login')).toBe(true);
  });

  it('sends a signed-in admin to the dashboard', async () => {
    setup({ stored: fakeSession('ana'), admins: ['ana'] });

    expect(serialize(await run(adminLoginGuard, '/login'))).toBe('/');
  });
});
