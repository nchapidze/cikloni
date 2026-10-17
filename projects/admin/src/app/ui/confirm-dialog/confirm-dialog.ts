import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Destructive action: the confirm button is coral. */
  danger?: boolean;
}

/** "Are you sure?" dialog. Cancel comes first and gets the focus, so Enter never destroys. */
@Component({
  selector: 'app-confirm-dialog',
  host: { class: 'block w-full max-w-md rounded-card bg-background p-6 text-plum shadow-lg' },
  template: `
    <h2 id="confirm-title" class="mt-0 mb-3 text-h3">{{ data.title }}</h2>
    <p id="confirm-message" class="mt-0 mb-6">{{ data.message }}</p>
    <div class="flex flex-wrap justify-end gap-3">
      <button
        type="button"
        class="min-h-12 cursor-pointer rounded-pill border-2 border-plum bg-background px-6 font-bold text-plum"
        (click)="ref.close(false)"
      >
        {{ data.cancelLabel ?? 'გაუქმება' }}
      </button>
      <button
        type="button"
        class="min-h-12 cursor-pointer rounded-pill border-0 px-6 font-bold"
        [class]="data.danger ? 'bg-coral-strong text-plum' : 'bg-plum text-blush'"
        (click)="ref.close(true)"
      >
        {{ data.confirmLabel }}
      </button>
    </div>
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(Dialog);

  /** Resolves true only when the admin confirms (Escape and the backdrop cancel). */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const ref = this.dialog.open<boolean, ConfirmOptions>(ConfirmDialog, {
      data: options,
      role: 'alertdialog',
      ariaLabelledBy: 'confirm-title',
      ariaDescribedBy: 'confirm-message',
      autoFocus: 'first-tabbable',
      panelClass: 'px-4',
    });
    return (await firstValueFrom(ref.closed)) === true;
  }
}
