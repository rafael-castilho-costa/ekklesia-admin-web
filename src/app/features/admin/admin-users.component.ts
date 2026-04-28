import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize, forkJoin } from 'rxjs';
import { AdminChurchesApiService } from '../../core/api/admin-churches-api.service';
import { AdminUsersApiService } from '../../core/api/admin-users-api.service';
import { AdminUser, AdminUserRequest, Church, RoleEnum, UserScope } from '../../shared/models/api.models';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
  template: `
    <section class="admin-page">
      <header class="admin-header">
        <div>
          <h2>Usuarios</h2>
          <p>Gerencie acessos, escopos e bloqueios da plataforma</p>
        </div>
        <button type="button" class="admin-button" (click)="openCreate()">
          <mat-icon>add</mat-icon>
          Novo Usuario
        </button>
      </header>

      <section class="admin-panel">
        <div class="admin-panel-header">
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="Buscar por nome ou email" [(ngModel)]="searchTerm">
          </div>
        </div>

        <div *ngIf="isLoading" class="state-message">Carregando usuarios...</div>

        <div *ngIf="!isLoading" class="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Escopo</th>
                <th>Igreja</th>
                <th>Perfis</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of filteredUsers">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.scope }}</td>
                <td>{{ user.churchName || user.churchId || '-' }}</td>
                <td>{{ user.roles.join(', ') }}</td>
                <td>
                  <span class="status-pill" [class.warn]="isBlocked(user)">
                    {{ isBlocked(user) ? 'Bloqueado' : 'Ativo' }}
                  </span>
                </td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="icon-action" (click)="openEdit(user)" title="Editar">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button *ngIf="!isBlocked(user)" type="button" class="icon-action" (click)="block(user)" title="Bloquear">
                      <mat-icon>lock</mat-icon>
                    </button>
                    <button *ngIf="isBlocked(user)" type="button" class="icon-action" (click)="unblock(user)" title="Desbloquear">
                      <mat-icon>lock_open</mat-icon>
                    </button>
                    <button type="button" class="icon-action danger" (click)="delete(user)" title="Excluir">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredUsers.length === 0">
                <td colspan="7" class="empty-state">Nenhum usuario encontrado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <div class="admin-modal-overlay" *ngIf="isModalOpen" (click)="closeOnBackdrop($event)">
      <section class="admin-modal" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h3>{{ editingUser ? 'Editar Usuario' : 'Novo Usuario' }}</h3>
          <button type="button" class="icon-action" (click)="closeModal()" aria-label="Fechar">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        <form class="admin-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <div class="form-field">
              <label for="name">Nome *</label>
              <input id="name" formControlName="name" type="text">
            </div>

            <div class="form-field">
              <label for="email">Email *</label>
              <input id="email" formControlName="email" type="email">
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="password">Senha{{ editingUser ? '' : ' *' }}</label>
              <input id="password" formControlName="password" type="password" autocomplete="new-password">
            </div>

            <div class="form-field">
              <label for="personaId">Pessoa</label>
              <input id="personaId" formControlName="personaId" type="number">
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="scope">Escopo *</label>
              <select id="scope" formControlName="scope">
                <option value="TENANT">TENANT</option>
                <option value="PLATFORM">PLATFORM</option>
              </select>
            </div>

            <div class="form-field">
              <label for="churchId">Igreja{{ form.controls.scope.value === 'TENANT' ? ' *' : '' }}</label>
              <select id="churchId" formControlName="churchId">
                <option value="">Selecione</option>
                <option *ngFor="let church of churches" [value]="church.id">{{ church.name }}</option>
              </select>
              <small class="error-text" *ngIf="form.controls.churchId.touched && form.controls.churchId.hasError('required')">
                Igreja e obrigatoria para escopo TENANT
              </small>
            </div>
          </div>

          <div class="form-field full-width">
            <label>Perfis *</label>
            <div class="role-grid">
              <label class="role-option" *ngFor="let role of availableRoles">
                <input
                  type="checkbox"
                  [checked]="isRoleSelected(role)"
                  (change)="toggleRole(role, $event)"
                >
                <span>{{ role }}</span>
              </label>
            </div>
            <small class="error-text" *ngIf="form.controls.roles.touched && form.controls.roles.hasError('required')">
              Selecione pelo menos um perfil
            </small>
          </div>

          <footer class="modal-actions">
            <button type="button" class="secondary-button" (click)="closeModal()">Cancelar</button>
            <button type="submit" class="admin-button" [disabled]="form.invalid || isSubmitting">
              {{ isSubmitting ? 'Salvando...' : 'Salvar' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  `,
  styleUrls: ['./admin-pages.css']
})
export class AdminUsersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminUsersApiService = inject(AdminUsersApiService);
  private readonly adminChurchesApiService = inject(AdminChurchesApiService);

  users: AdminUser[] = [];
  churches: Church[] = [];
  searchTerm = '';
  isLoading = true;
  isSubmitting = false;
  isModalOpen = false;
  editingUser: AdminUser | null = null;

  readonly availableRoles = [
    RoleEnum.ROLE_ADMIN,
    RoleEnum.ROLE_SECRETARY,
    RoleEnum.ROLE_TREASURER,
    RoleEnum.ROLE_MEMBER,
    RoleEnum.ROLE_ADMIN_MASTER
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    personaId: [''],
    scope: ['TENANT' as UserScope, [Validators.required]],
    churchId: [''],
    roles: [[] as string[], [Validators.required]]
  });

  ngOnInit(): void {
    this.loadData();
    this.form.controls.scope.valueChanges.subscribe(() => this.configureScopeRules());
  }

  get filteredUsers(): AdminUser[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.users;
    }

    return this.users.filter((user) =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }

  openCreate(): void {
    this.editingUser = null;
    this.form.reset({
      name: '',
      email: '',
      password: '',
      personaId: '',
      scope: 'TENANT',
      churchId: '',
      roles: []
    });
    this.form.controls.password.setValidators([Validators.required]);
    this.form.controls.password.updateValueAndValidity();
    this.configureScopeRules();
    this.isModalOpen = true;
  }

  openEdit(user: AdminUser): void {
    this.editingUser = user;
    this.form.reset({
      name: user.name,
      email: user.email,
      password: '',
      personaId: user.personaId ? String(user.personaId) : '',
      scope: user.scope,
      churchId: user.churchId ? String(user.churchId) : '',
      roles: user.roles ?? []
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.configureScopeRules();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSubmitting = false;
    this.editingUser = null;
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  isRoleSelected(role: string): boolean {
    return this.form.controls.roles.value?.includes(role) ?? false;
  }

  toggleRole(role: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const roles = this.form.controls.roles.value ?? [];
    const nextRoles = checked ? Array.from(new Set([...roles, role])) : roles.filter((item) => item !== role);

    this.form.controls.roles.setValue(nextRoles);
    this.form.controls.roles.markAsTouched();

    if (role === RoleEnum.ROLE_ADMIN_MASTER && checked) {
      this.form.controls.scope.setValue('PLATFORM');
    }
  }

  submit(): void {
    this.configureScopeRules();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const request: AdminUserRequest = {
      name: formValue.name?.trim() ?? '',
      email: formValue.email?.trim() ?? '',
      password: formValue.password?.trim() || null,
      personaId: this.toOptionalNumber(formValue.personaId),
      scope: formValue.scope ?? 'TENANT',
      churchId: formValue.scope === 'TENANT' ? this.toOptionalNumber(formValue.churchId) : null,
      roles: formValue.roles ?? []
    };

    const operation = this.editingUser
      ? this.adminUsersApiService.update(this.editingUser.id, request)
      : this.adminUsersApiService.create(request);

    this.isSubmitting = true;
    operation.pipe(finalize(() => (this.isSubmitting = false))).subscribe({
      next: () => {
        this.closeModal();
        this.loadData();
      },
      error: () => alert('Nao foi possivel salvar o usuario.')
    });
  }

  isBlocked(user: AdminUser): boolean {
    if (typeof user.blocked === 'boolean') {
      return user.blocked;
    }

    if (typeof user.enabled === 'boolean') {
      return !user.enabled;
    }

    return user.active === false;
  }

  block(user: AdminUser): void {
    this.adminUsersApiService.block(user.id).subscribe({
      next: () => this.loadData(),
      error: () => alert('Nao foi possivel bloquear o usuario.')
    });
  }

  unblock(user: AdminUser): void {
    this.adminUsersApiService.unblock(user.id).subscribe({
      next: () => this.loadData(),
      error: () => alert('Nao foi possivel desbloquear o usuario.')
    });
  }

  delete(user: AdminUser): void {
    if (!confirm(`Deseja excluir o usuario "${user.name}"?`)) {
      return;
    }

    this.adminUsersApiService.delete(user.id).subscribe({
      next: () => this.loadData(),
      error: () => alert('Nao foi possivel excluir o usuario.')
    });
  }

  private loadData(): void {
    this.isLoading = true;
    forkJoin({
      users: this.adminUsersApiService.getAll(),
      churches: this.adminChurchesApiService.getAll()
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ users, churches }) => {
          this.users = users;
          this.churches = churches;
        },
        error: () => alert('Nao foi possivel carregar os usuarios.')
      });
  }

  private configureScopeRules(): void {
    const scope = this.form.controls.scope.value;
    const roles = this.form.controls.roles.value ?? [];
    const churchId = this.form.controls.churchId;

    if (roles.includes(RoleEnum.ROLE_ADMIN_MASTER) && scope !== 'PLATFORM') {
      this.form.controls.scope.setValue('PLATFORM', { emitEvent: false });
    }

    if (this.form.controls.scope.value === 'PLATFORM') {
      churchId.clearValidators();
      churchId.disable({ emitEvent: false });
      churchId.setValue('', { emitEvent: false });
    } else {
      churchId.enable({ emitEvent: false });
      churchId.setValidators([Validators.required]);
    }

    churchId.updateValueAndValidity({ emitEvent: false });
  }

  private toOptionalNumber(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
