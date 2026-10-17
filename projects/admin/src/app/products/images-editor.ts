import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, inject, input, model, output, signal } from '@angular/core';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from '@cikloni/shared/admin';
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImagePlus,
  LucideAngularModule,
  Trash2,
} from 'lucide-angular';
import { ToastService } from '../ui/toast/toast.service';

/** An image in the form: saved (storagePath) or picked and not uploaded yet (file). */
export interface ImageItem {
  /** Stable key for tracking and ids. */
  key: string;
  id: string | null;
  storagePath: string | null;
  file: File | null;
  /** Public URL, or an object URL for a picked file. */
  url: string;
  /** The color it is shown for, by swatch hex (ids of new colors exist only after saving). */
  colorHex: string | null;
}

export interface ColorOption {
  hex: string;
  label: string;
}

/** Picked files become previews right away; they are uploaded when the product is saved. */
export function imageFromFile(file: File): ImageItem {
  return {
    key: crypto.randomUUID(),
    id: null,
    storagePath: null,
    file,
    url: URL.createObjectURL(file),
    colorHex: null,
  };
}

/** Product photos: add (pick or drop), preview, reorder (drag or arrow buttons), assign a color, delete. */
@Component({
  selector: 'app-images-editor',
  imports: [CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, LucideAngularModule],
  host: { class: 'flex flex-col gap-4' },
  template: `
    <label
      class="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed border-plum p-6 text-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-plum"
      [class]="dragOver() ? 'bg-lilac-tint' : 'bg-blush'"
      (dragover)="onDragOver($event)"
      (dragleave)="dragOver.set(false)"
      (drop)="onDrop($event)"
    >
      <lucide-icon [img]="addIcon" [size]="28" />
      <span class="font-bold">სურათების დამატება</span>
      <span class="text-sm">აირჩიეთ ან ჩააგდეთ აქ · JPG, PNG, WebP, AVIF · მაქს. 5 MB</span>
      <input type="file" class="sr-only" multiple [accept]="accept" (change)="onPick($event)" />
    </label>

    @if (images().length) {
      <p class="m-0 text-sm">
        პირველი სურათი მთავარია. თანმიმდევრობის შესაცვლელად გადაათრიეთ ან გამოიყენეთ ისრები.
      </p>
      <ul
        class="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3 lg:grid-cols-4"
        cdkDropList
        cdkDropListOrientation="mixed"
        (cdkDropListDropped)="onReorder($event)"
      >
        @for (image of images(); track image.key; let i = $index, first = $first, last = $last) {
          <li
            class="flex flex-col gap-2 rounded-panel border-2 border-border bg-background p-2"
            cdkDrag
            [cdkDragData]="image"
          >
            <div
              class="min-h-40 rounded-panel border-2 border-dashed border-plum bg-blush"
              *cdkDragPlaceholder
            ></div>
            <div class="relative">
              <img
                class="block aspect-square w-full rounded-chip bg-blush object-cover"
                [src]="image.url"
                [alt]="'სურათი ' + (i + 1)"
              />
              @if (first) {
                <span
                  class="absolute top-2 left-2 rounded-pill bg-plum px-2 py-0.5 text-sm font-semibold text-blush"
                >
                  მთავარი
                </span>
              }
              @if (!image.id) {
                <span
                  class="absolute top-2 right-2 rounded-pill bg-sunny px-2 py-0.5 text-sm font-semibold"
                >
                  ახალი
                </span>
              }
            </div>

            <label class="sr-only" [for]="'image-color-' + image.key">სურათის ფერი</label>
            <select
              class="min-h-11 w-full cursor-pointer rounded-chip border-2 border-plum bg-background px-3 text-sm text-plum"
              [id]="'image-color-' + image.key"
              (change)="setColor(image, $any($event.target).value)"
            >
              <option value="" [selected]="!image.colorHex">ყველა ფერი</option>
              @for (color of colors(); track color.hex) {
                <option [value]="color.hex" [selected]="color.hex === image.colorHex">
                  {{ color.label }}
                </option>
              }
            </select>

            <div class="flex items-center justify-between gap-1">
              <span
                class="inline-flex size-11 cursor-grab items-center justify-center text-plum"
                cdkDragHandle
                title="გადაათრიეთ"
                aria-hidden="true"
              >
                <lucide-icon [img]="dragIcon" [size]="20" />
              </span>
              <span class="flex gap-1">
                <button
                  type="button"
                  [class]="iconButton"
                  [disabled]="first"
                  [attr.aria-label]="'სურათი ' + (i + 1) + ': წინ გადატანა'"
                  (click)="move(i, -1)"
                >
                  <lucide-icon [img]="leftIcon" [size]="18" />
                </button>
                <button
                  type="button"
                  [class]="iconButton"
                  [disabled]="last"
                  [attr.aria-label]="'სურათი ' + (i + 1) + ': უკან გადატანა'"
                  (click)="move(i, 1)"
                >
                  <lucide-icon [img]="rightIcon" [size]="18" />
                </button>
                <button
                  type="button"
                  [class]="iconButton"
                  [attr.aria-label]="'სურათი ' + (i + 1) + ': წაშლა'"
                  (click)="remove(image)"
                >
                  <lucide-icon [img]="trashIcon" [size]="18" />
                </button>
              </span>
            </div>
          </li>
        }
      </ul>
    } @else {
      <p class="m-0 text-sm">სურათები ჯერ არ არის.</p>
    }
  `,
})
export class ImagesEditor {
  private readonly toast = inject(ToastService);

  readonly images = model.required<ImageItem[]>();
  /** Colors of the current variants, for assigning an image to one. */
  readonly colors = input.required<ColorOption[]>();
  /** An image was taken out of the list (the page deletes saved ones on save). */
  readonly removed = output<ImageItem>();

  protected readonly accept = IMAGE_TYPES.join(',');
  protected readonly dragOver = signal(false);
  protected readonly iconButton =
    'inline-flex size-11 cursor-pointer items-center justify-center rounded-pill border-2 border-plum bg-background text-plum disabled:cursor-not-allowed disabled:opacity-40';
  protected readonly addIcon = ImagePlus;
  protected readonly dragIcon = GripVertical;
  protected readonly leftIcon = ChevronLeft;
  protected readonly rightIcon = ChevronRight;
  protected readonly trashIcon = Trash2;

  protected onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.add(input.files);
    input.value = ''; // so picking the same file again fires change
  }

  protected onDragOver(event: DragEvent): void {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    this.add(event.dataTransfer?.files ?? null);
  }

  protected onReorder(event: CdkDragDrop<unknown>): void {
    this.reorder(event.previousIndex, event.currentIndex);
  }

  protected move(index: number, delta: -1 | 1): void {
    this.reorder(index, index + delta);
  }

  protected setColor(image: ImageItem, hex: string): void {
    this.images.update((list) =>
      list.map((item) => (item === image ? { ...item, colorHex: hex || null } : item)),
    );
  }

  protected remove(image: ImageItem): void {
    this.images.update((list) => list.filter((item) => item !== image));
    this.removed.emit(image);
  }

  private reorder(from: number, to: number): void {
    if (from === to) return;
    this.images.update((list) => {
      const next = [...list];
      moveItemInArray(next, from, to);
      return next;
    });
  }

  private add(files: FileList | null): void {
    const picked = [...(files ?? [])];
    const valid = picked.filter((f) => IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_BYTES);
    const rejected = picked.length - valid.length;
    if (rejected) {
      this.toast.error(
        `${rejected} ფაილი ვერ დაემატა: დასაშვებია JPG, PNG, WebP ან AVIF, მაქსიმუმ 5 MB.`,
      );
    }
    if (valid.length) this.images.update((list) => [...list, ...valid.map(imageFromFile)]);
  }
}
