import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Redirects root path: guest or customer → products, admin → dashboard */
export const homeRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() && auth.isAdmin()
    ? router.createUrlTree(['dashboard'])
    : router.createUrlTree(['products']);
};
