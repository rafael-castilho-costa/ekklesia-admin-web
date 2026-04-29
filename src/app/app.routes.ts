import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminMasterGuard } from './core/guards/admin-master.guard';
import { moduleAccessGuard } from './core/guards/module-access.guard';
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
    path: 'admin',
    component: FullComponent,
    canActivate: [authGuard, adminMasterGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'churches'
      },
      {
        path: 'churches',
        loadComponent: () => import('./features/admin/admin-churches.component').then(m => m.AdminChurchesComponent),
        data: { title: 'Administração - Igrejas' }
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/admin-users.component').then(m => m.AdminUsersComponent),
        data: { title: 'Administração - Usuarios' }
      },
      {
        path: 'personas',
        loadComponent: () => import('./features/admin/admin-personas.component').then(m => m.AdminPersonasComponent),
        data: { title: 'Administração - Pessoas' }
      }
    ]
  },
  {
    path: ':churchId',
    component: FullComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [moduleAccessGuard],
        data: { title: 'Dashboard', permission: 'dashboard' }
      },
      {
        path: 'members',
        loadComponent: () => import('./features/members/members.component').then(m => m.MembersComponent),
        canActivate: [moduleAccessGuard],
        data: { title: 'Membros', permission: 'members' }
      },
      {
        path: 'membros',
        redirectTo: 'members',
        pathMatch: 'full'
      },
      {
        path: 'finance',
        loadComponent: () => import('./features/finance/finance.component').then(m => m.FinanceComponent),
        canActivate: [moduleAccessGuard],
        data: { title: 'Financeiro', permission: 'finance' }
      },
      {
        path: 'agenda',
        redirectTo: 'finance',
        pathMatch: 'full'
      },
      {
        path: 'sunday-school',
        loadComponent: () => import('./features/sunday-school/sunday-school.component').then(m => m.SundaySchoolComponent),
        canActivate: [moduleAccessGuard],
        data: { title: 'Escola Dominical', permission: 'sunday-school' }
      },
      {
        path: 'visitors',
        redirectTo: 'sunday-school',
        pathMatch: 'full'
      },
      {
        path: 'Escola Dominical',
        redirectTo: 'sunday-school',
        pathMatch: 'full'
      },
      {
        path: 'churches',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/churches/churches-list.component').then(m => m.ChurchesListComponent),
            canActivate: [moduleAccessGuard],
            data: { title: 'Igrejas', permission: 'churches' }
          },
          {
            path: 'new',
            loadComponent: () => import('./features/churches/churches-form.component').then(m => m.ChurchesFormComponent),
            canActivate: [moduleAccessGuard],
            data: { title: 'Nova Igreja', permission: 'churches' }
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/churches/churches-form.component').then(m => m.ChurchesFormComponent),
            canActivate: [moduleAccessGuard],
            data: { title: 'Editar Igreja', permission: 'churches' }
          }
        ]
      },
      {
        path: 'personas',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/personas/personas-list.component').then(m => m.PersonasListComponent),
            canActivate: [moduleAccessGuard],
            data: { title: 'Pessoas', permission: 'personas' }
          },
          {
            path: 'new',
            loadComponent: () => import('./features/personas/personas-form.component').then(m => m.PersonasFormComponent),
            canActivate: [moduleAccessGuard],
            data: { title: 'Nova Pessoa', permission: 'personas' }
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/personas/personas-form.component').then(m => m.PersonasFormComponent),
            canActivate: [moduleAccessGuard],
            data: { title: 'Editar Pessoa', permission: 'personas' }
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
