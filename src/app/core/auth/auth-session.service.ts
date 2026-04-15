import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { AuthMeResponse } from '../../shared/models/api.models';

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  user?: AuthMeResponse;
}

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  private static readonly STORAGE_KEY = 'ekklesia.auth.session';

  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(null);
  readonly session$ = this.sessionSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    const storedSession = this.readSessionFromStorage();
    if (storedSession) {
      this.sessionSubject.next(storedSession);
    }
  }

  getSession(): AuthSession | null {
    return this.sessionSubject.value;
  }

  getAccessToken(): string | null {
    const token = this.sessionSubject.value?.accessToken ?? null;
    if (token) {
      console.log(`[AuthSessionService] ✅ Token recuperado: ${token.substring(0, 20)}...`);
    } else {
      console.log(`[AuthSessionService] ❌ Nenhum token em memória`);
    }
    return token;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  setSession(session: AuthSession): void {
    console.log(`[AuthSessionService] 💾 Salvando sessão com token: ${session.accessToken.substring(0, 20)}...`);
    this.sessionSubject.next(session);
    this.persistSession(session);
    console.log(`[AuthSessionService] ✅ Sessão salva em memória e localStorage`);
  }

  clearSession(): void {
    this.sessionSubject.next(null);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.removeItem(AuthSessionService.STORAGE_KEY);
    } catch {
      // ignore browser storage failures
    }
  }

  private readSessionFromStorage(): AuthSession | null {
    if (!isPlatformBrowser(this.platformId)) {
      console.log(`[AuthSessionService] ⚠️ Não está no navegador - localStorage indisponível`);
      return null;
    }

    try {
      const rawSession = localStorage.getItem(AuthSessionService.STORAGE_KEY);
      if (!rawSession) {
        console.log(`[AuthSessionService] ℹ️ Nenhuma sessão encontrada no localStorage`);
        return null;
      }

      console.log(`[AuthSessionService] 📦 Sessão encontrada no localStorage`);
      const parsedSession = JSON.parse(rawSession) as Partial<AuthSession>;
      if (!parsedSession.accessToken || typeof parsedSession.accessToken !== 'string') {
        console.log(`[AuthSessionService] ⚠️ Sessão do localStorage inválida (sem token)`);
        return null;
      }

      console.log(`[AuthSessionService] ✅ Sessão carregada do localStorage com token: ${parsedSession.accessToken.substring(0, 20)}...`);
      return {
        accessToken: parsedSession.accessToken,
        refreshToken: parsedSession.refreshToken,
        expiresAt: parsedSession.expiresAt,
        user: parsedSession.user
      };
    } catch (error) {
      console.error(`[AuthSessionService] ❌ Erro ao ler localStorage:`, error);
      return null;
    }
  }

  private persistSession(session: AuthSession): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log(`[AuthSessionService] ⚠️ Não está no navegador - localStorage indisponível`);
      return;
    }

    try {
      const sessionJson = JSON.stringify(session);
      localStorage.setItem(AuthSessionService.STORAGE_KEY, sessionJson);
      console.log(`[AuthSessionService] 💾 Sessão persistida em localStorage com chave: ${AuthSessionService.STORAGE_KEY}`);
    } catch (error) {
      console.error(`[AuthSessionService] ❌ Erro ao salvar em localStorage:`, error);
      // ignore browser storage failures
    }
  }
}
