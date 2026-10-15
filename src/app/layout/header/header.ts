import { Component, DOCUMENT, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, Menu, ShoppingBag, X } from 'lucide-angular';
import { CartService } from '../../core/cart/cart.service';
import { CartDrawerService } from '../cart-drawer/cart-drawer.service';
import { LanguageToggle } from '../../shared/language-toggle/language-toggle';
import { LogoMark } from '../../shared/logo-mark/logo-mark';

/** Tailwind's md breakpoint: below it the cart button opens the /cart page. */
const CART_DRAWER_MEDIA = '(min-width: 48rem)';

@Component({
  selector: 'app-header',
  imports: [RouterLink, TranslatePipe, LucideAngularModule, LanguageToggle, LogoMark],
  templateUrl: './header.html',
  host: {
    '(keydown.escape)': 'closeMenu(true)',
  },
})
export class Header {
  private readonly router = inject(Router);
  private readonly cartDrawer = inject(CartDrawerService);
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');

  protected readonly menuOpen = signal(false);

  protected readonly cartCount = inject(CartService).totalCount;

  protected readonly icons = { cart: ShoppingBag, menu: Menu, close: X };

  /** Home page section anchors (ids defined in design/HOME.md). */
  protected readonly links = [
    { fragment: 'shop', label: 'HEADER.NAV.SHOP' },
    { fragment: 'how', label: 'HEADER.NAV.HOW' },
    { fragment: 'absorbency', label: 'HEADER.NAV.ABSORBENCY' },
    { fragment: 'faq', label: 'HEADER.NAV.FAQ' },
    { fragment: 'about', label: 'HEADER.NAV.ABOUT' },
  ];

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenu());
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(returnFocus = false): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    if (returnFocus) this.menuButton().nativeElement.focus();
  }

  /** Wide screens get the drawer; phones (and modified clicks) follow the link to /cart. */
  protected openCart(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    this.closeMenu();
    const wide = this.window?.matchMedia?.(CART_DRAWER_MEDIA).matches ?? false;
    if (wide && !this.router.url.startsWith('/cart')) {
      this.cartDrawer.open();
    } else {
      this.router.navigateByUrl('/cart');
    }
  }
}
