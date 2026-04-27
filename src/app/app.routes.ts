import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './authentication/login.component';
import { FullComponent } from './layout/full/full.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/login'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: ':churchId',
    component: FullComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { title: 'Dashboard' }
      },
      {
        path: 'members',
        loadComponent: () => import('./features/members/members.component').then(m => m.MembersComponent),
        data: { title: 'Membros' }
      },
      {
        path: 'membros',
        redirectTo: 'members',
        pathMatch: 'full'
      },
      {
        path: 'finance',
        loadComponent: () => import('./features/finance/finance.component').then(m => m.FinanceComponent),
        data: { title: 'Financeiro' }
      },
      {
        path: 'agenda',
        redirectTo: 'finance',
        pathMatch: 'full'
      },
      {
        path: 'visitors',
        loadComponent: () => import('./features/visitors/visitors.component').then(m => m.VisitorsComponent),
        data: { title: 'Visitantes' }
      },
      {
        path: 'visitantes',
        redirectTo: 'visitors',
        pathMatch: 'full'
      },
      {
        path: 'churches',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/churches/churches-list.component').then(m => m.ChurchesListComponent),
            data: { title: 'Igrejas' }
          },
          {
            path: 'new',
            loadComponent: () => import('./features/churches/churches-form.component').then(m => m.ChurchesFormComponent),
            data: { title: 'Nova Igreja' }
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/churches/churches-form.component').then(m => m.ChurchesFormComponent),
            data: { title: 'Editar Igreja' }
          }
        ]
      },
      {
        path: 'personas',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/personas/personas-list.component').then(m => m.PersonasListComponent),
            data: { title: 'Pessoas' }
          },
          {
            path: 'new',
            loadComponent: () => import('./features/personas/personas-form.component').then(m => m.PersonasFormComponent),
            data: { title: 'Nova Pessoa' }
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/personas/personas-form.component').then(m => m.PersonasFormComponent),
            data: { title: 'Editar Pessoa' }
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
