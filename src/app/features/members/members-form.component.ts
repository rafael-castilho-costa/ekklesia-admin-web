import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MembersApiService } from '../../core/api/members-api.service';
import { PersonasApiService } from '../../core/api/personas-api.service';
import { MetadataApiService } from '../../core/api/metadata-api.service';
import { Member, MemberRequest, Persona, EnumOption } from '../../shared/models/api.models';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-members-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatSelectModule, MatCheckboxModule],
  template: `
    <section class="form-page">
      <div class="form-header">
        <h1>{{ isEditMode ? 'Editar Membro' : 'Novo Membro' }}</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="form-container">
        <div class="form-group">
          <label for="personaId">Pessoa *</label>
          <select id="personaId" formControlName="personaId" class="form-select">
            <option value="">Selecione uma pessoa</option>
            <option *ngFor="let persona of personas" [value]="persona.id">
              {{ persona.name }} ({{ persona.email }})
            </option>
          </select>
          <small class="error" *ngIf="form.get('personaId')?.touched && form.get('personaId')?.hasError('required')">
            Pessoa é obrigatória
          </small>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label for="membershipDate">Data de Membresia *</label>
            <input
              id="membershipDate"
              type="date"
              formControlName="membershipDate"
              class="form-input"
            />
            <small class="error" *ngIf="form.get('membershipDate')?.touched && form.get('membershipDate')?.hasError('required')">
              Data de membresia é obrigatória
            </small>
          </div>

          <div class="form-group">
            <label for="baptismDate">Data de Batismo</label>
            <input
              id="baptismDate"
              type="date"
              formControlName="baptismDate"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group checkbox">
          <mat-checkbox formControlName="baptized">
            Foi batizado
          </mat-checkbox>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label for="ministry">Ministério</label>
            <select id="ministry" formControlName="ministry" class="form-select">
              <option value="">Selecione</option>
              <option *ngFor="let ministry of ministries" [value]="ministry.value">
                {{ ministry.description }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="statusMember">Status do Membro *</label>
            <select id="statusMember" formControlName="statusMember" class="form-select">
              <option value="">Selecione</option>
              <option *ngFor="let status of memberStatuses" [value]="status.value">
                {{ status.description }}
              </option>
            </select>
            <small class="error" *ngIf="form.get('statusMember')?.touched && form.get('statusMember')?.hasError('required')">
              Status é obrigatório
            </small>
          </div>
        </div>

        <div class="form-group">
          <label for="notes">Observações</label>
          <textarea
            id="notes"
            formControlName="notes"
            placeholder="Ex: Notas sobre o membro"
            class="form-textarea"
            rows="4"
          ></textarea>
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

    .form-group.checkbox {
      flex-direction: row;
      margin-bottom: 16px;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 4px;
    }

    .form-group label {
      margin-bottom: 8px;
      color: #293241;
      font-weight: 600;
      font-size: 14px;
    }

    .form-group.checkbox label {
      margin-bottom: 0;
    }

    .form-input,
    .form-select,
    .form-textarea {
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
    .form-select:focus,
    .form-textarea:focus {
      border-color: #1c4d8c;
      box-shadow: 0 0 0 3px rgba(28, 77, 140, 0.16);
    }

    .form-input::placeholder,
    .form-textarea::placeholder {
      color: #8a96a9;
    }

    .form-select {
      cursor: pointer;
    }

    .form-textarea {
      resize: vertical;
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

      .form-grid-2 {
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
export class MembersFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly membersApiService = inject(MembersApiService);
  private readonly personasApiService = inject(PersonasApiService);
  private readonly metadataApiService = inject(MetadataApiService);

  form!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  private memberId: number | null = null;

  personas: Persona[] = [];
  ministries: EnumOption[] = [];
  memberStatuses: EnumOption[] = [];

  ngOnInit(): void {
    this.loadEnums();
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      personaId: ['', [Validators.required]],
      membershipDate: ['', [Validators.required]],
      baptismDate: [''],
      baptized: [false],
      ministry: [''],
      statusMember: ['', [Validators.required]],
      notes: ['']
    });
  }

  private loadEnums(): void {
    combineLatest([
      this.personasApiService.getAll(),
      this.metadataApiService.getMinstriesCached(),
      this.metadataApiService.getMemberStatusesCached()
    ]).subscribe({
      next: ([personas, ministries, memberStatuses]) => {
        this.personas = personas;
        this.ministries = ministries;
        this.memberStatuses = memberStatuses;
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
      }
    });
  }

  private checkEditMode(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.memberId = parseInt(id);
      this.loadMember();
    }
  }

  private loadMember(): void {
    if (!this.memberId) return;

    this.membersApiService.getById(this.memberId).subscribe({
      next: (member) => {
        this.form.patchValue({
          personaId: member.personaId,
          membershipDate: member.membershipDate,
          baptismDate: member.baptismDate,
          baptized: member.baptized,
          ministry: member.ministry,
          statusMember: member.statusMember,
          notes: member.notes
        });
      },
      error: (error) => {
        console.error('Erro ao carregar membro:', error);
        alert('Erro ao carregar os dados do membro');
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const request: MemberRequest = this.form.getRawValue();

    const operation = this.isEditMode
      ? this.membersApiService.update(this.memberId!, request)
      : this.membersApiService.create(request);

    operation.subscribe({
      next: () => {
        alert(this.isEditMode ? 'Membro atualizado com sucesso' : 'Membro criado com sucesso');
        this.router.navigate(['/members']);
      },
      error: (error) => {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar o membro');
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/members']);
  }
}
