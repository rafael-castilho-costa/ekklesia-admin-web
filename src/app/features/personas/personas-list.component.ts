import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PersonasApiService } from '../../core/api/personas-api.service';
import { PermissionService } from '../../core/auth/permission.service';
import { Persona } from '../../shared/models/api.models';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-personas-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, MatButtonModule, DataTableComponent],
  template: `
    <section class="list-page">
      <div class="page-header">
        <div>
          <h1>Pessoas</h1>
          <p class="subtitle">Gerenciar pessoas cadastradas no sistema</p>
        </div>
        <button
          *ngIf="canManagePersonas"
          [routerLink]="['/personas/new']"
          mat-raised-button
          color="primary"
          class="new-button"
        >
          <mat-icon>add</mat-icon>
          Nova Pessoa
        </button>
      </div>

      <div class="filters-row" *ngIf="personas.length > 0">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="filterPersonas()"
          >
        </div>
      </div>

      <div class="table-panel">
        <app-data-table
          [columns]="columns"
          [data]="filteredPersonas"
          [emptyMessage]="'Nenhuma pessoa encontrada'"
        >
          <ng-container *ngFor="let persona of filteredPersonas">
            <button
              *ngIf="canManagePersonas"
              [routerLink]="['/personas', persona.id, 'edit']"
              mat-icon-button
              title="Editar"
              class="action-button"
            >
              <mat-icon>edit</mat-icon>
            </button>
            <button
              *ngIf="canManagePersonas"
              (click)="delete(persona)"
              mat-icon-button
              title="Deletar"
              class="action-button danger"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </ng-container>
        </app-data-table>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .list-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .page-header h1 {
      margin: 0 0 4px;
      font-size: 28px;
      color: #0e2241;
    }

    .subtitle {
      margin: 0;
      color: #5d7392;
      font-size: 14px;
    }

    .new-button {
      white-space: nowrap;
    }

    .filters-row {
      display: flex;
      gap: 12px;
    }

    .search-box {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid #d0d9e4;
      border-radius: 8px;
      padding: 10px 12px;
      background: #f8fbff;
    }

    .search-box ::ng-deep .mat-icon {
      color: #607792;
    }

    .search-box input {
      width: 100%;
      border: none;
      background: transparent;
      color: #102b4f;
      font-size: 15px;
      outline: none;
    }

    .table-panel {
      background: #ffffff;
      border: 1px solid #d8dee8;
      border-radius: 12px;
      padding: 16px;
    }

    .action-button {
      width: 36px;
      height: 36px;
    }

    .action-button.danger ::ng-deep .mat-icon {
      color: #e53749;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
      }

      .new-button {
        width: 100%;
      }
    }
  `]
})
export class PersonasListComponent implements OnInit {
  private readonly personasApiService = inject(PersonasApiService);
  protected readonly permissionService = inject(PermissionService);

  personas: Persona[] = [];
  filteredPersonas: Persona[] = [];
  searchTerm = '';
  canManagePersonas = this.permissionService.canManagePersonas();

  columns: TableColumn[] = [
    { key: 'name', label: 'Nome', width: '35%' },
    { key: 'email', label: 'Email', width: '30%' },
    { key: 'phone', label: 'Telefone', width: '20%' },
    { key: 'personaType', label: 'Tipo', width: '15%' }
  ];

  ngOnInit(): void {
    this.loadPersonas();
  }

  private loadPersonas(): void {
    this.personasApiService.getAll().subscribe({
      next: (personas) => {
        this.personas = personas;
        this.filteredPersonas = personas;
      },
      error: (error) => {
        console.error('Erro ao carregar pessoas:', error);
      }
    });
  }

  filterPersonas(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPersonas = this.personas;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredPersonas = this.personas.filter(persona =>
      persona.name.toLowerCase().includes(term) ||
      persona.email.toLowerCase().includes(term)
    );
  }

  delete(persona: Persona): void {
    if (confirm(`Deseja deletar a pessoa "${persona.name}"?`)) {
      this.personasApiService.delete(persona.id).subscribe({
        next: () => {
          this.personas = this.personas.filter(p => p.id !== persona.id);
          this.filterPersonas();
        },
        error: (error) => {
          console.error('Erro ao deletar:', error);
          alert('Erro ao deletar a pessoa');
        }
      });
    }
  }
}
