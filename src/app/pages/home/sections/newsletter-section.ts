import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CircleAlert, LucideAngularModule } from 'lucide-angular';

/** design/HOME.md section 10. Submitting only shows a thank-you message for now. */
@Component({
  selector: 'app-newsletter-section',
  imports: [ReactiveFormsModule, TranslatePipe, LucideAngularModule],
  template: `
    <section class="bg-sunny-soft" aria-labelledby="newsletter-title">
      <div class="mx-auto flex max-w-205 flex-col items-center gap-4 px-6 py-16 text-center">
        <h2 id="newsletter-title" class="m-0">{{ 'NEWSLETTER.TITLE' | translate }}</h2>
        <p class="m-0">{{ 'NEWSLETTER.TEXT' | translate }}</p>

        <!-- Live region stays mounted so the thank-you message is announced. -->
        <p class="m-0 font-bold empty:hidden" role="status">
          @if (subscribed()) {
            {{ 'NEWSLETTER.THANKS' | translate }}
          }
        </p>

        @if (!subscribed()) {
          <form
            class="flex w-full flex-col items-center gap-2"
            novalidate
            [formGroup]="form"
            (ngSubmit)="submit()"
          >
            <div class="flex w-full flex-wrap justify-center gap-3">
              <label for="newsletter-email" class="sr-only">{{
                'NEWSLETTER.EMAIL_LABEL' | translate
              }}</label>
              <input
                #emailInput
                id="newsletter-email"
                type="email"
                autocomplete="email"
                class="min-h-13 max-w-95 min-w-0 grow basis-70 rounded-pill border-2 border-plum bg-background px-5 text-plum placeholder:text-plum/72"
                formControlName="email"
                [placeholder]="'NEWSLETTER.EMAIL_PLACEHOLDER' | translate"
                [attr.aria-invalid]="showError() || null"
                [attr.aria-describedby]="showError() ? 'newsletter-error' : null"
              />
              <button
                type="submit"
                class="min-h-13 cursor-pointer rounded-pill border-0 bg-plum px-7 font-bold text-blush"
              >
                {{ 'NEWSLETTER.SUBMIT' | translate }}
              </button>
            </div>
            @if (showError()) {
              <p id="newsletter-error" class="m-0 flex items-center gap-1.5 text-sm font-semibold">
                <lucide-icon [img]="alertIcon" [size]="18" />
                {{ 'NEWSLETTER.EMAIL_INVALID' | translate }}
              </p>
            }
          </form>
        }
      </div>
    </section>
  `,
})
export class NewsletterSection {
  private readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');

  protected readonly alertIcon = CircleAlert;
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
  protected readonly subscribed = signal(false);
  protected readonly showError = signal(false);

  protected submit(): void {
    if (this.form.invalid) {
      this.showError.set(true);
      this.emailInput()?.nativeElement.focus();
      return;
    }
    // TODO: send this.form.getRawValue().email to the newsletter provider.
    this.showError.set(false);
    this.subscribed.set(true);
  }
}
