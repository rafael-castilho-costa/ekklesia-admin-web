import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthSessionService } from '../auth/auth-session.service';
import { TenantContextService } from './tenant-context.service';

export const churchIdInterceptor: HttpInterceptorFn = (request, next) => {
  const tenantContext = inject(TenantContextService);
  const authSessionService = inject(AuthSessionService);

  if (request.headers.has('X-Church-Id')) {
    return next(request);
  }

  if (isAdminRequest(request.url)) {
    const adminChurchId = authSessionService.getAdminChurchId();

    if (!adminChurchId) {
      return next(request);
    }

    return next(
      request.clone({
        setHeaders: {
          'X-Church-Id': adminChurchId
        }
      })
    );
  }

  const churchId =
    tenantContext.getChurchId() ??
    authSessionService.getChurchIdHeaderValue();

  if (!churchId) {
    return next(request);
  }

  tenantContext.setChurchId(churchId);

  return next(
    request.clone({
      setHeaders: {
        'X-Church-Id': churchId
      }
    })
  );
};

function isAdminRequest(url: string): boolean {
  return /\/admin(?:\/|$)/.test(url);
}
