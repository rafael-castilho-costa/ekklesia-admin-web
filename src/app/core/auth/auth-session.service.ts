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
    return this.sessionSubject.value?.accessToken ?? null;
  }

  getChurchId(): number | null {
    const sessionChurchId = this.sessionSubject.value?.user?.churchId;
    if (typeof sessionChurchId === 'number' && Number.isFinite(sessionChurchId)) {
      return sessionChurchId;
    }

    const token = this.sessionSubject.value?.accessToken;
    if (!token) {
      return null;
    }

    const payload = this.decodeJwtPayload(token);
    const claim = payload?.['churchId'] ?? payload?.['church_id'];

    if (typeof claim === 'number' && Number.isFinite(claim)) {
      return claim;
    }

    if (typeof claim === 'string' && claim.trim().length > 0) {
      const parsed = Number.parseInt(claim, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  getChurchIdHeaderValue(): string | null {
    const churchId = this.getChurchId();
    return churchId === null ? null : String(churchId);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  setSession(session: AuthSession): void {
    this.sessionSubject.next(session);
    this.persistSession(session);
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
      return null;
    }

    try {
      const rawSession = localStorage.getItem(AuthSessionService.STORAGE_KEY);
      if (!rawSession) {
        return null;
      }

      const parsedSession = JSON.parse(rawSession) as Partial<AuthSession>;
      if (!parsedSession.accessToken || typeof parsedSession.accessToken !== 'string') {
        return null;
      }

      return {
        accessToken: parsedSession.accessToken,
        refreshToken: parsedSession.refreshToken,
        expiresAt: parsedSession.expiresAt,
        user: parsedSession.user
      };
    } catch {
      return null;
    }
  }

  private persistSession(session: AuthSession): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(AuthSessionService.STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore browser storage failures
    }
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const normalizedPayload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

      const decodedPayload = atob(normalizedPayload);
      const utf8Payload = decodeURIComponent(
        Array.from(decodedPayload)
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join('')
      );

      return JSON.parse(utf8Payload) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
