import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../core/api/auth-api.service';
import { AuthSessionService } from '../core/auth/auth-session.service';
import { AuthLoginRequest } from '../shared/models/api.models';
import { DebugService } from '../debug.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authApiService = inject(AuthApiService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly debugService = inject(DebugService);

  public form: FormGroup;
  public showPassword = false;
  public isSubmitting = false;
  public authErrorMessage: string | null = null;

  constructor() {
    this.form = this.fb.group({
      email: ['admin@ekklesia.com', [Validators.required, Validators.email]],
      password: ['Cassiane@121121', [Validators.required, Validators.minLength(6)]]
    });

    // Debug: Test API connection on component init
    console.log('🔍 LoginComponent inicializado, testando API...');
    this.debugService.testApiConnection();
  }

  public get formControls() {
    return this.form.controls;
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public login(): void {
    this.authErrorMessage = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    const sanitizedEmail = String(email ?? '').trim();
    const sanitizedPassword = String(password ?? '');

    this.isSubmitting = true;

    const loginRequest: AuthLoginRequest = {
      email: sanitizedEmail,
      password: sanitizedPassword
    };

    console.log('🔐 Iniciando login...', { email: sanitizedEmail });

    this.authApiService
      .login(loginRequest)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          console.log('✅ Login bem-sucedido, salvando token...');
          console.log('🔑 Token recebido:', response.token?.substring(0, 20) + '...');

          // 1️⃣ SALVA O TOKEN IMEDIATAMENTE
          this.authSessionService.setSession({
            accessToken: response.token
          });
          console.log('✅ Token salvo em AuthSessionService');
          console.log('🔍 Token em memória agora:', this.authSessionService.getAccessToken()?.substring(0, 20) + '...');

          // 2️⃣ AGORA CHAMA /auth/me COM O INTERCEPTOR ENVIANDO O TOKEN
          console.log('📡 Chamando GET /auth/me com Authorization header...');
          this.authApiService.getAuthenticatedUser().subscribe({
            next: (user) => {
              console.log('✅ GET /auth/me retornou 200 OK');
              console.log('✅ Dados do usuário:', user);

              // ATUALIZA A SESSÃO COM DADOS COMPLETOS DO USUÁRIO
              this.authSessionService.setSession({
                accessToken: response.token,
                user: user
              });
              console.log('✅ Sessão atualizada com dados do usuário');
              console.log('✅ Redirecionando para dashboard...');

              // Redireciona para /:churchId/home
              const churchId = user.churchId || this.authSessionService.getSession()?.user?.churchId;
              if (churchId) {
                this.router.navigate([churchId, 'home']);
              } else {
                console.warn('⚠️ churchId não encontrado, redirecionando para /login');
                this.router.navigate(['/login']);
              }
            },
            error: (getAuthError) => {
              console.error('❌ GET /auth/me retornou erro:', getAuthError);
              if (getAuthError.status === 401) {
                console.error('❌ 401 Unauthorized - O token não foi enviado ou é inválido');
                this.authErrorMessage = 'Sessão expirada ou token inválido. Tente fazer login novamente.';
              } else {
                console.error('❌ Erro ao carregar usuário:', getAuthError.message);
                this.authErrorMessage = 'Erro ao carregar dados do usuário';
              }
            }
          });
        },
        error: (loginError) => {
          console.error('❌ POST /auth/login retornou erro:', loginError);
          this.authErrorMessage = this.resolveLoginErrorMessage(loginError);
        }
      });
  }

  private resolveLoginErrorMessage(error: unknown): string {
    console.error('🔍 Analisando erro de login:', error);

    if (typeof error === 'object' && error !== null && 'status' in error) {
      const httpError = error as any;

      if (httpError.status === 0) {
        console.error('❌ Erro de conexão: Não conseguiu comunicar com a API');
        return 'Não foi possível conectar com o servidor. Verifique se a API está rodando em http://localhost:8081 e se há CORS configurado.';
      }

      if (httpError.status === 401 || httpError.status === 403) {
        console.error('❌ Credenciais inválidas (401/403)');
        return 'Email ou senha inválidos.';
      }

      if (httpError.error?.message) {
        return httpError.error.message;
      }

      if (httpError.message) {
        return httpError.message;
      }
    }

    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return 'Não foi possível realizar o login. Tente novamente.';
  }
}
