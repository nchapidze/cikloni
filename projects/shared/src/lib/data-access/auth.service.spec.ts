import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { fakeAdminSupabase, fakeSession as session } from '../../testing/auth-testing';
import { ADMIN_SUPABASE } from '../supabase/admin-supabase.client';
import { AuthService, SignInError } from './auth.service';

function setup(options: Parameters<typeof fakeAdminSupabase>[0] = {}) {
  const fake = fakeAdminSupabase(options);
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
