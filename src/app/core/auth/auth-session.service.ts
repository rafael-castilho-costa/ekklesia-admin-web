import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
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
  private static readonly ADMIN_CHURCH_CONTEXT_KEY = 'ekklesia.admin.churchId';

  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(null);
  private readonly adminChurchIdSubject = new BehaviorSubject<string | null>(null);
  readonly session$ = this.sessionSubject.asObservable();
  readonly adminChurchId$ = this.adminChurchIdSubject.asObservable();
  readonly user$ = this.session$.pipe(map((session) => session?.user ?? null));
  readonly isAdminMaster$ = this.user$.pipe(
    map((user) => !!user?.adminMaster || user?.roles.includes('ROLE_ADMIN_MASTER') === true)
  );
  readonly activeChurchId$ = combineLatest([this.session$, this.adminChurchId$]).pipe(
    map(() => this.getActiveChurchId())
  );

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    const storedSession = this.readSessionFromStorage();
    if (storedSession) {
      this.sessionSubject.next(storedSession);
    }

    const storedAdminChurchId = this.readAdminChurchIdFromStorage();
    if (storedAdminChurchId) {
      this.adminChurchIdSubject.next(storedAdminChurchId);
    }
  }

  getSession(): AuthSession | null {
    return this.sessionSubject.value;
  }

  getAccessToken(): string | null {
    return this.sessionSubject.value?.accessToken ?? null;
  }

  getAuthenticatedUser(): AuthMeResponse | null {
    return this.sessionSubject.value?.user ?? null;
  }

  isAdminMaster(): boolean {
    const user = this.getAuthenticatedUser();
    return !!user?.adminMaster || user?.roles.includes('ROLE_ADMIN_MASTER') === true;
  }

  getAdminChurchId(): string | null {
    return this.adminChurchIdSubject.value;
  }

  setAdminChurchId(churchId: string | number | null | undefined): void {
    const normalizedChurchId = this.normalizeChurchId(churchId);
    this.adminChurchIdSubject.next(normalizedChurchId);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      if (normalizedChurchId) {
        localStorage.setItem(AuthSessionService.ADMIN_CHURCH_CONTEXT_KEY, normalizedChurchId);
      } else {
        localStorage.removeItem(AuthSessionService.ADMIN_CHURCH_CONTEXT_KEY);
      }
    } catch {
      // ignore browser storage failures
    }
  }

  clearAdminChurchId(): void {
    this.setAdminChurchId(null);
  }

  getActiveChurchId(): string | null {
    return this.getAdminChurchId() ?? this.getChurchIdHeaderValue();
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
    this.adminChurchIdSubject.next(null);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.removeItem(AuthSessionService.STORAGE_KEY);
      localStorage.removeItem(AuthSessionService.ADMIN_CHURCH_CONTEXT_KEY);
    } catch {
      // ignore browser storage failures
    }
  }

  private readAdminChurchIdFromStorage(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      return this.normalizeChurchId(localStorage.getItem(AuthSessionService.ADMIN_CHURCH_CONTEXT_KEY));
    } catch {
      return null;
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

  private normalizeChurchId(churchId: string | number | null | undefined): string | null {
    if (churchId === null || churchId === undefined) {
      return null;
    }

    const normalizedChurchId = String(churchId).trim();
    return normalizedChurchId.length > 0 ? normalizedChurchId : null;
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
