import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../auth/auth-session.service';
import { PermissionContext, PermissionService } from '../auth/permission.service';

export const moduleAccessGuard: CanActivateFn = (route, state) => {
  const authSessionService = inject(AuthSessionService);
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  if (!authSessionService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const context = route.data['permission'] as PermissionContext | undefined;
  if (!context || permissionService.canAccessContext(context)) {
    return true;
  }

  const churchId = authSessionService.getChurchIdHeaderValue();
  const fallbackPath = permissionService.getDefaultTenantPath();

  return router.createUrlTree(churchId ? ['/', churchId, fallbackPath] : ['/login'], {
    queryParams: {
      deniedFrom: state.url
    }
  });
};
