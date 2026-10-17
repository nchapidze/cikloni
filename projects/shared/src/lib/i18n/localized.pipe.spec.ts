import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CURRENT_LANG, Lang, LocalizedText } from './localized-text';
import { LocalizedPipe } from './localized.pipe';

@Component({
  imports: [LocalizedPipe],
  template: `{{ text() | localized }}`,
})
class Host {
  readonly text = input<LocalizedText | null>(null);
}

describe('LocalizedPipe', () => {
  const lang = signal<Lang>('ka');

  beforeEach(() => {
    lang.set('ka');
    TestBed.configureTestingModule({ providers: [{ provide: CURRENT_LANG, useValue: lang }] });
  });

  async function render(text: LocalizedText | null) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentRef.setInput('text', text);
    await fixture.whenStable();
    return fixture;
  }

  it('shows Georgian by default', async () => {
    const fixture = await render({ ka: 'ბიკინი', en: 'Bikini' });
    expect(fixture.nativeElement.textContent).toBe('ბიკინი');
  });

  it('updates when the language changes', async () => {
    const fixture = await render({ ka: 'ბიკინი', en: 'Bikini' });
    lang.set('en');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toBe('Bikini');
  });

  it.each([{ ka: 'ბიკინი' }, { ka: 'ბიკინი', en: '  ' }])(
    'falls back to Georgian when English is missing or blank (%o)',
    async (text) => {
      const fixture = await render(text);
      lang.set('en');
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toBe('ბიკინი');
    },
  );

  it('renders nothing for null', async () => {
    const fixture = await render(null);
    expect(fixture.nativeElement.textContent).toBe('');
  });

  it('is Georgian when no app provides a language', async () => {
    TestBed.resetTestingModule();
    const fixture = await render({ ka: 'ბიკინი', en: 'Bikini' });
    expect(fixture.nativeElement.textContent).toBe('ბიკინი');
  });
});
