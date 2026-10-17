import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/data-access/auth.service';

export const ADMIN_LOGIN_PATH = '/admin/login';

/** Lets only admins in; everyone else goes to the login page, which returns them here after. */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAdmin = await auth.checkIsAdmin().catch(() => false);
  return (
    isAdmin || router.createUrlTree([ADMIN_LOGIN_PATH], { queryParams: { returnUrl: state.url } })
  );
};

/** Sends an already signed-in admin past the login page. */
export const adminLoginGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAdmin = await auth.checkIsAdmin().catch(() => false);
  return !isAdmin || router.createUrlTree(['/admin']);
};
