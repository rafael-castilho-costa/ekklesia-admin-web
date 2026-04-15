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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TenantContextService } from "../core/tenant/tenant-context.service";
import { AuthSessionService } from "../core/auth/auth-session.service";
import { NavigationEnd } from '@angular/router';
import { filter, startWith, map, Observable } from 'rxjs';
import { AuthService } from "../core/auth/auth.service";

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
    CommonModule
  ],
  templateUrl: 'full.component.html',
  styleUrls: ['full.component.css']
})
export class fullComponent implements OnInit {
  isOpened = true;
  pageTitle = 'Dashboard';
  readonly defaultChurchId = TenantContextService.DEFAULT_CHURCH_ID;
  churchId = this.tenantContext.getChurchId() ?? this.defaultChurchId;
  churchName$!: Observable<string>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly authSessionService = inject(AuthSessionService);

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private tenantContext: TenantContextService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    this.churchName$ = this.authSessionService.session$.pipe(
      map(session => session?.user?.churchName || 'Igreja Evangelica')
    );
    this.updateViewportMode();
    this.watchChurchIdFromRoute();
    this.watchPageTitle();
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

  logout(): void {
    this.authService.logout();
    this.tenantContext.clearChurchId();
    this.router.navigate(['/login']);
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
}
