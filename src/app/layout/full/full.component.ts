import { Component, DestroyRef, HostListener, Inject, OnInit, PLATFORM_ID, inject } from "@angular/core";
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { isPlatformBrowser, CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TenantContextService } from "../../core/tenant/tenant-context.service";
import { AuthSessionService } from "../../core/auth/auth-session.service";
import { NavigationEnd } from '@angular/router';
import { filter, startWith, map, Observable } from 'rxjs';
import { AuthService } from "../../core/auth/auth.service";
import { AdminChurchesApiService } from "../../core/api/admin-churches-api.service";
import { AuthMeResponse, Church } from "../../shared/models/api.models";
import { PermissionContext, PermissionService } from "../../core/auth/permission.service";

interface TenantNavItem {
  path: string;
  icon: string;
  label: string;
  tooltip: string;
  permission: PermissionContext;
}

interface AppNotification {
  id: number;
  title: string;
  message: string;
  icon: string;
  createdAt: string;
  read: boolean;
}

@Component({
  standalone: true,
  selector: 'app-full',
  imports: [
    MatSidenavModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatButtonModule,
    MatTooltipModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    FormsModule
  ],
  templateUrl: './full.component.html',
  styleUrls: ['./full.component.css']
})
export class FullComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly permissionService = inject(PermissionService);

  isOpened = true;
  pageTitle = 'Dashboard';
  readonly defaultChurchId = this.authSessionService.getChurchIdHeaderValue() ?? TenantContextService.DEFAULT_CHURCH_ID;
  churchId = this.tenantContext.getChurchId() ?? this.defaultChurchId;
  isAdminArea = false;
  adminChurchId = this.authSessionService.getAdminChurchId() ?? '';
  adminChurches: Church[] = [];
  churchName$!: Observable<string>;
  currentUser$!: Observable<AuthMeResponse | null>;
  isAdminMaster$!: Observable<boolean>;
  readonly tenantNavItems: TenantNavItem[] = [
    { path: 'home', icon: 'dashboard', label: 'Dashboard', tooltip: 'Dashboard', permission: 'dashboard' },
    { path: 'members', icon: 'group', label: 'Membros', tooltip: 'Membros', permission: 'members' },
    { path: 'finance', icon: 'attach_money', label: 'Financeiro', tooltip: 'Financeiro', permission: 'finance' },
    { path: 'sunday-school', icon: 'menu_book', label: 'Escola Biblica', tooltip: 'Escola Biblica', permission: 'sunday-school' }
  ];
  notifications: AppNotification[] = [
    {
      id: 1,
      title: 'Dashboard atualizado',
      message: 'Os indicadores financeiros agora usam os lancamentos reais.',
      icon: 'dashboard_customize',
      createdAt: 'Agora',
      read: false
    },
    {
      id: 2,
      title: 'Permissoes aplicadas',
      message: 'O menu mostra apenas os modulos liberados para o perfil.',
      icon: 'verified_user',
      createdAt: 'Hoje',
      read: false
    },
    {
      id: 3,
      title: 'Paginacao ativa',
      message: 'Listas de membros, usuarios e financeiro usam paginacao padrao.',
      icon: 'format_list_numbered',
      createdAt: 'Hoje',
      read: false
    }
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private tenantContext: TenantContextService,
    private authService: AuthService,
    private adminChurchesApiService: AdminChurchesApiService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authSessionService.session$.pipe(
      map(session => session?.user ?? null)
    );
    this.churchName$ = this.authSessionService.session$.pipe(
      map(session => session?.user?.adminMaster ? 'Administração' : (session?.user?.churchName || 'Igreja Evangelica'))
    );
    this.isAdminMaster$ = this.authSessionService.session$.pipe(
      map(() => this.authSessionService.isAdminMaster())
    );
    this.updateViewportMode();
    this.watchAdminArea();
    this.watchChurchIdFromRoute();
    this.watchPageTitle();
    this.loadAdminChurches();
  }

  @HostListener('window:resize')
  updateViewportMode(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Sidenav em modo over com toggle hambúrguer
  }

  toggleSidenav(): void {
    this.isOpened = !this.isOpened;
  }

  tenantLink(path: string): string[] {
    return ['/', this.churchId || this.defaultChurchId, path];
  }

  get visibleTenantNavItems(): TenantNavItem[] {
    return this.tenantNavItems.filter((item) => this.permissionService.canAccessContext(item.permission));
  }

  get unreadNotificationsCount(): number {
    return this.notifications.filter((notification) => !notification.read).length;
  }

  markNotificationAsRead(notification: AppNotification): void {
    notification.read = true;
  }

  markAllNotificationsAsRead(): void {
    this.notifications = this.notifications.map((notification) => ({
      ...notification,
      read: true
    }));
  }

  adminLink(path: string): string[] {
    return ['/admin', path];
  }

  onAdminChurchContextChange(churchId: string): void {
    this.adminChurchId = churchId;
    this.authSessionService.setAdminChurchId(churchId || null);
  }

  logout(): void {
    this.authService.logout();
    this.tenantContext.clearChurchId();
    this.router.navigate(['/login']);
  }

  userInitials(user: AuthMeResponse | null): string {
    if (!user?.name) {
      return 'AD';
    }

    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '';

    return `${first}${second}`.toUpperCase();
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = {
      ROLE_ADMIN: 'Administrador',
      ROLE_SECRETARY: 'Secretaria',
      ROLE_TREASURER: 'Tesouraria',
      ROLE_MEMBER: 'Membro',
      ROLE_ADMIN_MASTER: 'Admin Master'
    };

    return labels[role] ?? role.replace(/^ROLE_/, '').replace(/_/g, ' ');
  }

  private watchChurchIdFromRoute(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const resolvedChurchId = this.tenantContext.resolveChurchId([
          params.get('churchId'),
          this.tenantContext.getChurchId(),
          this.defaultChurchId
        ]);

        if (!resolvedChurchId) {
          return;
        }

        this.churchId = resolvedChurchId;
        this.tenantContext.setChurchId(resolvedChurchId);
      });
  }

  private watchAdminArea(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.isAdminArea = this.router.url.startsWith('/admin');
      });
  }

  private watchPageTitle(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        const currentRoute = this.getDeepestRoute(this.activatedRoute);
        this.pageTitle = currentRoute.snapshot.data['title'] || 'Dashboard';
      });
  }

  private getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    let currentRoute = route;

    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    return currentRoute;
  }

  private loadAdminChurches(): void {
    if (!this.authSessionService.isAdminMaster()) {
      return;
    }

    this.adminChurchesApiService.getAll().subscribe({
      next: (churches) => (this.adminChurches = churches),
      error: () => (this.adminChurches = [])
    });
  }
}
