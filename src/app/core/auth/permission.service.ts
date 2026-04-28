import { Injectable, inject } from '@angular/core';
import { AuthSessionService } from './auth-session.service';
import { RoleEnum } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly authSessionService = inject(AuthSessionService);

  /**
   * Verifica se o usuário é administrador
   */
  isAdmin(): boolean {
    return this.hasRole(RoleEnum.ROLE_ADMIN);
  }

  /**
   * Verifica se o usuário é secretário
   */
  isSecretary(): boolean {
    return this.hasRole(RoleEnum.ROLE_SECRETARY);
  }

  isAdminMaster(): boolean {
    return this.authSessionService.isAdminMaster();
  }

  /**
   * Verifica se o usuário tem um role específico
   */
  hasRole(role: string): boolean {
    const session = this.authSessionService.getSession();
    return session?.user?.roles.includes(role) ?? false;
  }

  /**
   * Verifica se o usuário pode visualizar igrejas
   */
  canViewChurches(): boolean {
    return this.isAdmin() || this.isSecretary();
  }

  /**
   * Verifica se o usuário pode gerenciar igrejas (criar, editar, deletar)
   */
  canManageChurches(): boolean {
    return this.isAdmin();
  }

  /**
   * Verifica se o usuário pode gerenciar pessoas
   */
  canManagePersonas(): boolean {
    return this.isAdmin() || this.isSecretary();
  }

  /**
   * Verifica se o usuário pode gerenciar membros
   */
  canManageMembers(): boolean {
    return this.isAdmin() || this.isSecretary();
  }

  /**
   * Verifica se o usuário pode deletar um recurso
   */
  canDelete(): boolean {
    return this.isAdmin();
  }

  canAccessAdministration(): boolean {
    return this.isAdminMaster();
  }
}
