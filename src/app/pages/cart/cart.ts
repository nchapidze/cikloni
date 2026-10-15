import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CartContents } from '../../shared/cart-contents/cart-contents';

/** Full-page cart, used on phones and for direct links (wider screens also get the drawer). */
@Component({
  selector: 'app-cart-page',
  imports: [TranslatePipe, CartContents],
  template: `
    <div class="mx-auto max-w-page px-6 pt-10 pb-20">
      <h1 class="m-0 mb-8 text-4xl md:text-h1">{{ 'CART.TITLE' | translate }}</h1>
      <app-cart-contents layout="page" />
    </div>
  `,
})
export class CartPage {}
