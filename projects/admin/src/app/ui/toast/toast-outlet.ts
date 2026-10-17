import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { CircleAlert, CircleCheck, LucideAngularModule, X } from 'lucide-angular';
import { Toast, ToastService } from './toast.service';

/**
 * Renders the toasts, bottom right (full width on phones). The live regions are always in the
 * DOM so screen readers announce new toasts: errors assertively, successes politely.
 */
@Component({
  selector: 'app-toast-outlet',
  imports: [NgTemplateOutlet, LucideAngularModule],
  host: {
    class:
      'pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-2 sm:left-auto sm:w-96',
  },
  template: `
    <div class="flex flex-col gap-2" role="alert">
      @for (toast of errors(); track toast.id) {
        <ng-container *ngTemplateOutlet="item; context: { $implicit: toast }" />
      }
    </div>
    <div class="flex flex-col gap-2" role="status">
      @for (toast of successes(); track toast.id) {
        <ng-container *ngTemplateOutlet="item; context: { $implicit: toast }" />
      }
    </div>

    <ng-template #item let-toast>
      <div
        class="pointer-events-auto flex items-start gap-3 rounded-panel p-4 text-plum shadow-lg"
        [class]="toast.kind === 'error' ? 'bg-coral-soft' : 'bg-mint'"
      >
        <lucide-icon
          class="mt-0.5 shrink-0"
          [img]="toast.kind === 'error' ? errorIcon : successIcon"
          [size]="20"
        />
        <p class="m-0 flex-1 font-semibold">{{ toast.message }}</p>
        <button
          type="button"
          class="-m-2 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill border-0 bg-transparent text-plum"
          aria-label="დახურვა"
          (click)="toasts.dismiss(toast.id)"
        >
          <lucide-icon [img]="closeIcon" [size]="18" />
        </button>
      </div>
    </ng-template>
  `,
})
export class ToastOutlet {
  protected readonly toasts = inject(ToastService);

  protected readonly errors = computed(() => this.byKind('error'));
  protected readonly successes = computed(() => this.byKind('success'));

  protected readonly errorIcon = CircleAlert;
  protected readonly successIcon = CircleCheck;
  protected readonly closeIcon = X;

  private byKind(kind: Toast['kind']): Toast[] {
    return this.toasts.toasts().filter((toast) => toast.kind === kind);
  }
}
