import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthSessionService } from '../auth/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authSessionService = inject(AuthSessionService);
  const accessToken = authSessionService.getAccessToken();

  if (!accessToken || request.headers.has('Authorization') || request.url.endsWith('/auth/login')) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  );
};
