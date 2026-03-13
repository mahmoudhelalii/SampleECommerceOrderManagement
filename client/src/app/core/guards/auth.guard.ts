import { inject } from '@angular/core';
import { Router, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  const returnUrl = state.url || '/';
  router.navigate(['/login'], { queryParams: { returnUrl } });
  return false;
};
