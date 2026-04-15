import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChurchesApiService } from '../../core/api/churches-api.service';
import { PermissionService } from '../../core/auth/permission.service';
import { Church } from '../../shared/models/api.models';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-churches-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, MatButtonModule, DataTableComponent],
  template: `
    <section class="list-page">
      <div class="page-header">
        <div>
          <h1>Igrejas</h1>
          <p class="subtitle">Gerenciar igrejas cadastradas no sistema</p>
        </div>
        <button
          *ngIf="canManageChurches"
          [routerLink]="['/churches/new']"
          mat-raised-button
          color="primary"
          class="new-button"
        >
          <mat-icon>add</mat-icon>
          Nova Igreja
        </button>
      </div>

      <div class="filters-row" *ngIf="churches.length > 0">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input
            type="text"
            placeholder="Buscar por nome ou cidade..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="filterChurches()"
          >
        </div>
      </div>

      <div class="table-panel">
        <app-data-table
          [columns]="columns"
          [data]="filteredChurches"
          [emptyMessage]="'Nenhuma igreja encontrada'"
        >
          <ng-container *ngFor="let church of filteredChurches">
            <button
              *ngIf="canManageChurches"
              [routerLink]="['/churches', church.id, 'edit']"
              mat-icon-button
              title="Editar"
              class="action-button"
            >
              <mat-icon>edit</mat-icon>
            </button>
            <button
              *ngIf="canManageChurches"
              (click)="delete(church)"
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
export class ChurchesListComponent implements OnInit {
  private readonly churchesApiService = inject(ChurchesApiService);
  protected readonly permissionService = inject(PermissionService);

  churches: Church[] = [];
  filteredChurches: Church[] = [];
  searchTerm = '';
  canManageChurches = this.permissionService.canManageChurches();

  columns: TableColumn[] = [
    { key: 'name', label: 'Nome', width: '40%' },
    { key: 'cnpj', label: 'CNPJ', width: '25%' },
    { key: 'city', label: 'Cidade', width: '20%' },
    { key: 'state', label: 'Estado', width: '15%' }
  ];

  ngOnInit(): void {
    this.loadChurches();
  }

  private loadChurches(): void {
    this.churchesApiService.getAll().subscribe({
      next: (churches) => {
        this.churches = churches;
        this.filteredChurches = churches;
      },
      error: (error) => {
        console.error('Erro ao carregar igrejas:', error);
      }
    });
  }

  filterChurches(): void {
    if (!this.searchTerm.trim()) {
      this.filteredChurches = this.churches;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredChurches = this.churches.filter(church =>
      church.name.toLowerCase().includes(term) ||
      church.city.toLowerCase().includes(term)
    );
  }

  delete(church: Church): void {
    if (confirm(`Deseja deletar a igreja "${church.name}"?`)) {
      this.churchesApiService.delete(church.id).subscribe({
        next: () => {
          this.churches = this.churches.filter(c => c.id !== church.id);
          this.filterChurches();
        },
        error: (error) => {
          console.error('Erro ao deletar:', error);
          alert('Erro ao deletar a igreja');
        }
      });
    }
  }
}
