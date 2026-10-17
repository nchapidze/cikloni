import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LocalizedText } from '../../i18n/localized-text';
import { LocalizedInput } from './localized-input';

@Component({
  imports: [ReactiveFormsModule, LocalizedInput],
  template: `<app-localized-input
    fieldId="name"
    label="სახელი"
    [multiline]="multiline()"
    [required]="required()"
    [formControl]="control"
  />`,
})
class Host {
  readonly multiline = input(false);
  readonly required = input(true);
  readonly control = new FormControl<LocalizedText | null>(null);
}

async function render(value: LocalizedText | null, inputs: Partial<Record<string, unknown>> = {}) {
  const fixture = TestBed.createComponent(Host);
  for (const [name, v] of Object.entries(inputs)) fixture.componentRef.setInput(name, v);
  fixture.componentInstance.control.setValue(value);
  await fixture.whenStable();

  const el: HTMLElement = fixture.nativeElement;
  const field = () => el.querySelector<HTMLInputElement | HTMLTextAreaElement>('#name')!;
  const tab = (lang: string) => el.querySelector<HTMLButtonElement>(`#name-tab-${lang}`)!;
  const type = async (text: string) => {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  return { fixture, el, field, tab, type, control: fixture.componentInstance.control };
}

const hasDot = (tab: HTMLElement) => !!tab.querySelector('[aria-hidden="true"]');

describe('LocalizedInput', () => {
  it('edits Georgian by default and English on the EN tab', async () => {
    const { field, tab, type, control, fixture } = await render({ ka: 'ბიკინი', en: 'Bikini' });

    expect(field().value).toBe('ბიკინი');
    expect(tab('ka').getAttribute('aria-selected')).toBe('true');

    tab('en').click();
    await fixture.whenStable();
    expect(field().value).toBe('Bikini');
    expect(field().getAttribute('lang')).toBe('en');

    await type('Floral bikini');
    expect(control.value).toEqual({ ka: 'ბიკინი', en: 'Floral bikini' });
  });

  it('leaves English out of the value when it is blank', async () => {
    const { tab, type, control, fixture } = await render({ ka: 'ბიკინი', en: 'Bikini' });

    tab('en').click();
    await fixture.whenStable();
    await type('');

    expect(control.value).toEqual({ ka: 'ბიკინი' });
  });

  it('shows a dot on a tab whose text is missing', async () => {
    const { tab, type } = await render({ ka: 'ბიკინი' });

    expect(hasDot(tab('ka'))).toBe(false);
    expect(hasDot(tab('en'))).toBe(true);

    await type('');
    expect(hasDot(tab('ka'))).toBe(true);
  });

  it('is invalid while Georgian is empty, and shows it once touched', async () => {
    const { el, field, control, fixture } = await render({ ka: '  ', en: 'Bikini' });

    expect(control.hasError('localizedRequired')).toBe(true);
    expect(field().getAttribute('aria-invalid')).toBeNull();

    field().dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(el.textContent).toContain('ქართული ტექსტი სავალდებულოა');
  });

  it('can be optional', async () => {
    const { control } = await render(null, { required: false });

    expect(control.valid).toBe(true);
  });

  it('renders a textarea when multiline', async () => {
    const { field } = await render({ ka: 'აღწერა' }, { multiline: true });

    expect(field().tagName).toBe('TEXTAREA');
  });

  it('follows the control being disabled', async () => {
    const { field, tab, control, fixture } = await render({ ka: 'ბიკინი' });

    control.disable();
    await fixture.whenStable();

    expect(field().disabled).toBe(true);
    expect(tab('en').disabled).toBe(true);
  });

  it('moves between tabs with the arrow keys', async () => {
    const { tab, field, fixture } = await render({ ka: 'ბიკინი', en: 'Bikini' });

    tab('ka').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await fixture.whenStable();

    expect(tab('en').getAttribute('aria-selected')).toBe('true');
    expect(field().value).toBe('Bikini');
  });
});
