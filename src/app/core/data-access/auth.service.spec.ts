import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { adminGuard } from '../../admin/admin.guards';
import { ADMIN_SUPABASE } from './admin-supabase.client';
import { AuthService, SignInError } from './auth.service';

const session = (id: string) => ({ user: { id, email: `${id}@example.com` } }) as Session;

/** Just enough of SupabaseClient for AuthService: auth + `admins` lookups. */
function fakeSupabase(options: { stored?: Session | null; admins?: string[] } = {}) {
  let listener: (event: string, session: Session | null) => void;
  const admins = new Set(options.admins ?? []);
  const lookups: string[] = [];
  const client = {
    auth: {
      onAuthStateChange: (cb: typeof listener) => {
        listener = cb;
        queueMicrotask(() => cb('INITIAL_SESSION', options.stored ?? null));
      },
      signInWithPassword: async ({ email }: { email: string }) => {
        if (email === 'wrong@example.com') {
          return { data: { session: null }, error: { name: 'AuthApiError', status: 400 } };
        }
        const s = session(email.split('@')[0]);
        listener('SIGNED_IN', s);
        return { data: { session: s }, error: null };
      },
      signOut: async () => {
        listener('SIGNED_OUT', null);
        return { error: null };
      },
    },
    from: () => ({
      select: () => ({
        eq: (_column: string, userId: string) => ({
          maybeSingle: async () => {
            lookups.push(userId);
            return { data: admins.has(userId) ? { user_id: userId } : null, error: null };
          },
        }),
      }),
    }),
  };
  return { client, lookups };
}

function setup(options: Parameters<typeof fakeSupabase>[0] = {}) {
  const fake = fakeSupabase(options);
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ADMIN_SUPABASE, useValue: fake.client }],
  });
  return { auth: TestBed.inject(AuthService), lookups: fake.lookups };
}

describe('AuthService', () => {
  it('restores a stored admin session and caches the admin lookup', async () => {
    const { auth, lookups } = setup({ stored: session('ana'), admins: ['ana'] });

    expect(await auth.checkIsAdmin()).toBe(true);
    expect(await auth.checkIsAdmin()).toBe(true);
    expect(auth.user()?.id).toBe('ana');
    expect(auth.isAdmin()).toBe(true);
    expect(lookups).toEqual(['ana']);
  });

  it('is not an admin without a session', async () => {
    const { auth, lookups } = setup();

    expect(await auth.checkIsAdmin()).toBe(false);
    expect(auth.isAdmin()).toBe(false);
    expect(lookups).toEqual([]);
  });

  it('signs in an admin', async () => {
    const { auth } = setup({ admins: ['ana'] });

    await auth.signIn('ana@example.com', 'secret');

    expect(auth.user()?.id).toBe('ana');
    expect(auth.isAdmin()).toBe(true);
  });

  it('rejects wrong credentials', async () => {
    const { auth } = setup();

    await expect(auth.signIn('wrong@example.com', 'x')).rejects.toEqual(
      new SignInError('INVALID_CREDENTIALS'),
    );
  });

  it('signs a non-admin straight back out', async () => {
    const { auth } = setup({ admins: ['ana'] });

    await expect(auth.signIn('gio@example.com', 'secret')).rejects.toMatchObject({
      failure: 'NOT_ADMIN',
    });
    expect(auth.user()).toBeNull();
    expect(auth.isAdmin()).toBe(false);
  });

  it('forgets admin status on sign-out', async () => {
    const { auth } = setup({ stored: session('ana'), admins: ['ana'] });
    await auth.checkIsAdmin();

    await auth.signOut();

    expect(auth.user()).toBeNull();
    expect(auth.isAdmin()).toBe(false);
  });
});

describe('adminGuard', () => {
  const run = (url: string) =>
    TestBed.runInInjectionContext(() => adminGuard({} as never, { url } as never));

  it('lets admins in', async () => {
    setup({ stored: session('ana'), admins: ['ana'] });

    expect(await run('/admin/orders')).toBe(true);
  });

  it('sends everyone else to the login page with a return URL', async () => {
    setup({ stored: session('gio'), admins: ['ana'] });

    const result = (await run('/admin/orders')) as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toBe(
      '/admin/login?returnUrl=%2Fadmin%2Forders',
    );
  });
});
