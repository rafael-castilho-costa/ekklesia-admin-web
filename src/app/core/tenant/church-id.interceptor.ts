import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantContextService } from './tenant-context.service';

export const churchIdInterceptor: HttpInterceptorFn = (request, next) => {
  const tenantContext = inject(TenantContextService);
  const churchId = tenantContext.getChurchId();

  if (!churchId || request.headers.has('X-Church-Id')) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        'X-Church-Id': churchId
      }
    })
  );
};
