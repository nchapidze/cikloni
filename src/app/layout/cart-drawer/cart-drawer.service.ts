import { Injectable, Injector, inject } from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { createGlobalPositionStrategy } from '@angular/cdk/overlay';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { CART_DRAWER_TITLE_ID, CartDrawer } from './cart-drawer';

/**
 * Opens the cart drawer from the right. The CDK dialog traps focus, closes on Esc and backdrop
 * click, and returns focus to the opener; we also close it when a link inside navigates.
 */
@Injectable({ providedIn: 'root' })
export class CartDrawerService {
  private readonly dialog = inject(Dialog);
  private readonly injector = inject(Injector);
  private ref: DialogRef<unknown, CartDrawer> | null = null;

  constructor() {
    inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.close());
  }

  open(): void {
    if (this.ref) return;
    this.ref = this.dialog.open(CartDrawer, {
      ariaLabelledBy: CART_DRAWER_TITLE_ID,
      ariaModal: true,
      autoFocus: 'first-heading',
      positionStrategy: createGlobalPositionStrategy(this.injector).top('0').right('0'),
      width: '100%',
      maxWidth: '28rem',
      height: '100%',
      backdropClass: 'bg-plum/50',
    });
    this.ref.closed.subscribe(() => (this.ref = null));
  }

  close(): void {
    this.ref?.close();
  }
}
