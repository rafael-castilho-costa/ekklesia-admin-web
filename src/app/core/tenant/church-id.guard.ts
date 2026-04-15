import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantContextService } from './tenant-context.service';

export const churchIdGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const tenantContext = inject(TenantContextService);

  const routeChurchId = route.paramMap.get('churchId');
  const normalizedChurchId = tenantContext.normalizeChurchId(routeChurchId);

  if (!normalizedChurchId) {
    return router.createUrlTree(['/login']);
  }

  tenantContext.setChurchId(normalizedChurchId);

  if (routeChurchId === normalizedChurchId) {
    return true;
  }

  const parsedUrl = router.parseUrl(state.url);
  const urlSegments = parsedUrl.root.children['primary']?.segments.map((segment) => segment.path) ?? [];
  urlSegments[0] = normalizedChurchId;

  return router.createUrlTree(['/', ...urlSegments], { queryParams: parsedUrl.queryParams });
};
