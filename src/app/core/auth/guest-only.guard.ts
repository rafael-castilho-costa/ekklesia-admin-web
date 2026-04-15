import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';
import { TenantContextService } from '../tenant/tenant-context.service';

export const guestOnlyGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authSession = inject(AuthSessionService);
  const tenantContext = inject(TenantContextService);

  if (!authSession.isAuthenticated()) {
    return true;
  }

  const queryChurchId = route.queryParamMap.get('churchId');
  const storedChurchId = tenantContext.getChurchId();
  const normalizedChurchId = tenantContext.resolveChurchId([
    queryChurchId,
    storedChurchId,
    TenantContextService.DEFAULT_CHURCH_ID
  ]);

  return router.createUrlTree(['/', normalizedChurchId, 'home']);
};
