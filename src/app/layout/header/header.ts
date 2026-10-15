import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, Menu, ShoppingBag, X } from 'lucide-angular';
import { CartService } from '../../core/cart/cart.service';
import { LanguageToggle } from '../../shared/language-toggle/language-toggle';
import { LogoMark } from '../../shared/logo-mark/logo-mark';

@Component({
  selector: 'app-header',
  imports: [RouterLink, TranslatePipe, LucideAngularModule, LanguageToggle, LogoMark],
  templateUrl: './header.html',
  host: {
    '(keydown.escape)': 'closeMenu(true)',
  },
})
export class Header {
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
    inject(Router)
      .events.pipe(
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
}
