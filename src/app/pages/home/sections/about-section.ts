import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LogoMark } from '@cikloni/shared';

/** design/HOME.md section 9. */
@Component({
  selector: 'app-about-section',
  imports: [TranslatePipe, LogoMark],
  template: `
    <section
      id="about"
      class="mx-auto flex max-w-page scroll-mt-4 flex-wrap items-center gap-12 px-6 py-20"
      aria-labelledby="about-title"
    >
      <!-- Padding leaves room for the spinning spiral, which sweeps ~46px above and ~19px beside the 260px box. -->
      <div class="flex grow basis-90 justify-center px-5 py-12">
        <app-logo-mark [size]="260" [spin]="true" />
      </div>
      <div class="flex min-w-0 grow basis-105 flex-col gap-4">
        <h2 id="about-title" class="m-0">{{ 'ABOUT.TITLE' | translate }}</h2>
        <p class="m-0 text-lg">{{ 'ABOUT.TEXT' | translate }}</p>
        <p class="m-0">{{ 'ABOUT.STORY' | translate }}</p>
      </div>
    </section>
  `,
})
export class AboutSection {}
