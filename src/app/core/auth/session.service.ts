import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SessionUser } from '../../shared/models/api.models';

const SESSION_KEY = 'ekklesia_session';
const TOKEN_KEY = 'ekklesia_token';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionSignal = signal<SessionUser | null>(this.loadSessionFromStorage());
  public readonly session$ = this.sessionSignal.asReadonly();

  constructor() {
    // Sincroniza alterações no signal com localStorage
    effect(() => {
      const session = this.sessionSignal();
      if (session) {
        this.saveSessionToStorage(session);
      } else {
        this.clearSessionFromStorage();
      }
    });
  }

  /**
   * Define a sessão do usuário após login bem-sucedido
   */
  setSession(user: SessionUser): void {
    this.sessionSignal.set(user);
  }

  /**
   * Obtém a sessão atual
   */
  getSession(): SessionUser | null {
    return this.sessionSignal();
  }

  /**
   * Obtém o token JWT
   */
  getToken(): string | null {
    return this.getSession()?.token || null;
  }

  /**
   * Limpa a sessão (logout)
   */
  clearSession(): void {
    this.sessionSignal.set(null);
  }

  /**
   * Verifica se há uma sessão ativa
   */
  isAuthenticated(): boolean {
    return this.sessionSignal() !== null;
  }

  /**
   * Restaura a sessão do localStorage ao inicializar a aplicação
   */
  private loadSessionFromStorage(): SessionUser | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null; // Não temos localStorage no servidor
    }

    try {
      const sessionJson = localStorage.getItem(SESSION_KEY);
      const token = localStorage.getItem(TOKEN_KEY);

      if (sessionJson && token) {
        const session = JSON.parse(sessionJson) as SessionUser;
        return { ...session, token };
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
    }
    return null;
  }

  /**
   * Salva a sessão no localStorage
   */
  private saveSessionToStorage(session: SessionUser): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Não temos localStorage no servidor
    }

    const { token, ...userWithoutToken } = session;
    localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutToken));
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Limpa a sessão do localStorage
   */
  private clearSessionFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Não temos localStorage no servidor
    }

    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}
