import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChurchesApiService } from '../../core/api/churches-api.service';
import { Church, ChurchRequest } from '../../shared/models/api.models';

@Component({
  selector: 'app-churches-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="form-page">
      <div class="form-header">
        <h1>{{ isEditMode ? 'Editar Igreja' : 'Nova Igreja' }}</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="form-container">
        <div class="form-group">
          <label for="name">Nome da Igreja</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            placeholder="Ex: Igreja Evangélica Centro"
            class="form-input"
          />
          <small class="error" *ngIf="form.get('name')?.touched && form.get('name')?.hasError('required')">
            Nome é obrigatório
          </small>
        </div>

        <div class="form-group">
          <label for="cnpj">CNPJ</label>
          <input
            id="cnpj"
            type="text"
            formControlName="cnpj"
            placeholder="Ex: 98765432000155"
            class="form-input"
          />
          <small class="error" *ngIf="form.get('cnpj')?.touched && form.get('cnpj')?.hasError('required')">
            CNPJ é obrigatório
          </small>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="city">Cidade</label>
            <input
              id="city"
              type="text"
              formControlName="city"
              placeholder="Ex: Senador Canedo"
              class="form-input"
            />
            <small class="error" *ngIf="form.get('city')?.touched && form.get('city')?.hasError('required')">
              Cidade é obrigatória
            </small>
          </div>

          <div class="form-group">
            <label for="state">Estado</label>
            <input
              id="state"
              type="text"
              formControlName="state"
              placeholder="Ex: GO"
              class="form-input"
              maxlength="2"
            />
            <small class="error" *ngIf="form.get('state')?.touched && form.get('state')?.hasError('required')">
              Estado é obrigatório
            </small>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="button"
            (click)="goBack()"
            class="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            [disabled]="form.invalid || isSubmitting"
            class="btn btn-primary"
          >
            {{ isSubmitting ? 'Salvando...' : (isEditMode ? 'Atualizar' : 'Criar') }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .form-page {
      max-width: 600px;
      margin: 0 auto;
    }

    .form-header {
      margin-bottom: 24px;
    }

    .form-header h1 {
      margin: 0;
      font-size: 24px;
      color: #0e2241;
    }

    .form-container {
      background: #ffffff;
      border: 1px solid #d8dee8;
      border-radius: 12px;
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      margin-bottom: 8px;
      color: #293241;
      font-weight: 600;
      font-size: 14px;
    }

    .form-input {
      padding: 10px 12px;
      border: 1px solid #d4dce6;
      border-radius: 8px;
      background: #f6f8fb;
      font-size: 14px;
      color: #0f172a;
      outline: none;
      transition: all 0.2s ease;
    }

    .form-input:focus {
      border-color: #1c4d8c;
      box-shadow: 0 0 0 3px rgba(28, 77, 140, 0.16);
    }

    .form-input::placeholder {
      color: #8a96a9;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .error {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #d14343;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 28px;
      justify-content: flex-end;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #173766;
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background: #20497f;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f0f2f5;
      color: #293241;
    }

    .btn-secondary:hover {
      background: #e0e3e8;
    }

    @media (max-width: 768px) {
      .form-container {
        padding: 16px;
      }

      .form-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class ChurchesFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly churchesApiService = inject(ChurchesApiService);

  form!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  private churchId: number | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      cnpj: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]]
    });
  }

  private checkEditMode(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.churchId = parseInt(id);
      this.loadChurch();
    }
  }

  private loadChurch(): void {
    if (!this.churchId) return;

    this.churchesApiService.getById(this.churchId).subscribe({
      next: (church) => {
        this.form.patchValue(church);
      },
      error: (error) => {
        console.error('Erro ao carregar igreja:', error);
        alert('Erro ao carregar os dados da igreja');
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const request: ChurchRequest = this.form.getRawValue();

    const operation = this.isEditMode
      ? this.churchesApiService.update(this.churchId!, request)
      : this.churchesApiService.create(request);

    operation.subscribe({
      next: () => {
        alert(this.isEditMode ? 'Igreja atualizada com sucesso' : 'Igreja criada com sucesso');
        this.router.navigate(['/churches']);
      },
      error: (error) => {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar a igreja');
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/churches']);
  }
}
