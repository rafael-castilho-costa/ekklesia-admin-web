import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { PermissionService } from '../../core/auth/permission.service';
import { ChurchesApiService } from '../../core/api/churches-api.service';
import { PersonasApiService } from '../../core/api/personas-api.service';
import { MembersApiService } from '../../core/api/members-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <section class="dashboard-layout">
      <!-- SEÇÃO 1: MENSAGEM DE BOAS-VINDAS -->
      <div class="greeting-card">
        <h1>Bem-vindo, {{ session?.name }}!</h1>
        <p class="subtitle">{{ session?.churchName }}</p>
      </div>

      <!-- SEÇÃO 2: MÉTRICAS PRINCIPAIS -->
      <div class="metrics-grid">
        <article class="metric-card">
          <div class="metric-header">
            <span>Membros Ativos</span>
            <div class="metric-icon">
              <mat-icon>people</mat-icon>
            </div>
          </div>
          <strong class="metric-value">{{ membersCount }}</strong>
          <p class="metric-change">+3 este mês</p>
          <p class="metric-note">Cadastrados no sistema</p>
        </article>

        <article class="metric-card">
          <div class="metric-header">
            <span>Pessoas Cadastradas</span>
            <div class="metric-icon">
              <mat-icon>person</mat-icon>
            </div>
          </div>
          <strong class="metric-value">{{ personasCount }}</strong>
          <p class="metric-change">6 turmas</p>
          <p class="metric-note">Registradas no sistema</p>
        </article>

        <article class="metric-card">
          <div class="metric-header">
            <span>Saldo Atual</span>
            <div class="metric-icon">
              <mat-icon>attach_money</mat-icon>
            </div>
          </div>
          <strong class="metric-value">R$ 26.550</strong>
          <p class="metric-change">+12% vs mês anterior</p>
          <p class="metric-note">Saldo financeiro</p>
        </article>

        <article class="metric-card">
          <div class="metric-header">
            <span>Frequência</span>
            <div class="metric-icon">
              <mat-icon>assessment</mat-icon>
            </div>
          </div>
          <strong class="metric-value">76%</strong>
          <p class="metric-change">Média mensal</p>
          <p class="metric-note">Taxa de presença</p>
        </article>
      </div>

      <!-- SEÇÃO 3: GRÁFICOS -->
      <div class="charts-grid">
        <!-- GRÁFICO 1: FLUXO DE CAIXA -->
        <section class="chart-panel">
          <h2>Fluxo de Caixa Mensal</h2>
          <div class="chart-placeholder">
            <p>📊 Gráfico de Fluxo de Caixa</p>
            <small>(Integrará com dados reais)</small>
          </div>
        </section>

        <!-- GRÁFICO 2: CRESCIMENTO -->
        <section class="chart-panel">
          <h2>Crescimento de Membros</h2>
          <div class="chart-placeholder">
            <p>📈 Gráfico de Crescimento</p>
            <small>(Integrará com dados reais)</small>
          </div>
        </section>
      </div>

      <!-- SEÇÃO 4: ALERTAS E NOTIFICAÇÕES -->
      <section class="alerts-panel">
        <h2>Alertas e Notificações</h2>
        <div class="alerts-list">
          <div class="alert-item warning">
            <mat-icon>warning</mat-icon>
            <div>
              <strong>Pedro Henrique Rocha está afastado há 3 meses</strong>
            </div>
          </div>
          <div class="alert-item info">
            <mat-icon>info</mat-icon>
            <div>
              <strong>5 novos visitantes no último mês</strong>
            </div>
          </div>
          <div class="alert-item error">
            <mat-icon>error</mat-icon>
            <div>
              <strong>Turma Adolescentes com frequência abaixo de 70%</strong>
            </div>
          </div>
        </div>
      </section>
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

    .metric-card {
      position: relative;
      background: #ffffff;
      border: 1px solid #d8dee8;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 1px 2px rgba(14, 34, 65, 0.05);
    }

    .metric-card::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      border-radius: 0 14px 14px 0;
      background: #f3a32f;
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    }

    .metric-icon ::ng-deep .mat-icon {
      color: #0d376d;
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
      margin-top: 6px;
      font-size: 14px;
    }

    .metric-change {
      color: #28a745;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    /* GRID DE GRÁFICOS */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .chart-panel {
      background: #ffffff;
      border: 1px solid #d8dee8;
      border-radius: 12px;
      padding: 24px;
    }

    .chart-panel h2 {
      margin: 0 0 20px;
      color: #0e2241;
      font-size: 18px;
    }

    .chart-placeholder {
      height: 300px;
      background: linear-gradient(135deg, #f6f9fd 0%, #edf2f7 100%);
      border-radius: 8px;
      border: 2px dashed #d8dee8;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #5d7392;
      font-size: 14px;
    }

    .chart-placeholder p {
      margin: 0;
      font-weight: 600;
    }

    .chart-placeholder small {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 4px;
    }

    /* ALERTAS E NOTIFICAÇÕES */
    .alerts-panel {
      background: #ffffff;
      border: 1px solid #d8dee8;
      border-radius: 12px;
      padding: 24px;
    }

    .alerts-panel h2 {
      margin: 0 0 16px;
      color: #0e2241;
      font-size: 18px;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid #d8dee8;
    }

    .alert-item.warning {
      background: #fff8e1;
      border-left-color: #ffc107;
    }

    .alert-item.warning ::ng-deep .mat-icon {
      color: #ffc107;
    }

    .alert-item.info {
      background: #e3f2fd;
      border-left-color: #2196f3;
    }

    .alert-item.info ::ng-deep .mat-icon {
      color: #2196f3;
    }

    .alert-item.error {
      background: #ffebee;
      border-left-color: #f44336;
    }

    .alert-item.error ::ng-deep .mat-icon {
      color: #f44336;
    }

    .alert-item ::ng-deep .mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .alert-item strong {
      color: #092244;
      font-size: 14px;
      line-height: 1.4;
    }

    @media (max-width: 1200px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .greeting-card {
        padding: 20px;
      }

      .greeting-card h1 {
        font-size: 1.5rem;
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }

      .chart-placeholder {
        height: 250px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly permissionService = inject(PermissionService);
  private readonly churchesApiService = inject(ChurchesApiService);
  private readonly personasApiService = inject(PersonasApiService);
  private readonly membersApiService = inject(MembersApiService);

  protected get session() {
    return this.authSessionService.getSession()?.user;
  }

  protected canManageChurches = this.permissionService.canManageChurches();
  protected canManagePersonas = this.permissionService.canManagePersonas();
  protected canManageMembers = this.permissionService.canManageMembers();

  churchesCount = 0;
  personasCount = 0;
  membersCount = 0;

  ngOnInit(): void {
    this.loadCounts();
  }

  private loadCounts(): void {
    this.churchesApiService.getAll().subscribe({
      next: (churches) => {
        this.churchesCount = churches.length;
      }
    });

    this.personasApiService.getAll().subscribe({
      next: (personas) => {
        this.personasCount = personas.length;
      }
    });

    this.membersApiService.getAll().subscribe({
      next: (members) => {
        this.membersCount = members.length;
      }
    });
  }
}
