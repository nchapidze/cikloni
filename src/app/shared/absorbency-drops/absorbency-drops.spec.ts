import { TestBed } from '@angular/core/testing';
import { AbsorbencyDrops } from './absorbency-drops';

describe('AbsorbencyDrops', () => {
  async function render(level: 1 | 2 | 3, label?: string) {
    const fixture = TestBed.createComponent(AbsorbencyDrops);
    fixture.componentRef.setInput('level', level);
    if (label) fixture.componentRef.setInput('label', label);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it.each([1, 2, 3] as const)('fills %i of 3 drops', async (level) => {
    const el = await render(level);
    const drops = [...el.querySelectorAll('[data-testid="drop"]')];
    expect(drops).toHaveLength(3);
    expect(drops.filter((d) => d.getAttribute('data-filled') === 'true')).toHaveLength(level);
  });

  it('is hidden from screen readers without a label', async () => {
    const el = await render(2);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
  });

  it('is exposed as a labelled image with a label', async () => {
    const el = await render(2, 'Absorbency: Medium');
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Absorbency: Medium');
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });
});
