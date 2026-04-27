import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { FinanceApiService, FinanceTransactionFilters } from '../../core/api/finance-api.service';
import {
  FinanceTransaction,
  FinanceTransactionRequest,
  FinanceTransactionType
} from '../../shared/models/api.models';
import { resolveApiErrorMessage } from '../../shared/utils/api-error.utils';
import { formatCurrency, formatIsoDateToBr, todayIsoDate } from '../../shared/utils/format.utils';

interface ComparativoMensal {
  mes: string;
  entradas: number;
  saidas: number;
}

interface CategoriaEntrada {
  nome: string;
  valor: number;
  cor: string;
  classe: string;
}

@Component({
  standalone: true,
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule]
})
export class FinanceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly financeApiService = inject(FinanceApiService);

  readonly escalaComparativo = 60000;
  readonly categoryColors = ['#132f5f', '#1783df', '#05a56a', '#eba43b', '#7b61ff', '#cf3548'];

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

  get comparativoMensal(): ComparativoMensal[] {
    const now = new Date();

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthTransactions = this.transactions.filter((transaction) => {
        const transactionDate = this.parseLocalDate(transaction.transactionDate);
        return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
      });

      return {
        mes: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        entradas: this.sumByType(monthTransactions, 'INCOME'),
        saidas: this.sumByType(monthTransactions, 'EXPENSE')
      };
    });
  }

  get categoriasEntrada(): CategoriaEntrada[] {
    const incomeTransactions = this.filteredTransactions.filter((transaction) => transaction.type === 'INCOME');
    const total = this.sumByType(incomeTransactions, 'INCOME');

    if (!total) {
      return [];
    }

    const grouped = incomeTransactions.reduce<Record<string, number>>((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount;
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .map(([nome, amount], index) => ({
        nome,
        valor: Math.round((amount / total) * 100),
        cor: this.categoryColors[index % this.categoryColors.length],
        classe: `label-${index}`
      }));
  }

  get donutGradient(): string {
    if (!this.categoriasEntrada.length) {
      return 'conic-gradient(#dbe4ef 0% 100%)';
    }

    let acumulado = 0;
    const fatias = this.categoriasEntrada.map((categoria, index) => {
      const inicio = acumulado;
      const fim = index === this.categoriasEntrada.length - 1 ? 100 : acumulado + categoria.valor;
      acumulado = fim;
      return `${categoria.cor} ${inicio}% ${fim}%`;
    });

    return `conic-gradient(${fatias.join(', ')})`;
  }

  get maxComparativo(): number {
    const valores = this.comparativoMensal.flatMap((item) => [item.entradas, item.saidas]);
    return Math.max(this.escalaComparativo, ...valores);
  }

  onFiltroChange(): void {
    this.loadTransactions();
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

  alturaBarra(valor: number): number {
    return Math.max((valor / this.maxComparativo) * 100, valor > 0 ? 4 : 0);
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

  private parseLocalDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private today(): string {
    return todayIsoDate();
  }

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    return resolveApiErrorMessage(error, fallbackMessage);
  }
}
