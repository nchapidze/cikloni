import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  LucideIconData,
  Package,
} from 'lucide-angular';
import { AuthService } from '../../core/data-access/auth.service';
import { LogoMark } from '../../shared/logo-mark/logo-mark';
import { ADMIN_LOGIN_PATH } from '../admin.guards';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIconData;
  exact: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/admin', label: 'მთავარი', icon: LayoutDashboard, exact: true },
  { path: '/admin/orders', label: 'შეკვეთები', icon: ClipboardList, exact: false },
  { path: '/admin/products', label: 'პროდუქტები', icon: Package, exact: false },
];

/** Admin shell: sidebar (a top bar on phones) with the sections and logout, then the page. */
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, LogoMark],
  host: { class: 'flex min-h-screen flex-col md:flex-row' },
  template: `
    <aside
      class="flex flex-col gap-3 bg-plum p-3 text-blush md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:gap-6 md:p-5"
    >
      <div class="flex items-center gap-3 px-1 md:px-2">
        <app-logo-mark [size]="32" dotColor="var(--color-blush)" />
        <span class="font-brand text-2xl font-semibold">cikloni</span>
        <span class="text-sm text-blush/80">ადმინი</span>
      </div>

      <nav aria-label="ადმინ პანელი" class="md:flex md:flex-1 md:flex-col">
        <ul class="m-0 flex list-none gap-1 overflow-x-auto p-0 md:flex-1 md:flex-col">
          @for (item of navItems; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-blush/15"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                ariaCurrentWhenActive="page"
                class="flex min-h-11 shrink-0 items-center gap-3 rounded-chip px-4 font-semibold text-blush no-underline hover:bg-blush/10 focus-visible:outline-blush"
              >
                <lucide-icon class="shrink-0" [img]="item.icon" [size]="20" />
                {{ item.label }}
              </a>
            </li>
          }
          <li class="md:mt-auto">
            <button
              type="button"
              class="flex min-h-11 w-full shrink-0 cursor-pointer items-center gap-3 rounded-chip border-0 bg-transparent px-4 font-semibold text-blush hover:bg-blush/10 focus-visible:outline-blush disabled:cursor-wait"
              [disabled]="signingOut()"
              (click)="signOut()"
            >
              <lucide-icon class="shrink-0" [img]="logoutIcon" [size]="20" />
              გამოსვლა
            </button>
          </li>
        </ul>
      </nav>
    </aside>

    <main class="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
      <router-outlet />
    </main>
  `,
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navItems = NAV_ITEMS;
  protected readonly logoutIcon = LogOut;
  protected readonly signingOut = signal(false);

  protected async signOut(): Promise<void> {
    this.signingOut.set(true);
    try {
      await this.auth.signOut();
    } finally {
      this.signingOut.set(false);
      await this.router.navigateByUrl(ADMIN_LOGIN_PATH);
    }
  }
}
