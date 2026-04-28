import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize, forkJoin } from 'rxjs';
import { AdminChurchesApiService } from '../../core/api/admin-churches-api.service';
import { AdminPersonasApiService } from '../../core/api/admin-personas-api.service';
import { MetadataApiService } from '../../core/api/metadata-api.service';
import { Church, EnumOption, Persona, PersonaRequest } from '../../shared/models/api.models';

@Component({
  standalone: true,
  selector: 'app-admin-personas',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
  template: `
    <section class="admin-page">
      <header class="admin-header">
        <div>
          <h2>Pessoas</h2>
          <p>Consulta e manutencao administrativa de pessoas</p>
        </div>
      </header>

      <section class="admin-panel">
        <div class="admin-panel-header">
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="Buscar por nome, email ou documento" [(ngModel)]="searchTerm">
          </div>
        </div>

        <div *ngIf="isLoading" class="state-message">Carregando pessoas...</div>

        <div *ngIf="!isLoading" class="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Documento</th>
                <th>Igreja</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let persona of filteredPersonas">
                <td>{{ persona.name }}</td>
                <td>{{ persona.email || '-' }}</td>
                <td>{{ persona.phone || '-' }}</td>
                <td>{{ persona.taxId || '-' }}</td>
                <td>{{ persona.churchName || persona.churchId || '-' }}</td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="icon-action" (click)="openEdit(persona)" title="Editar">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button type="button" class="icon-action danger" (click)="delete(persona)" title="Excluir">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredPersonas.length === 0">
                <td colspan="6" class="empty-state">Nenhuma pessoa encontrada.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <div class="admin-modal-overlay" *ngIf="isModalOpen" (click)="closeOnBackdrop($event)">
      <section class="admin-modal" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h3>Editar Pessoa</h3>
          <button type="button" class="icon-action" (click)="closeModal()" aria-label="Fechar">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        <form class="admin-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <div class="form-field">
              <label for="churchId">Igreja *</label>
              <select id="churchId" formControlName="churchId">
                <option value="">Selecione</option>
                <option *ngFor="let church of churches" [value]="church.id">{{ church.name }}</option>
              </select>
            </div>

            <div class="form-field">
              <label for="personaType">Tipo *</label>
              <select id="personaType" formControlName="personaType">
                <option value="">Selecione</option>
                <option *ngFor="let option of personaTypes" [value]="option.value">{{ option.description }}</option>
              </select>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="taxId">CPF/CNPJ *</label>
              <input id="taxId" formControlName="taxId" type="text">
            </div>
            <div class="form-field">
              <label for="birthDate">Nascimento</label>
              <input id="birthDate" formControlName="birthDate" type="date">
            </div>
          </div>

          <div class="form-field full-width">
            <label for="name">Nome *</label>
            <input id="name" formControlName="name" type="text">
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="maritalStatus">Estado civil</label>
              <select id="maritalStatus" formControlName="maritalStatus">
                <option value="">Selecione</option>
                <option *ngFor="let option of maritalStatuses" [value]="option.value">{{ option.description }}</option>
              </select>
            </div>
            <div class="form-field">
              <label for="phone">Telefone</label>
              <input id="phone" formControlName="phone" type="text">
            </div>
          </div>

          <div class="form-field full-width">
            <label for="email">Email</label>
            <input id="email" formControlName="email" type="email">
          </div>

          <div class="form-field full-width">
            <label for="address">Endereco</label>
            <input id="address" formControlName="address" type="text">
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
export class AdminPersonasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminPersonasApiService = inject(AdminPersonasApiService);
  private readonly adminChurchesApiService = inject(AdminChurchesApiService);
  private readonly metadataApiService = inject(MetadataApiService);

  personas: Persona[] = [];
  churches: Church[] = [];
  personaTypes: EnumOption[] = [];
  maritalStatuses: EnumOption[] = [];
  searchTerm = '';
  isLoading = true;
  isSubmitting = false;
  isModalOpen = false;
  editingPersona: Persona | null = null;

  readonly form = this.fb.group({
    churchId: ['', [Validators.required]],
    personaType: ['', [Validators.required]],
    taxId: ['', [Validators.required]],
    name: ['', [Validators.required]],
    birthDate: [''],
    maritalStatus: [''],
    phone: [''],
    email: ['', [Validators.email]],
    address: ['']
  });

  ngOnInit(): void {
    this.loadData();
  }

  get filteredPersonas(): Persona[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.personas;
    }

    return this.personas.filter((persona) =>
      persona.name.toLowerCase().includes(term) ||
      (persona.email ?? '').toLowerCase().includes(term) ||
      persona.taxId.toLowerCase().includes(term)
    );
  }

  openEdit(persona: Persona): void {
    this.editingPersona = persona;
    this.form.reset({
      churchId: String(persona.churchId ?? ''),
      personaType: persona.personaType ?? '',
      taxId: persona.taxId ?? '',
      name: persona.name ?? '',
      birthDate: persona.birthDate ?? '',
      maritalStatus: persona.maritalStatus ?? '',
      phone: persona.phone ?? '',
      email: persona.email ?? '',
      address: persona.address ?? ''
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSubmitting = false;
    this.editingPersona = null;
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  submit(): void {
    if (!this.editingPersona) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const request: PersonaRequest = {
      personaType: formValue.personaType ?? '',
      taxId: this.onlyDigits(formValue.taxId),
      name: formValue.name?.trim() ?? '',
      churchId: Number(formValue.churchId),
      birthDate: this.normalizeOptionalValue(formValue.birthDate),
      maritalStatus: this.normalizeOptionalValue(formValue.maritalStatus),
      phone: this.normalizeOptionalValue(formValue.phone),
      email: this.normalizeOptionalValue(formValue.email),
      address: this.normalizeOptionalValue(formValue.address)
    };

    this.isSubmitting = true;
    this.adminPersonasApiService
      .update(this.editingPersona.id, request)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        },
        error: () => alert('Nao foi possivel salvar a pessoa.')
      });
  }

  delete(persona: Persona): void {
    if (!confirm(`Deseja excluir a pessoa "${persona.name}"?`)) {
      return;
    }

    this.adminPersonasApiService.delete(persona.id).subscribe({
      next: () => this.loadData(),
      error: () => alert('Nao foi possivel excluir a pessoa.')
    });
  }

  private loadData(): void {
    this.isLoading = true;
    forkJoin({
      personas: this.adminPersonasApiService.getAll(),
      churches: this.adminChurchesApiService.getAll(),
      personaTypes: this.metadataApiService.getPersonaTypesCached(),
      maritalStatuses: this.metadataApiService.getMaritalStatusesCached()
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ personas, churches, personaTypes, maritalStatuses }) => {
          this.personas = personas;
          this.churches = churches;
          this.personaTypes = personaTypes;
          this.maritalStatuses = maritalStatuses;
        },
        error: () => alert('Nao foi possivel carregar as pessoas.')
      });
  }

  private normalizeOptionalValue(value: string | null | undefined): string | null {
    const trimmedValue = value?.trim() ?? '';
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private onlyDigits(value: string | null | undefined): string {
    return value?.replace(/\D/g, '') ?? '';
  }
}
