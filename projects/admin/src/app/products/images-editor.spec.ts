import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '../ui/toast/toast.service';
import { ColorOption, ImageItem, ImagesEditor } from './images-editor';

@Component({
  imports: [ImagesEditor],
  template: `<app-images-editor
    [(images)]="images"
    [colors]="colors"
    (removed)="removed.push($event)"
  />`,
})
class Host {
  readonly images = signal<ImageItem[]>([]);
  readonly colors: ColorOption[] = [{ hex: '#e8546b', label: 'ვარდისფერი' }];
  readonly removed: ImageItem[] = [];
}

const saved = (key: string): ImageItem => ({
  key,
  id: key,
  storagePath: `p1/${key}.jpg`,
  file: null,
  url: `https://cdn.example/${key}.jpg`,
  colorHex: null,
});

const file = (name: string, type: string, size = 1000) =>
  new File([new Uint8Array(size)], name, { type });

async function render(images: ImageItem[] = []) {
  const error = vi.fn();
  TestBed.configureTestingModule({ providers: [{ provide: ToastService, useValue: { error } }] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.images.set(images);
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  const host = fixture.componentInstance;
  const pick = async (...files: File[]) => {
    const input = el.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };
  const button = (label: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.getAttribute('aria-label')?.includes(label),
    )!;
  return { fixture, el, host, pick, button, error };
}

describe('ImagesEditor', () => {
  beforeEach(() => {
    let n = 0;
    URL.createObjectURL = vi.fn(() => `blob:preview-${++n}`);
    URL.revokeObjectURL = vi.fn();
  });

  it('adds picked images as previews and rejects other files', async () => {
    const { host, pick, error } = await render();

    await pick(
      file('a.jpg', 'image/jpeg'),
      file('b.gif', 'image/gif'),
      file('c.png', 'image/png', 6 * 1024 * 1024),
    );

    expect(host.images().map((i) => [i.file?.name, i.url, i.id])).toEqual([
      ['a.jpg', 'blob:preview-1', null],
    ]);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('2 ფაილი ვერ დაემატა'));
  });

  it('marks the first image as the main one and reorders with the arrow buttons', async () => {
    const { el, host, button, fixture } = await render([saved('a'), saved('b')]);
    expect(el.querySelector('li')!.textContent).toContain('მთავარი');

    button('სურათი 1: უკან').click();
    await fixture.whenStable();

    expect(host.images().map((i) => i.key)).toEqual(['b', 'a']);
    expect(button('სურათი 1: წინ').disabled).toBe(true);
  });

  it('assigns an image to a color', async () => {
    const { el, host, fixture } = await render([saved('a')]);
    const select = el.querySelector('select')!;

    select.value = '#e8546b';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(host.images()[0].colorHex).toBe('#e8546b');
  });

  it('removes an image and reports it', async () => {
    const { host, button, fixture } = await render([saved('a'), saved('b')]);

    button('სურათი 2: წაშლა').click();
    await fixture.whenStable();

    expect(host.images().map((i) => i.key)).toEqual(['a']);
    expect(host.removed.map((i) => i.key)).toEqual(['b']);
  });
});
