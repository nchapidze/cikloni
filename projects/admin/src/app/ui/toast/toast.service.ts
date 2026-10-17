import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

/** Errors stay longer: they usually need reading and acting on. */
const DURATION_MS: Record<ToastKind, number> = { success: 4000, error: 8000 };

/** Short success / error messages, shown by ToastOutlet (in the admin layout). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly list = signal<Toast[]>([]);

  readonly toasts = this.list.asReadonly();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  dismiss(id: number): void {
    this.list.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(kind: ToastKind, message: string): void {
    const id = this.nextId++;
    this.list.update((toasts) => [...toasts, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), DURATION_MS[kind]);
  }
}
