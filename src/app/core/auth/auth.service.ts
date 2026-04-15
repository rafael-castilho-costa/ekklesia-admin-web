import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthSession, AuthSessionService } from './auth-session.service';

export interface LoginPayload {
  churchId: string;
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly loginUrl = `${environment.apiBaseUrl}/auth/login`;

  constructor(
    private httpClient: HttpClient,
    private authSession: AuthSessionService
  ) {}

  login(payload: LoginPayload): Observable<AuthSession> {
    return this.httpClient.post<LoginResponse>(this.loginUrl, payload).pipe(
      map((response) => {
        const accessToken = response.accessToken ?? response.token;

        if (!accessToken) {
          throw new Error('Resposta de login sem access token.');
        }

        const session: AuthSession = {
          accessToken,
          refreshToken: response.refreshToken,
          expiresAt: response.expiresAt
          // user será preenchido após chamar GET /auth/me
        };

        this.authSession.setSession(session);

        return session;
      })
    );
  }

  logout(): void {
    this.authSession.clearSession();
  }
}
