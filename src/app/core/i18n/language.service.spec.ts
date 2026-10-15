import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import en from '../../../assets/i18n/en.json';
import ka from '../../../assets/i18n/ka.json';
import { provideTranslateTesting } from '../../../testing/translate-testing';
import { LanguageService } from './language.service';

function keys(node: unknown, prefix = ''): string[] {
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    value && typeof value === 'object' ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideTranslateTesting()] });
  });

  it('ka.json and en.json have the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(ka).sort());
  });

  it('defaults to Georgian', async () => {
    const service = TestBed.inject(LanguageService);
    await firstValueFrom(service.init());

    expect(service.current()).toBe('ka');
    expect(document.documentElement.lang).toBe('ka');
    expect(TestBed.inject(TranslateService).instant('HEADER.NAV.SHOP')).toBe('მაღაზია');
  });

  it('restores the saved language on startup', async () => {
    localStorage.setItem('cikloni.lang', 'en');
    const service = TestBed.inject(LanguageService);
    await firstValueFrom(service.init());

    expect(service.current()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('ignores an invalid saved value', async () => {
    localStorage.setItem('cikloni.lang', 'fr');
    const service = TestBed.inject(LanguageService);
    await firstValueFrom(service.init());

    expect(service.current()).toBe('ka');
  });

  it('toggles, saves the choice and updates <html lang>', async () => {
    const service = TestBed.inject(LanguageService);
    await firstValueFrom(service.init());

    service.toggle();

    expect(service.current()).toBe('en');
    expect(localStorage.getItem('cikloni.lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(TestBed.inject(TranslateService).instant('HEADER.NAV.SHOP')).toBe('Shop');
  });
});
