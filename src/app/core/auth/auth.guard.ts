import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authSession = inject(AuthSessionService);

  if (authSession.isAuthenticated()) {
    return true;
  }

  const routeChurchId = route.paramMap.get('churchId');

  return router.createUrlTree(['/login'], {
    queryParams: {
      ...(routeChurchId ? { churchId: routeChurchId } : {}),
      redirectTo: state.url
    }
  });
};
