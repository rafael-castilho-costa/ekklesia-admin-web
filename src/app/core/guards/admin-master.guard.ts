import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../auth/auth-session.service';

export const adminMasterGuard: CanActivateFn = () => {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);

  if (!authSessionService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (authSessionService.isAdminMaster()) {
    return true;
  }

  const churchId = authSessionService.getChurchIdHeaderValue();
  return router.createUrlTree(churchId ? ['/', churchId, 'home'] : ['/login']);
};
