import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  format?: (value: any) => string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th *ngFor="let col of columns" [style.width]="col.width">
              {{ col.label }}
            </th>
            <th *ngIf="actions">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of data; let last = last" [class.last-row]="last">
            <td *ngFor="let col of columns">
              {{ formatCellValue(item, col) }}
            </td>
            <td *ngIf="actions" class="actions-cell">
              <ng-content></ng-content>
            </td>
          </tr>
          <tr *ngIf="data.length === 0">
            <td [attr.colspan]="columns.length + (actions ? 1 : 0)" class="empty-state">
              {{ emptyMessage }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .table-wrapper {
      border: 1px solid #d0d9e4;
      border-radius: 10px;
      overflow: hidden;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
    }

    thead {
      background: #f4f8fc;
    }

    th,
    td {
      text-align: left;
      padding: 14px 16px;
      border-bottom: 1px solid #e0e7f1;
      color: #102b4f;
      font-size: 16px;
    }

    th {
      color: #536b89;
      font-weight: 700;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    .actions-cell {
      display: flex;
      gap: 8px;
      padding: 10px 16px;
    }

    .empty-state {
      text-align: center;
      color: #5d7593;
      font-size: 14px;
      padding: 32px !important;
    }

    @media (max-width: 768px) {
      th,
      td {
        padding: 12px 10px;
        font-size: 14px;
      }

      .actions-cell {
        gap: 6px;
        padding: 10px 8px;
      }
    }

    @media (max-width: 480px) {
      th,
      td {
        padding: 10px 8px;
        font-size: 13px;
      }

      th {
        font-size: 12px;
      }

      .actions-cell {
        gap: 4px;
        padding: 8px 6px;
      }
    }
  `]
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions = true;
  @Input() emptyMessage = 'Nenhum registro encontrado.';

  formatCellValue(item: any, column: TableColumn): string {
    const value = item[column.key];
    if (column.format) {
      return column.format(value);
    }
    return value ?? '-';
  }
}
