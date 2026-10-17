import { Component, Injector, forwardRef, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { LANGUAGES, Lang, LocalizedText } from '../../i18n/localized-text';

/** True when the Georgian text is missing or blank. */
export function isMissingKa(value: LocalizedText | null | undefined): boolean {
  return !value?.ka?.trim();
}

/**
 * One field for translatable text ({ ka, en? }) with KA / EN tabs above a single input or
 * textarea. A tab whose text is missing shows a dot. Works with Reactive Forms as a
 * ControlValueAccessor, and is a validator: { localizedRequired: true } while "ka" is empty
 * (turn off with [required]="false"). English is optional and left out of the value when blank.
 *
 * Usage: <app-localized-input fieldId="name" label="სახელი" formControlName="name" />
 *
 * Default texts are Georgian (the admin app); a translated app passes its own.
 */
@Component({
  selector: 'app-localized-input',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LocalizedInput), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => LocalizedInput), multi: true },
  ],
  host: { class: 'flex flex-col gap-2' },
  template: `
    @let lang = active();
    @let invalid = showError();
    <div class="flex flex-wrap items-end justify-between gap-2">
      <label [for]="fieldId()" class="font-bold">
        {{ label() }}
        <span class="sr-only">({{ languageNames()[lang] }})</span>
      </label>
      <div class="flex gap-1" role="tablist" [attr.aria-label]="languagesLabel()">
        @for (tab of languages; track tab) {
          @let selected = tab === lang;
          <button
            type="button"
            role="tab"
            class="relative min-h-11 min-w-12 cursor-pointer rounded-chip border-2 border-plum px-3 font-brand font-semibold"
            [class]="selected ? 'bg-plum text-blush' : 'bg-background text-plum'"
            [id]="fieldId() + '-tab-' + tab"
            [attr.aria-selected]="selected"
            [attr.aria-controls]="fieldId()"
            [tabIndex]="selected ? 0 : -1"
            [disabled]="disabled()"
            (click)="select(tab)"
            (keydown)="onTabKeydown($event)"
          >
            {{ tab.toUpperCase() }}
            @if (isMissing(tab)) {
              <span
                class="absolute top-1 right-1 size-2 rounded-pill bg-coral-strong"
                aria-hidden="true"
              ></span>
              <span class="sr-only">({{ missingLabel() }})</span>
            }
          </button>
        }
      </div>
    </div>

    @if (multiline()) {
      <textarea
        class="min-h-24 w-full rounded-chip border-2 border-plum bg-background px-4 py-3 text-plum aria-invalid:border-coral-strong"
        [id]="fieldId()"
        [rows]="rows()"
        [attr.lang]="lang"
        [attr.maxlength]="maxLength()"
        [attr.aria-invalid]="invalid || null"
        [attr.aria-describedby]="invalid ? fieldId() + '-error' : null"
        [value]="textFor(lang)"
        [disabled]="disabled()"
        (input)="onInput(lang, $any($event.target).value)"
        (blur)="onTouched()"
      ></textarea>
    } @else {
      <input
        type="text"
        class="min-h-12 w-full rounded-chip border-2 border-plum bg-background px-4 text-plum aria-invalid:border-coral-strong"
        [id]="fieldId()"
        [attr.lang]="lang"
        [attr.maxlength]="maxLength()"
        [attr.aria-invalid]="invalid || null"
        [attr.aria-describedby]="invalid ? fieldId() + '-error' : null"
        [value]="textFor(lang)"
        [disabled]="disabled()"
        (input)="onInput(lang, $any($event.target).value)"
        (blur)="onTouched()"
      />
    }

    @if (invalid) {
      <p class="m-0 text-sm font-semibold" [id]="fieldId() + '-error'">{{ requiredMessage() }}</p>
    }
  `,
})
export class LocalizedInput implements ControlValueAccessor, Validator {
  private readonly injector = inject(Injector);

  /** id of the input; the tabs and the error message derive theirs from it. */
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  /** A textarea instead of a single-line input. */
  readonly multiline = input(false);
  readonly rows = input(3);
  readonly maxLength = input<number>();
  /** Georgian text is required (the default). */
  readonly required = input(true);
  /** Show the error on an untouched field too (after a submit attempt). */
  readonly showErrors = input(false);

  readonly requiredMessage = input('ქართული ტექსტი სავალდებულოა.');
  readonly missingLabel = input('ტექსტი აკლია');
  readonly languagesLabel = input('ენა');
  readonly languageNames = input<Record<Lang, string>>({ ka: 'ქართული', en: 'ინგლისური' });

  protected readonly languages = LANGUAGES;
  protected readonly active = signal<Lang>('ka');
  protected readonly value = signal<LocalizedText>({ ka: '' });
  protected readonly disabled = signal(false);

  private onChange: (value: LocalizedText) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected textFor(lang: Lang): string {
    return this.value()[lang] ?? '';
  }

  protected isMissing(lang: Lang): boolean {
    return !this.textFor(lang).trim();
  }

  protected select(lang: Lang): void {
    this.active.set(lang);
  }

  /** Tabs pattern: arrow keys move between KA and EN. */
  protected onTabKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = LANGUAGES.indexOf(this.active());
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? LANGUAGES.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + LANGUAGES.length) % LANGUAGES.length;
    this.active.set(LANGUAGES[next]);
    const tab = (event.currentTarget as HTMLElement).parentElement?.children[next];
    (tab as HTMLElement | undefined)?.focus();
  }

  protected onInput(lang: Lang, text: string): void {
    const next: LocalizedText = { ...this.value(), [lang]: text };
    this.value.set(next);
    this.onChange(next.en ? next : { ka: next.ka });
  }

  // A method, not a computed: control state is not a signal, so it is re-read on every check.
  protected showError(): boolean {
    // Looked up lazily: injecting NgControl in the constructor would be a circular dependency.
    const control = this.injector.get(NgControl, null, { self: true, optional: true })?.control;
    return !!control?.hasError('localizedRequired') && (control.touched || this.showErrors());
  }

  writeValue(value: LocalizedText | null): void {
    this.value.set({ ka: value?.ka ?? '', en: value?.en ?? '' });
  }

  registerOnChange(fn: (value: LocalizedText) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  validate(control: AbstractControl<LocalizedText | null>): ValidationErrors | null {
    return this.required() && isMissingKa(control.value) ? { localizedRequired: true } : null;
  }
}
