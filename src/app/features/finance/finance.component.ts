import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { FinanceApiService, FinanceTransactionFilters } from '../../core/api/finance-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import {
  FinanceTransaction,
  FinanceTransactionRequest,
  FinanceTransactionType
} from '../../shared/models/api.models';
import { resolveApiErrorMessage } from '../../shared/utils/api-error.utils';
import { formatCurrency, formatIsoDateToBr, todayIsoDate } from '../../shared/utils/format.utils';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  standalone: true,
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, PaginationComponent]
})
export class FinanceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly tenantContextService = inject(TenantContextService);
  private readonly financeApiService = inject(FinanceApiService);

  transactions: FinanceTransaction[] = [];
  filtroTipo: 'todos' | FinanceTransactionType = 'todos';
  filtroCategoria = '';
  filtroPagamento = '';
  filtroDataInicio = '';
  filtroDataFim = '';
  isLoading = false;
  isSubmitting = false;
  isModalOpen = false;
  pageErrorMessage: string | null = null;
  submitErrorMessage: string | null = null;
  page = 1;
  pageSize = 10;

  readonly launchForm = this.fb.group({
    type: ['INCOME' as FinanceTransactionType, [Validators.required]],
    category: ['', [Validators.required]],
    description: ['', [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    transactionDate: ['', [Validators.required]],
    paymentMethod: ['', [Validators.required]],
    notes: ['']
  });

  ngOnInit(): void {
    this.syncChurchContext();
    this.loadTransactions();
  }

  get totalEntradas(): number {
    return this.filteredTransactions
      .filter((transaction) => transaction.type === 'INCOME')
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  get totalSaidas(): number {
    return this.filteredTransactions
      .filter((transaction) => transaction.type === 'EXPENSE')
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  get saldoAtual(): number {
    return this.totalEntradas - this.totalSaidas;
  }

  get filteredTransactions(): FinanceTransaction[] {
    return this.transactions;
  }

  get lancamentosFiltrados(): FinanceTransaction[] {
    return [...this.filteredTransactions].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  }

  get lancamentosPaginados(): FinanceTransaction[] {
    const start = (this.page - 1) * this.pageSize;
    return this.lancamentosFiltrados.slice(start, start + this.pageSize);
  }

  onFiltroChange(): void {
    this.page = 1;
    this.loadTransactions();
  }

  onPageChange(page: number): void {
    this.page = page;
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.pageErrorMessage = null;

    this.financeApiService
      .getAll(this.buildBackendFilters())
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.page = 1;
        },
        error: (error) => {
          this.pageErrorMessage = this.resolveErrorMessage(error, 'Nao foi possivel carregar os lancamentos financeiros.');
        }
      });
  }

  novoLancamento(): void {
    this.submitErrorMessage = null;
    this.launchForm.reset({
      type: 'INCOME',
      category: '',
      description: '',
      amount: null,
      transactionDate: this.today(),
      paymentMethod: '',
      notes: ''
    });
    this.isModalOpen = true;
  }

  fecharModal(): void {
    this.isModalOpen = false;
    this.submitErrorMessage = null;
  }

  salvarLancamento(): void {
    this.submitErrorMessage = null;

    if (this.launchForm.invalid) {
      this.launchForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.financeApiService
      .create(this.buildTransactionRequest())
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.fecharModal();
          this.loadTransactions();
        },
        error: (error) => {
          this.submitErrorMessage = this.resolveErrorMessage(error, 'Nao foi possivel salvar o lancamento.');
        }
      });
  }

  limparFiltros(): void {
    this.filtroTipo = 'todos';
    this.filtroCategoria = '';
    this.filtroPagamento = '';
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.loadTransactions();
  }

  tipoIcone(tipo: FinanceTransactionType): string {
    return tipo === 'INCOME' ? 'trending_up' : 'trending_down';
  }

  tipoClasse(tipo: FinanceTransactionType): string {
    return tipo === 'INCOME' ? 'tipo-entrada' : 'tipo-saida';
  }

  tipoLabel(tipo: FinanceTransactionType): string {
    return tipo === 'INCOME' ? 'Entrada' : 'Saida';
  }

  categoriaClasse(categoria: string): string {
    const normalizado = categoria.toLowerCase();

    if (normalizado.includes('dizimo')) return 'tag-dizimos';
    if (normalizado.includes('oferta')) return 'tag-ofertas';
    if (normalizado.includes('evento')) return 'tag-eventos';
    if (normalizado.includes('doa')) return 'tag-doacoes';

    return 'tag-neutra';
  }

  valorFormatado(valor: number, tipo: FinanceTransactionType): string {
    const prefixo = tipo === 'INCOME' ? '+' : '-';
    return `${prefixo} ${this.formatarMoeda(valor)}`;
  }

  formatarMoeda(valor: number): string {
    return formatCurrency(valor);
  }

  formatarData(date: string): string {
    return formatIsoDateToBr(date);
  }

  trackByLancamento(_: number, lancamento: FinanceTransaction): number {
    return lancamento.id;
  }

  private buildTransactionRequest(): FinanceTransactionRequest {
    const formValue = this.launchForm.getRawValue();

    return {
      type: formValue.type || 'INCOME',
      description: formValue.description?.trim() || '',
      category: formValue.category?.trim() || '',
      paymentMethod: formValue.paymentMethod?.trim() || '',
      amount: Number(formValue.amount ?? 0),
      transactionDate: formValue.transactionDate || todayIsoDate(),
      notes: formValue.notes?.trim() || null
    };
  }

  private buildBackendFilters(): FinanceTransactionFilters {
    return {
      type: this.filtroTipo === 'todos' ? null : this.filtroTipo,
      category: this.filtroCategoria.trim() || null,
      paymentMethod: this.filtroPagamento.trim() || null,
      startDate: this.filtroDataInicio || null,
      endDate: this.filtroDataFim || null
    };
  }

  private sumByType(transactions: FinanceTransaction[], type: FinanceTransactionType): number {
    return transactions
      .filter((transaction) => transaction.type === type)
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  private today(): string {
    return todayIsoDate();
  }

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    return resolveApiErrorMessage(error, fallbackMessage);
  }

  private syncChurchContext(): void {
    const churchId =
      this.getRouteChurchId() ??
      this.authSessionService.getChurchIdHeaderValue() ??
      this.tenantContextService.getChurchId();

    if (churchId) {
      this.tenantContextService.setChurchId(churchId);
    }
  }

  private getRouteChurchId(): string | null {
    let currentRoute: ActivatedRoute | null = this.route;

    while (currentRoute) {
      const churchId = currentRoute.snapshot.paramMap.get('churchId');

      if (churchId) {
        return churchId;
      }

      currentRoute = currentRoute.parent;
    }

    return null;
  }
}
