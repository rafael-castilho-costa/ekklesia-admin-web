import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { AuthApiService } from '../core/api/auth-api.service';
import { AuthSessionService } from '../core/auth/auth-session.service';
import { TenantContextService } from '../core/tenant/tenant-context.service';
import { AuthLoginRequest } from '../shared/models/api.models';

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
  private readonly tenantContextService = inject(TenantContextService);

  public form: FormGroup;
  public showPassword = false;
  public isSubmitting = false;
  public authErrorMessage: string | null = null;

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
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
    const loginRequest: AuthLoginRequest = {
      email: String(email ?? '').trim(),
      password: String(password ?? '')
    };

    this.isSubmitting = true;

    this.authApiService
      .login(loginRequest)
      .pipe(
        switchMap((response) => {
          this.authSessionService.setSession({ accessToken: response.token });

          const churchIdHeader = this.authSessionService.getChurchIdHeaderValue();
          if (churchIdHeader) {
            this.tenantContextService.setChurchId(churchIdHeader);
          }

          return this.authApiService.getAuthenticatedUser();
        }),
        finalize(() => (this.isSubmitting = false))
      )
      .subscribe({
        next: (user) => {
          const currentSession = this.authSessionService.getSession();
          if (!currentSession?.accessToken) {
            this.authErrorMessage = 'Nao foi possivel concluir a autenticacao.';
            return;
          }

          this.authSessionService.setSession({
            ...currentSession,
            user
          });
          if (user.adminMaster) {
            this.authSessionService.clearAdminChurchId();
            this.router.navigate(['/admin/churches']);
            return;
          }

          if (!user.churchId) {
            this.authErrorMessage = 'Nao foi possivel identificar a igreja do usuario.';
            return;
          }

          this.tenantContextService.setChurchId(String(user.churchId));
          this.router.navigate([String(user.churchId), 'home']);
        },
        error: (error) => {
          this.authErrorMessage = this.resolveLoginErrorMessage(error);
        }
      });
  }

  private resolveLoginErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const httpError = error as {
        status?: number;
        error?: { message?: string };
        message?: string;
      };

      if (httpError.status === 0) {
        return 'Nao foi possivel conectar com o servidor em http://localhost:8081.';
      }

      if (httpError.status === 400 || httpError.status === 401 || httpError.status === 403) {
        return httpError.error?.message || 'Email ou senha invalidos.';
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

    return 'Nao foi possivel realizar o login. Tente novamente.';
  }
}
