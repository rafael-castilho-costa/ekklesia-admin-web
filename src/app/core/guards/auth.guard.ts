import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../auth/auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly router = inject(Router);

  canActivate(): boolean {
    if (this.authSessionService.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}

/**
 * Guard funcional para proteger rotas autenticadas
 */
export const authGuard: CanActivateFn = () => {
  const guardService = inject(AuthGuardService);
  return guardService.canActivate();
};
