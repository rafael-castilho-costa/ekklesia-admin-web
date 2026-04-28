import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { AdminChurchesApiService } from '../../core/api/admin-churches-api.service';
import { Church, ChurchRequest } from '../../shared/models/api.models';

@Component({
  standalone: true,
  selector: 'app-admin-churches',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
  template: `
    <section class="admin-page">
      <header class="admin-header">
        <div>
          <h2>Igrejas</h2>
          <p>Cadastro administrativo das igrejas da plataforma</p>
        </div>
        <button type="button" class="admin-button" (click)="openCreate()">
          <mat-icon>add</mat-icon>
          Nova Igreja
        </button>
      </header>

      <section class="admin-panel">
        <div class="admin-panel-header">
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="Buscar por nome, cidade ou CNPJ" [(ngModel)]="searchTerm">
          </div>
        </div>

        <div *ngIf="isLoading" class="state-message">Carregando igrejas...</div>

        <div *ngIf="!isLoading" class="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Cidade</th>
                <th>Estado</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let church of filteredChurches">
                <td>{{ church.name }}</td>
                <td>{{ church.cnpj }}</td>
                <td>{{ church.city }}</td>
                <td>{{ church.state }}</td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="icon-action" (click)="openEdit(church)" title="Editar">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button type="button" class="icon-action danger" (click)="delete(church)" title="Excluir">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredChurches.length === 0">
                <td colspan="5" class="empty-state">Nenhuma igreja encontrada.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <div class="admin-modal-overlay" *ngIf="isModalOpen" (click)="closeOnBackdrop($event)">
      <section class="admin-modal" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h3>{{ editingChurch ? 'Editar Igreja' : 'Nova Igreja' }}</h3>
          <button type="button" class="icon-action" (click)="closeModal()" aria-label="Fechar">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        <form class="admin-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-field full-width">
            <label for="name">Nome *</label>
            <input id="name" formControlName="name" type="text">
            <small class="error-text" *ngIf="form.controls.name.touched && form.controls.name.hasError('required')">Nome e obrigatorio</small>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="cnpj">CNPJ *</label>
              <input id="cnpj" formControlName="cnpj" type="text">
            </div>
            <div class="form-field">
              <label for="state">Estado *</label>
              <input id="state" formControlName="state" type="text" maxlength="2">
            </div>
          </div>

          <div class="form-field full-width">
            <label for="city">Cidade *</label>
            <input id="city" formControlName="city" type="text">
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
export class AdminChurchesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminChurchesApiService = inject(AdminChurchesApiService);

  churches: Church[] = [];
  searchTerm = '';
  isLoading = true;
  isSubmitting = false;
  isModalOpen = false;
  editingChurch: Church | null = null;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    cnpj: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]]
  });

  ngOnInit(): void {
    this.loadChurches();
  }

  get filteredChurches(): Church[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.churches;
    }

    return this.churches.filter((church) =>
      church.name.toLowerCase().includes(term) ||
      church.city.toLowerCase().includes(term) ||
      church.cnpj.toLowerCase().includes(term)
    );
  }

  openCreate(): void {
    this.editingChurch = null;
    this.form.reset({ name: '', cnpj: '', city: '', state: '' });
    this.isModalOpen = true;
  }

  openEdit(church: Church): void {
    this.editingChurch = church;
    this.form.reset(church);
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSubmitting = false;
    this.editingChurch = null;
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.form.getRawValue() as ChurchRequest;
    const operation = this.editingChurch
      ? this.adminChurchesApiService.update(this.editingChurch.id, request)
      : this.adminChurchesApiService.create(request);

    this.isSubmitting = true;
    operation.pipe(finalize(() => (this.isSubmitting = false))).subscribe({
      next: () => {
        this.closeModal();
        this.loadChurches();
      },
      error: () => alert('Nao foi possivel salvar a igreja.')
    });
  }

  delete(church: Church): void {
    if (!confirm(`Deseja excluir a igreja "${church.name}"?`)) {
      return;
    }

    this.adminChurchesApiService.delete(church.id).subscribe({
      next: () => this.loadChurches(),
      error: () => alert('Nao foi possivel excluir a igreja.')
    });
  }

  private loadChurches(): void {
    this.isLoading = true;
    this.adminChurchesApiService
      .getAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (churches) => (this.churches = churches),
        error: () => alert('Nao foi possivel carregar as igrejas.')
      });
  }
}
