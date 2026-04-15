import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MembersApiService } from '../../core/api/members-api.service';
import { PermissionService } from '../../core/auth/permission.service';
import { Member } from '../../shared/models/api.models';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table.component';

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, MatButtonModule, DataTableComponent],
  template: `
    <section class="list-page">
      <div class="page-header">
        <div>
          <h1>Membros</h1>
          <p class="subtitle">Gerenciar membros da igreja</p>
        </div>
        <button
          *ngIf="canManageMembers"
          [routerLink]="['/members/new']"
          mat-raised-button
          color="primary"
          class="new-button"
        >
          <mat-icon>add</mat-icon>
          Novo Membro
        </button>
      </div>

      <div class="filters-row" *ngIf="members.length > 0">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input
            type="text"
            placeholder="Buscar por nome..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="filterMembers()"
          >
        </div>
      </div>

      <div class="table-panel">
        <app-data-table
          [columns]="columns"
          [data]="filteredMembers"
          [emptyMessage]="'Nenhum membro encontrado'"
        >
          <ng-container *ngFor="let member of filteredMembers">
            <button
              *ngIf="canManageMembers"
              [routerLink]="['/members', member.id, 'edit']"
              mat-icon-button
              title="Editar"
              class="action-button"
            >
              <mat-icon>edit</mat-icon>
            </button>
            <button
              *ngIf="canManageMembers"
              (click)="delete(member)"
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
export class MembersListComponent implements OnInit {
  private readonly membersApiService = inject(MembersApiService);
  protected readonly permissionService = inject(PermissionService);

  members: Member[] = [];
  filteredMembers: Member[] = [];
  searchTerm = '';
  canManageMembers = this.permissionService.canManageMembers();

  columns: TableColumn[] = [
    { key: 'persona.name', label: 'Nome', width: '35%',  format: (value) => value || '-' },
    { key: 'ministry', label: 'Ministério', width: '25%' },
    { key: 'statusMember', label: 'Status', width: '20%' },
    { key: 'membershipDate', label: 'Data de Membresia', width: '20%' }
  ];

  ngOnInit(): void {
    this.loadMembers();
  }

  private loadMembers(): void {
    this.membersApiService.getAll().subscribe({
      next: (members) => {
        this.members = members;
        this.filteredMembers = members;
      },
      error: (error) => {
        console.error('Erro ao carregar membros:', error);
      }
    });
  }

  filterMembers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredMembers = this.members;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredMembers = this.members.filter(member =>
      member.persona?.name.toLowerCase().includes(term) || false
    );
  }

  delete(member: Member): void {
    const memberName = member.persona?.name || 'este membro';
    if (confirm(`Deseja deletar o membro "${memberName}"?`)) {
      this.membersApiService.delete(member.id).subscribe({
        next: () => {
          this.members = this.members.filter(m => m.id !== member.id);
          this.filterMembers();
        },
        error: (error) => {
          console.error('Erro ao deletar:', error);
          alert('Erro ao deletar o membro');
        }
      });
    }
  }
}
