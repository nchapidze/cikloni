import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** design/HOME.md section 3. */
@Component({
  selector: 'app-hero-section',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="mx-auto flex max-w-page flex-wrap items-center gap-12 px-6 py-16">
      <div class="flex min-w-0 grow basis-105 flex-col gap-6">
        <p class="m-0 self-start rounded-pill bg-sunny-soft px-3.5 py-1.5 text-sm font-bold">
          {{ 'HERO.BADGE' | translate }}
        </p>
        <h1 class="m-0 text-3xl sm:text-4xl md:text-h1">{{ 'HERO.TITLE' | translate }}</h1>
        <p class="m-0 max-w-130 text-lg">{{ 'HERO.TEXT' | translate }}</p>
        <div class="flex flex-wrap gap-3">
          <a
            routerLink="/"
            fragment="shop"
            class="inline-flex min-h-13 items-center rounded-pill border-2 border-plum bg-plum px-7 font-bold text-blush no-underline"
            >{{ 'HERO.SHOP_NOW' | translate }}</a
          >
          <a
            routerLink="/"
            fragment="how"
            class="inline-flex min-h-13 items-center rounded-pill border-2 border-plum px-7 font-bold text-plum no-underline"
            >{{ 'HERO.HOW_IT_WORKS' | translate }}</a
          >
        </div>
      </div>

      <!-- TODO: replace placeholders with real photos. -->
      <div class="flex min-w-0 grow basis-105 gap-4" aria-hidden="true">
        <div class="flex h-80 flex-1 items-end rounded-hero bg-coral p-5 font-bold md:h-115">
          {{ 'HERO.MODEL_PHOTO' | translate }}
        </div>
        <div class="flex flex-1 flex-col gap-4">
          <div class="flex flex-1 items-end rounded-hero bg-lilac p-5 font-bold">
            {{ 'HERO.PRODUCT_PHOTO' | translate }}
          </div>
          <div class="flex flex-1 items-end rounded-hero bg-sunny p-5 font-bold">
            {{ 'HERO.PRODUCT_PHOTO' | translate }}
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HeroSection {}
