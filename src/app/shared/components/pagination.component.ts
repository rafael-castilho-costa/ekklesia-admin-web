import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <nav class="pagination" *ngIf="totalItems > 0" aria-label="Paginacao">
      <div class="pagination-spacer"></div>

      <div class="pagination-controls">
        <label class="page-size">
          <span>Itens por pagina</span>
          <select [ngModel]="pageSize" (ngModelChange)="changePageSize($event)">
            <option *ngFor="let option of pageSizeOptions" [ngValue]="option">{{ option }}</option>
          </select>
        </label>

        <div class="pagination-actions">
          <button type="button" class="page-button" (click)="goToPage(1)" [disabled]="currentPage <= 1" aria-label="Primeira pagina">
            <mat-icon>first_page</mat-icon>
          </button>
          <button type="button" class="page-button" (click)="goToPage(currentPage - 1)" [disabled]="currentPage <= 1" aria-label="Pagina anterior">
            <mat-icon>chevron_left</mat-icon>
          </button>

          <span class="page-indicator">Pagina {{ currentPage }} de {{ totalPages }}</span>

          <button type="button" class="page-button" (click)="goToPage(currentPage + 1)" [disabled]="currentPage >= totalPages" aria-label="Proxima pagina">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <button type="button" class="page-button" (click)="goToPage(totalPages)" [disabled]="currentPage >= totalPages" aria-label="Ultima pagina">
            <mat-icon>last_page</mat-icon>
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
    }

    .pagination {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 14px 0 0;
      color: #435b78;
      font-size: 14px;
    }

    .page-indicator {
      font-weight: 600;
      white-space: nowrap;
    }

    .pagination-spacer {
      flex: 1 1 auto;
    }

    .pagination-controls {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 28px;
      margin-left: auto;
    }

    .page-size {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    .page-size select {
      height: 34px;
      border: 1px solid #cbd6e3;
      border-radius: 8px;
      padding: 0 8px;
      background: #ffffff;
      color: #102b4f;
      font-size: 14px;
      outline: none;
    }

    .pagination-actions {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .page-button {
      width: 34px;
      height: 34px;
      border: 1px solid #cbd6e3;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: #ffffff;
      color: #123566;
      cursor: pointer;
    }

    .page-button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }

    .page-button .mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    @media (max-width: 640px) {
      .pagination,
      .pagination-actions,
      .pagination-controls {
        justify-content: center;
      }

      .pagination,
      .pagination-controls {
        flex-direction: column;
      }
    }
  `]
})
export class PaginationComponent {
  @Input() totalItems = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [10, 25, 50];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get currentPage(): number {
    return Math.min(Math.max(1, this.page), this.totalPages);
  }

  get firstItem(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get lastItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  goToPage(page: number): void {
    const nextPage = Math.min(Math.max(1, page), this.totalPages);

    if (nextPage !== this.page) {
      this.pageChange.emit(nextPage);
    }
  }

  changePageSize(pageSize: number): void {
    this.pageSizeChange.emit(Number(pageSize));
    this.pageChange.emit(1);
  }
}
