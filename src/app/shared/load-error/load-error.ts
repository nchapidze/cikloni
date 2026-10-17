import { Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** "Couldn't load the products" message with a retry button. */
@Component({
  selector: 'app-load-error',
  imports: [TranslatePipe],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-start gap-4 rounded-card bg-blush p-6" role="alert">
      <p class="m-0">{{ 'CATALOG.ERROR' | translate }}</p>
      <button
        type="button"
        class="min-h-11 cursor-pointer rounded-pill border-0 bg-plum px-6 py-2 font-bold text-blush"
        (click)="retry.emit()"
      >
        {{ 'CATALOG.RETRY' | translate }}
      </button>
    </div>
  `,
})
export class LoadError {
  readonly retry = output();
}
