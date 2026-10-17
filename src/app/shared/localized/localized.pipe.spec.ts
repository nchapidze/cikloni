import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { LanguageService } from '../../core/i18n/language.service';
import { LocalizedText } from '../../core/i18n/localized-text';
import { provideTranslateTesting } from '../../../testing/translate-testing';
import { LocalizedPipe } from './localized.pipe';

@Component({
  imports: [LocalizedPipe],
  template: `{{ text() | localized }}`,
})
class Host {
  readonly text = input<LocalizedText | null>(null);
}

describe('LocalizedPipe', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideTranslateTesting()] });
  });

  async function render(text: LocalizedText | null) {
    await firstValueFrom(TestBed.inject(LanguageService).init());
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
    await firstValueFrom(TestBed.inject(LanguageService).use('en'));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toBe('Bikini');
  });

  it.each([{ ka: 'ბიკინი' }, { ka: 'ბიკინი', en: '  ' }])(
    'falls back to Georgian when English is missing or blank (%o)',
    async (text) => {
      const fixture = await render(text);
      await firstValueFrom(TestBed.inject(LanguageService).use('en'));
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toBe('ბიკინი');
    },
  );

  it('renders nothing for null', async () => {
    const fixture = await render(null);
    expect(fixture.nativeElement.textContent).toBe('');
  });
});
