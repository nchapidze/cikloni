import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthError, Session } from '@supabase/supabase-js';
import { ADMIN_SUPABASE } from '../supabase/admin-supabase.client';

/** Why signing in failed. NOT_ADMIN: the password was right but the user is not in `admins`. */
export type SignInFailure = 'INVALID_CREDENTIALS' | 'NOT_ADMIN' | 'NETWORK';

export class SignInError extends Error {
  constructor(readonly failure: SignInFailure) {
    super(failure);
  }
}

/** Admin sign-in with Supabase Auth (email + password); admin status comes from `admins`. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(ADMIN_SUPABASE);
  private readonly session = signal<Session | null>(null);
  /** The last admin lookup; only trusted while it is for the current user. */
  private readonly adminCheck = signal<{ userId: string; isAdmin: boolean } | null>(null);

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAdmin = computed(() => {
    const user = this.user();
    const check = this.adminCheck();
    return !!user && check?.userId === user.id && check.isAdmin;
  });

  /** Resolves once the stored session (if any) has been restored (INITIAL_SESSION). */
  private readonly ready = new Promise<void>((resolve) => {
    // Supabase warns against awaiting its own calls inside this callback, so it only stores state.
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      resolve();
    });
  });

  /** Whether the signed-in user is an admin. Cached per user; throws on a failed lookup. */
  async checkIsAdmin(): Promise<boolean> {
    await this.ready;
    const user = this.user();
    if (!user) return false;

    const check = this.adminCheck();
    if (check?.userId === user.id) return check.isAdmin;

    // RLS lets a signed-in user read only their own row, so this is "am I an admin?".
    const { data, error } = await this.supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;

    const isAdmin = !!data;
    this.adminCheck.set({ userId: user.id, isAdmin });
    return isAdmin;
  }

  /** Signs in an admin. A valid non-admin account is signed straight back out. */
  async signIn(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw new SignInError(isNetworkError(error) ? 'NETWORK' : 'INVALID_CREDENTIALS');
    this.session.set(data.session);

    let isAdmin: boolean;
    try {
      isAdmin = await this.checkIsAdmin();
    } catch {
      await this.signOut();
      throw new SignInError('NETWORK');
    }
    if (!isAdmin) {
      await this.signOut();
      throw new SignInError('NOT_ADMIN');
    }
  }

  async signOut(): Promise<void> {
    // 'local' clears this browser's session even if the network call fails.
    await this.supabase.auth.signOut({ scope: 'local' });
    this.session.set(null);
    this.adminCheck.set(null);
  }
}

/** Supabase reports a fetch failure as a status-less AuthRetryableFetchError. */
function isNetworkError(error: AuthError): boolean {
  return error.name === 'AuthRetryableFetchError' || !error.status;
}
