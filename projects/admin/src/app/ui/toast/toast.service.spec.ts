import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows toasts and hides them after a while, errors later than successes', () => {
    const toasts = TestBed.inject(ToastService);

    toasts.success('შენახულია');
    toasts.error('ვერ შეინახა');
    expect(toasts.toasts().map((t) => [t.kind, t.message])).toEqual([
      ['success', 'შენახულია'],
      ['error', 'ვერ შეინახა'],
    ]);

    vi.advanceTimersByTime(4000);
    expect(toasts.toasts().map((t) => t.kind)).toEqual(['error']);

    vi.advanceTimersByTime(4000);
    expect(toasts.toasts()).toEqual([]);
  });

  it('can be dismissed early', () => {
    const toasts = TestBed.inject(ToastService);
    toasts.success('შენახულია');

    toasts.dismiss(toasts.toasts()[0].id);

    expect(toasts.toasts()).toEqual([]);
  });
});
