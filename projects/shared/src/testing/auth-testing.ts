import { Session } from '@supabase/supabase-js';

/** A signed-in session for user `id` (email `<id>@example.com`). */
export const fakeSession = (id: string) =>
  ({ user: { id, email: `${id}@example.com` } }) as Session;

/**
 * Just enough of SupabaseClient for AuthService: auth + `admins` lookups. Signing in with
 * wrong@example.com fails; any other email signs in as the user before the @.
 */
export function fakeAdminSupabase(options: { stored?: Session | null; admins?: string[] } = {}) {
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
        const s = fakeSession(email.split('@')[0]);
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
