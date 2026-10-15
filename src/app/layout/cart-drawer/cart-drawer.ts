import { Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, X } from 'lucide-angular';
import { CartContents } from '../../shared/cart-contents/cart-contents';

export const CART_DRAWER_TITLE_ID = 'cart-drawer-title';

/** Slide-in cart panel, rendered by CartDrawerService inside a CDK dialog. */
@Component({
  selector: 'app-cart-drawer',
  imports: [TranslatePipe, LucideAngularModule, CartContents],
  host: {
    class:
      'flex h-full flex-col bg-background shadow-2xl transition-transform duration-300 ease-out starting:translate-x-full motion-reduce:transition-none',
  },
  template: `
    <div class="flex items-center justify-between gap-4 border-b border-border py-3 pr-3 pl-6">
      <h2 [id]="titleId" class="m-0 text-h3">{{ 'CART.TITLE' | translate }}</h2>
      <button
        type="button"
        class="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-plum hover:bg-blush"
        [attr.aria-label]="'CART.CLOSE' | translate"
        (click)="dialogRef.close()"
      >
        <lucide-icon [img]="close" [size]="22" />
      </button>
    </div>
    <app-cart-contents class="flex-1" layout="drawer" />
  `,
})
export class CartDrawer {
  protected readonly dialogRef = inject(DialogRef);
  protected readonly titleId = CART_DRAWER_TITLE_ID;
  protected readonly close = X;
}
