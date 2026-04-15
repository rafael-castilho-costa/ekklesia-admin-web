import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthSessionService } from '../auth/auth-session.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly router = inject(Router);

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // 🔍 LOG: URL da requisição
    console.log(`🌐 [AuthInterceptor] Interceptando requisição para: ${request.url}`);

    // 🔑 LÊ O TOKEN DO SERVIÇO
    const accessToken = this.authSessionService.getAccessToken();
    console.log(`🔍 [AuthInterceptor] Token em memória:`, accessToken ? '✅ Existe' : '❌ Não existe');

    if (accessToken) {
      console.log(`🔐 [AuthInterceptor] Token encontrado: ${accessToken.substring(0, 20)}...`);
      console.log(`🔐 [AuthInterceptor] Adicionando header: Authorization: Bearer ${accessToken.substring(0, 20)}...`);

      // ✅ ADICIONA O HEADER AUTHORIZATION
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log(`✅ [AuthInterceptor] Header adicionado com sucesso`);
    } else {
      console.log(`⚠️ [AuthInterceptor] Nenhum token disponível - requisição será anônima`);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`❌ [AuthInterceptor] Requisição retornou status ${error.status}`);

        // Se receber 401, limpa sessão
        if (error.status === 401) {
          console.error('❌ [AuthInterceptor] 401 Unauthorized - Limpando sessão e redirecionando para login');
          this.authSessionService.clearSession();
          this.router.navigate(['/login']);
        }

        if (error.status === 403) {
          console.warn('⚠️ [AuthInterceptor] 403 Forbidden');
        }

        return throwError(() => error);
      })
    );
  }
}
