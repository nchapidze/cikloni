import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CircleAlert, LucideAngularModule } from 'lucide-angular';

const ERROR_KEYS: Record<string, string> = {
  required: 'CHECKOUT.ERRORS.REQUIRED',
  email: 'CHECKOUT.ERRORS.EMAIL',
  phone: 'CHECKOUT.ERRORS.PHONE',
  maxlength: 'CHECKOUT.ERRORS.TOO_LONG',
};

/** Labelled text input or textarea bound to a FormControl, with an optional hint and errors. */
@Component({
  selector: 'app-text-field',
  imports: [ReactiveFormsModule, TranslatePipe, LucideAngularModule],
  host: { class: 'flex flex-col gap-2' },
  template: `
    @let error = errorKey();
    @let hintId = hint() ? fieldId() + '-hint' : '';
    @let errorId = error ? fieldId() + '-error' : '';
    @let describedBy = (hintId + ' ' + errorId).trim() || null;

    <label [for]="fieldId()" class="font-bold">{{ label() | translate }}</label>
    @if (hint(); as hint) {
      <p [id]="hintId" class="m-0 text-sm">{{ hint | translate }}</p>
    }
    @if (multiline()) {
      <textarea
        [id]="fieldId()"
        rows="3"
        class="min-h-24 w-full rounded-chip border-2 border-plum bg-background px-4 py-3 text-plum aria-invalid:border-coral-strong"
        [formControl]="control()"
        [attr.autocomplete]="autocomplete()"
        [attr.maxlength]="maxLength()"
        [attr.aria-invalid]="!!error || null"
        [attr.aria-describedby]="describedBy"
      ></textarea>
    } @else {
      <input
        [id]="fieldId()"
        [type]="type()"
        class="min-h-12 w-full rounded-chip border-2 border-plum bg-background px-4 text-plum aria-invalid:border-coral-strong"
        [formControl]="control()"
        [attr.autocomplete]="autocomplete()"
        [attr.inputmode]="inputmode()"
        [attr.maxlength]="maxLength()"
        [attr.aria-invalid]="!!error || null"
        [attr.aria-describedby]="describedBy"
      />
    }
    @if (error) {
      <p [id]="errorId" class="m-0 flex items-center gap-1.5 text-sm font-semibold">
        <lucide-icon class="shrink-0" [img]="alertIcon" [size]="18" />
        {{ error | translate }}
      </p>
    }
  `,
})
export class TextField {
  readonly control = input.required<FormControl<string>>();
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly type = input<'text' | 'tel' | 'email'>('text');
  readonly autocomplete = input<string>();
  readonly inputmode = input<string>();
  readonly maxLength = input<number>();
  readonly multiline = input(false);
  /** Show errors on untouched fields too (after a submit attempt). */
  readonly showErrors = input(false);

  protected readonly alertIcon = CircleAlert;

  // A method, not a computed: control state is not a signal, so it is re-read on every check.
  protected errorKey(): string | null {
    const control = this.control();
    if (!control.errors || !(control.touched || this.showErrors())) return null;
    return ERROR_KEYS[Object.keys(control.errors)[0]] ?? ERROR_KEYS['required'];
  }
}
