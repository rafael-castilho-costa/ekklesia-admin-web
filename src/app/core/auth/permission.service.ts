import { Injectable, inject } from '@angular/core';
import { AuthSessionService } from './auth-session.service';
import { RoleEnum } from '../../shared/models/api.models';

export type PermissionContext =
  | 'dashboard'
  | 'members'
  | 'personas'
  | 'churches'
  | 'finance'
  | 'sunday-school'
  | 'administration';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly authSessionService = inject(AuthSessionService);

  isAdmin(): boolean {
    return this.hasRole(RoleEnum.ROLE_ADMIN);
  }

  isSecretary(): boolean {
    return this.hasRole(RoleEnum.ROLE_SECRETARY);
  }

  isTreasurer(): boolean {
    return this.hasRole(RoleEnum.ROLE_TREASURER);
  }

  isAdminMaster(): boolean {
    return this.authSessionService.isAdminMaster();
  }

  hasRole(role: string): boolean {
    const session = this.authSessionService.getSession();
    return session?.user?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  canViewChurches(): boolean {
    return this.isAdminMaster() || this.isAdmin() || this.isSecretary();
  }

  canManageChurches(): boolean {
    return this.isAdminMaster() || this.isAdmin();
  }

  canViewPersonas(): boolean {
    return this.isAdminMaster() || this.isAdmin() || this.isSecretary();
  }

  canManagePersonas(): boolean {
    return this.canViewPersonas();
  }

  canViewMembers(): boolean {
    return this.isAdminMaster() || this.isAdmin() || this.isSecretary();
  }

  canManageMembers(): boolean {
    return this.canViewMembers();
  }

  canAccessFinance(): boolean {
    return this.isAdminMaster() || this.isAdmin() || this.isTreasurer();
  }

  canAccessSundaySchool(): boolean {
    return this.isAdminMaster() || this.isAdmin() || this.isSecretary();
  }

  canDelete(): boolean {
    return this.isAdminMaster() || this.isAdmin();
  }

  canAccessAdministration(): boolean {
    return this.isAdminMaster();
  }

  canAccessContext(context: PermissionContext): boolean {
    switch (context) {
      case 'dashboard':
        return true;
      case 'members':
        return this.canViewMembers();
      case 'personas':
        return this.canViewPersonas();
      case 'churches':
        return this.canViewChurches();
      case 'finance':
        return this.canAccessFinance();
      case 'sunday-school':
        return this.canAccessSundaySchool();
      case 'administration':
        return this.canAccessAdministration();
      default:
        return false;
    }
  }

  getDefaultTenantPath(): string {
    const orderedContexts: PermissionContext[] = ['dashboard', 'members', 'finance', 'sunday-school', 'personas', 'churches'];
    const firstAllowedContext = orderedContexts.find((context) => this.canAccessContext(context));

    return firstAllowedContext === 'dashboard' || !firstAllowedContext ? 'home' : firstAllowedContext;
  }
}
