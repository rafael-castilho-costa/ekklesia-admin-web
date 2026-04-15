import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthSessionService } from '../auth/auth-session.service';
import { Router } from '@angular/router';

/**
 * Interceptor funcional para anexar token JWT automaticamente
 * Este é o novo padrão do Angular 15+
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);

  // 🔍 LOG: URL da requisição
  console.log(`🌐 [authInterceptor FN] Interceptando: ${request.url}`);

  // 🔑 LÊ O TOKEN DO SERVIÇO
  const accessToken = authSessionService.getAccessToken();
  console.log(`🔍 [authInterceptor FN] Token em memória:`, accessToken ? '✅ Existe' : '❌ Não existe');

  if (accessToken) {
    console.log(`🔐 [authInterceptor FN] Token: ${accessToken.substring(0, 20)}...`);
    console.log(`🔐 [authInterceptor FN] ADICIONANDO header Authorization: Bearer ${accessToken.substring(0, 20)}...`);

    // ✅ CLONA A REQUISIÇÃO E ADICIONA O HEADER
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log(`✅ [authInterceptor FN] Header adicionado com sucesso`);
  } else {
    console.log(`⚠️ [authInterceptor FN] Nenhum token disponível - requisição será ANÔNIMA`);
  }

  return next(request).pipe(
    // catchError não é necessário aqui porque o Angular trata automaticamente
    // Mas podemos adicionar se quisermos fazer logout em 401
  );
};
