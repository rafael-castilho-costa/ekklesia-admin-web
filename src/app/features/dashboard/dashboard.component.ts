import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { PermissionService } from '../../core/auth/permission.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { PersonasApiService } from '../../core/api/personas-api.service';
import { MembersApiService } from '../../core/api/members-api.service';
import { FinanceApiService } from '../../core/api/finance-api.service';
import { FinanceTransaction, FinanceTransactionType } from '../../shared/models/api.models';
import { formatCurrency } from '../../shared/utils/format.utils';

interface DashboardMetric {
  title: string;
  icon: string;
  value: string | number;
  change: string;
  note: string;
}

interface MonthlyCashFlow {
  label: string;
  income: number;
  expense: number;
}

interface WeeklyCashFlow {
  label: string;
  income: number;
  expense: number;
}

interface CategoryBreakdown {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="dashboard-layout">
      <p *ngIf="pageErrorMessage" class="feedback-message error">{{ pageErrorMessage }}</p>

      <div class="greeting-card">
        <h1>Bem-vindo, {{ session?.name }}!</h1>
        <p class="subtitle">{{ session?.churchName }}</p>
      </div>

      <div class="metrics-grid">
        <article class="metric-card" *ngFor="let metric of visibleMetrics">
          <div class="metric-header">
            <span>{{ metric.title }}</span>
            <div class="metric-icon">
              <mat-icon>{{ metric.icon }}</mat-icon>
            </div>
          </div>
          <strong class="metric-value">{{ metric.value }}</strong>
          <p class="metric-change">{{ metric.change }}</p>
          <p class="metric-note">{{ metric.note }}</p>
        </article>
      </div>

      <div class="charts-grid" *ngIf="canAccessFinance">
        <section class="chart-panel" *ngIf="canAccessFinance">
          <h2>Comparativo Mensal</h2>
          <div class="cash-flow-chart">
            <div class="month-group" *ngFor="let item of monthlyCashFlow">
              <div class="month-bars">
                <span class="bar income" [style.height.%]="cashFlowBarHeight(item.income, maxMonthlyCashFlow)"></span>
                <span class="bar expense" [style.height.%]="cashFlowBarHeight(item.expense, maxMonthlyCashFlow)"></span>
              </div>
              <span class="month-label">{{ item.label }}</span>
            </div>
          </div>

          <div class="chart-legend">
            <span><i class="legend-color income"></i>Entradas</span>
            <span><i class="legend-color expense"></i>Saidas</span>
          </div>
        </section>

        <section class="chart-panel" *ngIf="canAccessFinance">
          <h2>Comparativo Semanal</h2>
          <div class="cash-flow-chart weekly-chart">
            <div class="month-group" *ngFor="let item of weeklyCashFlow">
              <div class="month-bars">
                <span class="bar income" [style.height.%]="cashFlowBarHeight(item.income, maxWeeklyCashFlow)"></span>
                <span class="bar expense" [style.height.%]="cashFlowBarHeight(item.expense, maxWeeklyCashFlow)"></span>
              </div>
              <span class="month-label">{{ item.label }}</span>
            </div>
          </div>

          <div class="chart-legend">
            <span><i class="legend-color income"></i>Entradas</span>
            <span><i class="legend-color expense"></i>Saidas</span>
          </div>
        </section>

        <section class="chart-panel category-panel" *ngIf="canAccessFinance">
          <h2>Entradas por Categoria</h2>
          <div class="category-content">
            <div class="donut-chart" [style.background]="incomeCategoryGradient">
              <div class="donut-hole"></div>
              <span *ngIf="incomeCategories.length === 0" class="donut-empty">Sem entradas</span>
            </div>

            <div class="category-list">
              <div class="category-item" *ngFor="let category of incomeCategories">
                <span class="category-dot" [style.background]="category.color"></span>
                <span class="category-name">{{ category.name }}</span>
                <strong>{{ category.percentage }}%</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="chart-panel category-panel" *ngIf="canAccessFinance">
          <h2>Saidas por Categoria</h2>
          <div class="category-content">
            <div class="donut-chart" [style.background]="expenseCategoryGradient">
              <div class="donut-hole"></div>
              <span *ngIf="expenseCategories.length === 0" class="donut-empty">Sem saidas</span>
            </div>

            <div class="category-list">
              <div class="category-item" *ngFor="let category of expenseCategories">
                <span class="category-dot" [style.background]="category.color"></span>
                <span class="category-name">{{ category.name }}</span>
                <strong>{{ category.percentage }}%</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .dashboard-layout {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .greeting-card {
      background: linear-gradient(135deg, #071f4a 0%, #1b3d72 100%);
      color: #ffffff;
      padding: 32px;
      border-radius: 14px;
      box-shadow: 0 4px 15px rgba(7, 31, 74, 0.2);
    }

    .greeting-card h1 {
      margin: 0 0 8px;
      font-size: 2rem;
      font-weight: 700;
    }

    .subtitle {
      margin: 0;
      font-size: 1rem;
      opacity: 0.9;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(200px, 1fr));
      gap: 16px;
    }

    .metric-card,
    .chart-panel,
    .alerts-panel {
      background: #ffffff;
      border: 1px solid #d8dee8;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(14, 34, 65, 0.05);
    }

    .metric-card {
      position: relative;
      padding: 20px;
      overflow: hidden;
    }

    .metric-card::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: #f3a32f;
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .metric-header span {
      color: #4c607e;
      font-size: 16px;
    }

    .metric-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: #edf2f7;
      color: #0d376d;
      flex: 0 0 auto;
    }

    .metric-value {
      display: block;
      font-size: 36px;
      line-height: 1.1;
      color: #091e3d;
      margin-bottom: 4px;
    }

    .metric-note {
      color: #5d7392;
      margin: 6px 0 0;
      font-size: 14px;
    }

    .metric-change {
      color: #28a745;
      font-size: 13px;
      font-weight: 600;
      margin: 0 0 4px;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .chart-panel,
    .alerts-panel {
      padding: 24px;
    }

    .chart-panel h2,
    .alerts-panel h2 {
      margin: 0 0 20px;
      color: #0e2241;
      font-size: 18px;
    }

    .cash-flow-chart {
      height: 260px;
      display: grid;
      grid-template-columns: repeat(6, minmax(42px, 1fr));
      gap: 16px;
      align-items: end;
      padding: 16px 4px 0;
      border-bottom: 1px solid #d8dee8;
    }

    .weekly-chart {
      grid-template-columns: repeat(6, minmax(48px, 1fr));
    }

    .month-group {
      height: 100%;
      min-width: 0;
      display: grid;
      grid-template-rows: 1fr auto;
      gap: 10px;
      align-items: end;
      justify-items: center;
    }

    .month-bars {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: end;
      justify-content: center;
      gap: 6px;
    }

    .bar {
      width: min(18px, 38%);
      min-height: 0;
      border-radius: 6px 6px 0 0;
      transition: height 180ms ease;
    }

    .bar.income {
      background: #05a56a;
    }

    .bar.expense {
      background: #cf3548;
    }

    .month-label {
      color: #5d7392;
      font-size: 12px;
      text-transform: capitalize;
      white-space: nowrap;
    }

    .chart-legend {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-top: 16px;
      color: #4c607e;
      font-size: 13px;
    }

    .chart-legend span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .legend-color {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      display: inline-block;
    }

    .legend-color.income {
      background: #05a56a;
    }

    .legend-color.expense {
      background: #cf3548;
    }

    .category-panel {
      min-height: 360px;
    }

    .category-content {
      display: grid;
      grid-template-columns: minmax(180px, 220px) 1fr;
      gap: 20px;
      align-items: center;
    }

    .donut-chart {
      position: relative;
      width: min(220px, 100%);
      aspect-ratio: 1;
      border-radius: 50%;
      display: grid;
      place-items: center;
      justify-self: center;
    }

    .donut-hole {
      width: 58%;
      aspect-ratio: 1;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: inset 0 0 0 1px #d8dee8;
    }

    .donut-empty {
      position: absolute;
      color: #607792;
      font-size: 13px;
      font-weight: 700;
    }

    .category-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }

    .category-item {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      color: #314965;
      font-size: 14px;
    }

    .category-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
    }

    .category-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .category-item strong {
      color: #0e2241;
      font-size: 13px;
    }

    .feedback-message {
      border-radius: 8px;
      padding: 12px 14px;
      font-weight: 600;
    }

    .feedback-message.error {
      border: 1px solid #f4b8c2;
      background: #fff0f2;
      color: #c42f43;
    }

    @media (max-width: 1200px) {
      .metrics-grid,
      .charts-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 768px) {
      .metrics-grid,
      .charts-grid {
        grid-template-columns: 1fr;
      }

      .greeting-card {
        padding: 20px;
      }

      .greeting-card h1 {
        font-size: 1.5rem;
      }

      .cash-flow-chart {
        gap: 10px;
        overflow-x: auto;
      }

      .category-content {
        grid-template-columns: 1fr;
      }

      .donut-chart {
        max-width: 190px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly tenantContextService = inject(TenantContextService);
  private readonly permissionService = inject(PermissionService);
  private readonly personasApiService = inject(PersonasApiService);
  private readonly membersApiService = inject(MembersApiService);
  private readonly financeApiService = inject(FinanceApiService);

  readonly categoryColors = ['#132f5f', '#1783df', '#05a56a', '#eba43b', '#7b61ff', '#cf3548'];

  personasCount = 0;
  membersCount = 0;
  financeTransactions: FinanceTransaction[] = [];
  pageErrorMessage: string | null = null;

  protected get session() {
    return this.authSessionService.getSession()?.user;
  }

  protected get canViewMembers(): boolean {
    return this.permissionService.canViewMembers();
  }

  protected get canViewPersonas(): boolean {
    return this.permissionService.canViewPersonas();
  }

  protected get canAccessFinance(): boolean {
    return this.permissionService.canAccessFinance();
  }

  protected get visibleMetrics(): DashboardMetric[] {
    const metrics: DashboardMetric[] = [];

    if (this.canViewMembers) {
      metrics.push({
        title: 'Membros Ativos',
        icon: 'people',
        value: this.membersCount,
        change: 'Total atual',
        note: 'Cadastrados no sistema'
      });
    }

    if (this.canViewPersonas) {
      metrics.push({
        title: 'Pessoas Cadastradas',
        icon: 'person',
        value: this.personasCount,
        change: 'Total atual',
        note: 'Registradas no sistema'
      });
    }

    if (this.canAccessFinance) {
      metrics.push({
        title: 'Saldo Atual',
        icon: 'attach_money',
        value: this.currentBalance,
        change: this.financeTransactions.length ? `${this.financeTransactions.length} lancamentos` : 'Sem lancamentos',
        note: 'Saldo financeiro'
      });
    }

    return metrics;
  }

  protected get monthlyCashFlow(): MonthlyCashFlow[] {
    const now = new Date();

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const transactions = this.financeTransactions.filter((transaction) => {
        const transactionDate = this.parseLocalDate(transaction.transactionDate);
        return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
      });

      return {
        label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        income: this.sumByType(transactions, 'INCOME'),
        expense: this.sumByType(transactions, 'EXPENSE')
      };
    });
  }

  protected get weeklyCashFlow(): WeeklyCashFlow[] {
    const currentWeekStart = this.startOfWeek(new Date());

    return Array.from({ length: 6 }, (_, index) => {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - (5 - index) * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const transactions = this.financeTransactions.filter((transaction) => {
        const transactionDate = this.parseLocalDate(transaction.transactionDate);
        return transactionDate >= weekStart && transactionDate <= weekEnd;
      });

      return {
        label: this.formatWeekLabel(weekStart),
        income: this.sumByType(transactions, 'INCOME'),
        expense: this.sumByType(transactions, 'EXPENSE')
      };
    });
  }

  protected get maxMonthlyCashFlow(): number {
    const values = this.monthlyCashFlow.flatMap((item) => [item.income, item.expense]);
    return Math.max(1, ...values);
  }

  protected get maxWeeklyCashFlow(): number {
    const values = this.weeklyCashFlow.flatMap((item) => [item.income, item.expense]);
    return Math.max(1, ...values);
  }

  protected get incomeCategories(): CategoryBreakdown[] {
    return this.buildCategoryBreakdown('INCOME');
  }

  protected get expenseCategories(): CategoryBreakdown[] {
    return this.buildCategoryBreakdown('EXPENSE');
  }

  protected get incomeCategoryGradient(): string {
    return this.buildCategoryGradient(this.incomeCategories);
  }

  protected get expenseCategoryGradient(): string {
    return this.buildCategoryGradient(this.expenseCategories);
  }

  protected cashFlowBarHeight(value: number, maxValue: number): number {
    return Math.max((value / maxValue) * 100, value > 0 ? 4 : 0);
  }

  ngOnInit(): void {
    this.syncChurchContext();
    this.loadCounts();
  }

  private loadCounts(): void {
    this.pageErrorMessage = null;

    if (this.canViewPersonas) {
      this.personasApiService.getAll().subscribe({
        next: (personas) => {
          this.personasCount = personas.length;
        },
        error: () => {
          this.pageErrorMessage = 'Nao foi possivel carregar o indicador de pessoas.';
        }
      });
    }

    if (this.canViewMembers) {
      this.membersApiService.getAll().subscribe({
        next: (members) => {
          this.membersCount = members.length;
        },
        error: () => {
          this.pageErrorMessage = 'Nao foi possivel carregar o indicador de membros.';
        }
      });
    }

    if (this.canAccessFinance) {
      this.financeApiService.getAll().subscribe({
        next: (transactions) => {
          this.financeTransactions = transactions;
        },
        error: () => {
          this.pageErrorMessage = 'Nao foi possivel carregar os indicadores financeiros.';
        }
      });
    }
  }

  private get currentBalance(): string {
    return formatCurrency(
      this.sumByType(this.financeTransactions, 'INCOME') -
      this.sumByType(this.financeTransactions, 'EXPENSE')
    );
  }

  private sumByType(transactions: FinanceTransaction[], type: FinanceTransactionType): number {
    return transactions
      .filter((transaction) => transaction.type === type)
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  private buildCategoryBreakdown(type: FinanceTransactionType): CategoryBreakdown[] {
    const transactions = this.financeTransactions.filter((transaction) => transaction.type === type);
    const total = this.sumByType(transactions, type);

    if (!total) {
      return [];
    }

    const grouped = transactions.reduce<Record<string, number>>((acc, transaction) => {
      const category = transaction.category || 'Sem categoria';
      acc[category] = (acc[category] ?? 0) + transaction.amount;
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: Math.round((amount / total) * 100),
        color: this.categoryColors[index % this.categoryColors.length]
      }));
  }

  private buildCategoryGradient(categories: CategoryBreakdown[]): string {
    if (!categories.length) {
      return 'conic-gradient(#dbe4ef 0% 100%)';
    }

    let accumulated = 0;
    const slices = categories.map((category, index) => {
      const start = accumulated;
      const end = index === categories.length - 1 ? 100 : accumulated + category.percentage;
      accumulated = end;
      return `${category.color} ${start}% ${end}%`;
    });

    return `conic-gradient(${slices.join(', ')})`;
  }

  private parseLocalDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private startOfWeek(date: Date): Date {
    const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = weekStart.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + offset);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  private formatWeekLabel(date: Date): string {
    return `Sem ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
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
