import { Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CircleAlert, LucideAngularModule } from 'lucide-angular';
import { AuthService, SignInError, SignInFailure } from '../../core/data-access/auth.service';
import { LogoMark } from '../../shared/logo-mark/logo-mark';

const FAILURE_MESSAGES: Record<SignInFailure, string> = {
  INVALID_CREDENTIALS: 'ელფოსტა ან პაროლი არასწორია.',
  NOT_ADMIN: 'ამ ანგარიშს ადმინ პანელზე წვდომა არ აქვს.',
  NETWORK: 'კავშირი ვერ დამყარდა. სცადეთ თავიდან.',
};

/** Only same-app admin paths, so ?returnUrl= cannot send anyone to another site. */
function safeReturnUrl(url: string | undefined): string {
  return url?.startsWith('/admin') && !url.startsWith('/admin/login') ? url : '/admin';
}

@Component({
  selector: 'app-admin-login-page',
  imports: [ReactiveFormsModule, LucideAngularModule, LogoMark],
  host: { class: 'flex min-h-screen items-center justify-center bg-blush px-4 py-10' },
  template: `
    <main class="w-full max-w-md rounded-card bg-background p-6 sm:p-8">
      <div class="mb-6 flex items-center gap-3">
        <app-logo-mark />
        <h1 class="m-0 text-3xl">ადმინ პანელი</h1>
      </div>

      <form class="flex flex-col gap-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="flex flex-col gap-2">
          <label for="admin-email" class="font-bold">ელფოსტა</label>
          <input
            id="admin-email"
            type="email"
            autocomplete="username"
            class="min-h-12 w-full rounded-chip border-2 border-plum bg-background px-4 text-plum"
            formControlName="email"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="admin-password" class="font-bold">პაროლი</label>
          <input
            id="admin-password"
            type="password"
            autocomplete="current-password"
            class="min-h-12 w-full rounded-chip border-2 border-plum bg-background px-4 text-plum"
            formControlName="password"
          />
        </div>

        @if (error(); as error) {
          <p class="m-0 flex items-center gap-1.5 text-sm font-semibold" role="alert">
            <lucide-icon class="shrink-0" [img]="alertIcon" [size]="18" />
            {{ error }}
          </p>
        }

        <button
          type="submit"
          class="min-h-12 cursor-pointer rounded-pill border-0 bg-plum px-6 font-bold text-blush disabled:cursor-wait disabled:opacity-70"
          [disabled]="submitting()"
        >
          {{ submitting() ? 'შესვლა…' : 'შესვლა' }}
        </button>
      </form>
    </main>
  `,
})
export class AdminLoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Bound from the query string by withComponentInputBinding. */
  readonly returnUrl = input<string>();

  protected readonly alertIcon = CircleAlert;
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.error.set('შეიყვანეთ ელფოსტა და პაროლი.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    try {
      await this.auth.signIn(email.trim(), password);
      await this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
    } catch (e) {
      this.error.set(FAILURE_MESSAGES[e instanceof SignInError ? e.failure : 'NETWORK']);
      this.form.controls.password.reset();
    } finally {
      this.submitting.set(false);
    }
  }
}
