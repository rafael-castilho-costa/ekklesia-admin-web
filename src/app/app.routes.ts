import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './authentication/login.component';
import { fullComponent } from './full/full.component';

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
    component: fullComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { title: 'Dashboard' }
      },
      {
        path: 'membros',
        loadComponent: () => import('./features/members/members-list.component').then(m => m.MembersListComponent),
        data: { title: 'Membros' }
      },
      {
        path: 'agenda',
        loadComponent: () => import('./agenda/agenda.component').then(m => m.AgendaComponent),
        data: { title: 'Agenda' }
      },
      {
        path: 'visitantes',
        loadComponent: () => import('./visitantes/visitantes.component').then(m => m.VisitantesComponent),
        data: { title: 'Visitantes' }
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
