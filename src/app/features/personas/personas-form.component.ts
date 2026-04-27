import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { PersonasApiService } from '../../core/api/personas-api.service';
import { ChurchesApiService } from '../../core/api/churches-api.service';
import { MetadataApiService } from '../../core/api/metadata-api.service';
import { Persona, PersonaRequest, Church, EnumOption } from '../../shared/models/api.models';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-personas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatSelectModule],
  template: `
    <section class="form-page">
      <div class="form-header">
        <h1>{{ isEditMode ? 'Editar Pessoa' : 'Nova Pessoa' }}</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="form-container">
        <div class="form-grid-2">
          <div class="form-group">
            <label for="churchId">Igreja *</label>
            <select id="churchId" formControlName="churchId" class="form-select">
              <option value="">Selecione uma igreja</option>
              <option *ngFor="let church of churches" [value]="church.id">{{ church.name }}</option>
            </select>
            <small class="error" *ngIf="form.get('churchId')?.touched && form.get('churchId')?.hasError('required')">
              Igreja é obrigatória
            </small>
          </div>

          <div class="form-group">
            <label for="personaType">Tipo de Pessoa *</label>
            <select id="personaType" formControlName="personaType" class="form-select">
              <option value="">Selecione um tipo</option>
              <option *ngFor="let type of personaTypes" [value]="type.value">{{ type.description }}</option>
            </select>
            <small class="error" *ngIf="form.get('personaType')?.touched && form.get('personaType')?.hasError('required')">
              Tipo é obrigatório
            </small>
          </div>
        </div>

        <div class="form-group">
          <label for="taxId">CPF/CNPJ *</label>
          <input
            id="taxId"
            type="text"
            formControlName="taxId"
            placeholder="Ex: 12345678901"
            class="form-input"
          />
          <small class="error" *ngIf="form.get('taxId')?.touched && form.get('taxId')?.hasError('required')">
            CPF/CNPJ é obrigatório
          </small>
        </div>

        <div class="form-group">
          <label for="name">Nome Completo *</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            placeholder="Ex: João Silva"
            class="form-input"
          />
          <small class="error" *ngIf="form.get('name')?.touched && form.get('name')?.hasError('required')">
            Nome é obrigatório
          </small>
        </div>

        <div class="form-grid-3">
          <div class="form-group">
            <label for="birthDate">Data de Nascimento</label>
            <input
              id="birthDate"
              type="date"
              formControlName="birthDate"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="maritalStatus">Estado Civil</label>
            <select id="maritalStatus" formControlName="maritalStatus" class="form-select">
              <option value="">Selecione</option>
              <option *ngFor="let status of maritalStatuses" [value]="status.value">
                {{ status.description }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="phone">Telefone</label>
            <input
              id="phone"
              type="tel"
              formControlName="phone"
              placeholder="Ex: 62999999999"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="Ex: joao@email.com"
            class="form-input"
          />
          <small class="error" *ngIf="form.get('email')?.touched && form.get('email')?.hasError('email')">
            Email inválido
          </small>
        </div>

        <div class="form-group">
          <label for="address">Endereço</label>
          <input
            id="address"
            type="text"
            formControlName="address"
            placeholder="Ex: Rua A, 123"
            class="form-input"
          />
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
      max-width: 700px;
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

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 4px;
    }

    .form-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 4px;
    }

    .form-group label {
      margin-bottom: 8px;
      color: #293241;
      font-weight: 600;
      font-size: 14px;
    }

    .form-input,
    .form-select {
      padding: 10px 12px;
      border: 1px solid #d4dce6;
      border-radius: 8px;
      background: #f6f8fb;
      font-size: 14px;
      color: #0f172a;
      outline: none;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .form-input:focus,
    .form-select:focus {
      border-color: #1c4d8c;
      box-shadow: 0 0 0 3px rgba(28, 77, 140, 0.16);
    }

    .form-input::placeholder {
      color: #8a96a9;
    }

    .form-select {
      cursor: pointer;
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

      .form-grid-2,
      .form-grid-3 {
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
export class PersonasFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly personasApiService = inject(PersonasApiService);
  private readonly churchesApiService = inject(ChurchesApiService);
  private readonly metadataApiService = inject(MetadataApiService);

  form!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  private personaId: number | null = null;

  churches: Church[] = [];
  personaTypes: EnumOption[] = [];
  maritalStatuses: EnumOption[] = [];

  ngOnInit(): void {
    this.loadEnums();
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      churchId: ['', [Validators.required]],
      personaType: ['', [Validators.required]],
      taxId: ['', [Validators.required]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      birthDate: [''],
      maritalStatus: [''],
      phone: [''],
      email: ['', [Validators.email]],
      address: ['']
    });
  }

  private loadEnums(): void {
    combineLatest([
      this.churchesApiService.getAll(),
      this.metadataApiService.getPersonaTypesCached(),
      this.metadataApiService.getMaritalStatusesCached()
    ]).subscribe({
      next: ([churches, personaTypes, maritalStatuses]) => {
        this.churches = churches;
        this.personaTypes = personaTypes;
        this.maritalStatuses = maritalStatuses;
      },
      error: (error) => {
        console.error('Erro ao carregar enums:', error);
      }
    });
  }

  private checkEditMode(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.personaId = parseInt(id);
      this.loadPersona();
    }
  }

  private loadPersona(): void {
    if (!this.personaId) return;

    this.personasApiService.getById(this.personaId).subscribe({
      next: (persona) => {
        this.form.patchValue({
          churchId: persona.churchId,
          personaType: persona.personaType,
          taxId: persona.taxId,
          name: persona.name,
          birthDate: persona.birthDate,
          maritalStatus: persona.maritalStatus,
          phone: persona.phone,
          email: persona.email,
          address: persona.address
        });
      },
      error: (error) => {
        console.error('Erro ao carregar pessoa:', error);
        alert('Erro ao carregar os dados da pessoa');
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.form.getRawValue();
    const request: PersonaRequest = {
      ...formValue,
      taxId: this.onlyDigits(formValue.taxId)
    };

    const operation = this.isEditMode
      ? this.personasApiService.update(this.personaId!, request)
      : this.personasApiService.create(request);

    operation.subscribe({
      next: () => {
        alert(this.isEditMode ? 'Pessoa atualizada com sucesso' : 'Pessoa criada com sucesso');
        this.router.navigate(['/personas']);
      },
      error: (error) => {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar a pessoa');
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/personas']);
  }

  private onlyDigits(value: string | null | undefined): string {
    return value?.replace(/\D/g, '') ?? '';
  }
}
