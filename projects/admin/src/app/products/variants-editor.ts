import { Component, inject, input } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { SIZES } from '@cikloni/shared';
import { LocalizedInput } from '@cikloni/shared/forms';
import { LucideAngularModule, Plus, Trash2 } from 'lucide-angular';
import { ConfirmService } from '../ui/confirm-dialog/confirm-dialog';
import { VariantForm, VariantProblems, nextVariant, variantForm } from './product-form';

const FIELD =
  'min-h-12 w-full rounded-chip border-2 border-plum bg-background px-4 text-plum aria-invalid:border-coral-strong';

/** The variants table: one card per color + size, added and removed freely until saved. */
@Component({
  selector: 'app-variants-editor',
  imports: [ReactiveFormsModule, LucideAngularModule, LocalizedInput],
  host: { class: 'flex flex-col gap-4' },
  template: `
    @if (!variants().length) {
      <p class="m-0 rounded-panel bg-blush p-4">
        ვარიანტები ჯერ არ არის. დაამატეთ ფერი და ზომა, რომ პროდუქტის ყიდვა შეიძლებოდეს.
      </p>
    }

    <ol class="m-0 flex list-none flex-col gap-4 p-0">
      @for (row of variants().controls; track row; let i = $index) {
        @let c = row.controls;
        @let rowErrors = problemsFor(i);
        <li
          class="flex flex-col gap-4 rounded-panel border-2 p-4"
          [class]="rowErrors.length ? 'border-coral-strong' : 'border-border'"
          [formGroup]="row"
        >
          <div class="flex items-center justify-between gap-3">
            <h3 class="m-0 text-base">
              ვარიანტი {{ i + 1 }}
              @if (!c.id.value) {
                <span class="ml-2 rounded-pill bg-sunny px-2 py-0.5 text-sm font-semibold"
                  >ახალი</span
                >
              }
            </h3>
            <button
              type="button"
              class="inline-flex size-11 cursor-pointer items-center justify-center rounded-pill border-2 border-plum bg-background text-plum"
              [attr.aria-label]="'ვარიანტის წაშლა: ' + describe(i)"
              (click)="remove(i)"
            >
              <lucide-icon [img]="trashIcon" [size]="20" />
            </button>
          </div>

          <div class="grid grid-cols-2 gap-4 md:grid-cols-12">
            <app-localized-input
              class="col-span-2 md:col-span-4"
              [fieldId]="'variant-' + i + '-color-name'"
              label="ფერის სახელი"
              formControlName="colorName"
              [showErrors]="showErrors()"
            />

            <div class="col-span-2 flex flex-col gap-2 sm:col-span-1 md:col-span-3">
              <label class="font-bold" [for]="'variant-' + i + '-hex'">ფერის კოდი</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  class="h-12 w-14 shrink-0 cursor-pointer rounded-chip border-2 border-plum bg-background p-1"
                  aria-label="ფერის არჩევა"
                  formControlName="colorHex"
                />
                <input
                  type="text"
                  [class]="field"
                  [id]="'variant-' + i + '-hex'"
                  maxlength="7"
                  spellcheck="false"
                  autocomplete="off"
                  formControlName="colorHex"
                  [attr.aria-invalid]="invalid(row, 'colorHex') || null"
                />
              </div>
              @if (invalid(row, 'colorHex')) {
                <p class="m-0 text-sm font-semibold">ფორმატი: #RRGGBB</p>
              }
            </div>

            <div class="flex flex-col gap-2 md:col-span-1">
              <label class="font-bold" [for]="'variant-' + i + '-size'">ზომა</label>
              <select
                class="cursor-pointer"
                [class]="field"
                [id]="'variant-' + i + '-size'"
                formControlName="size"
              >
                @for (size of sizes; track size) {
                  <option [value]="size">{{ size }}</option>
                }
              </select>
            </div>

            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="font-bold" [for]="'variant-' + i + '-stock'">მარაგი</label>
              <input
                type="number"
                [class]="field"
                [id]="'variant-' + i + '-stock'"
                min="0"
                step="1"
                inputmode="numeric"
                formControlName="stock"
                [attr.aria-invalid]="invalid(row, 'stock') || null"
              />
              @if (invalid(row, 'stock')) {
                <p class="m-0 text-sm font-semibold">0 ან მეტი, მთელი რიცხვი.</p>
              }
            </div>

            <div class="col-span-2 flex flex-col gap-2 md:col-span-2">
              <label class="font-bold" [for]="'variant-' + i + '-sku'">SKU</label>
              <input
                type="text"
                [class]="field"
                [id]="'variant-' + i + '-sku'"
                maxlength="64"
                spellcheck="false"
                autocomplete="off"
                placeholder="ავტომატური"
                formControlName="sku"
              />
            </div>
          </div>

          @for (message of rowErrors; track message) {
            <p class="m-0 text-sm font-semibold" role="alert">{{ message }}</p>
          }
        </li>
      }
    </ol>

    <button
      type="button"
      class="inline-flex min-h-12 cursor-pointer items-center gap-2 self-start rounded-pill border-2 border-plum bg-background px-6 font-bold text-plum"
      (click)="add()"
    >
      <lucide-icon [img]="plusIcon" [size]="20" />
      ვარიანტის დამატება
    </button>
  `,
})
export class VariantsEditor {
  private readonly confirm = inject(ConfirmService);

  readonly variants = input.required<FormArray<VariantForm>>();
  /** Show errors on untouched fields too (after a save attempt). */
  readonly showErrors = input(false);

  protected readonly sizes = SIZES;
  protected readonly field = FIELD;
  protected readonly plusIcon = Plus;
  protected readonly trashIcon = Trash2;

  protected invalid(row: VariantForm, name: 'colorHex' | 'stock'): boolean {
    const control = row.controls[name];
    return control.invalid && (control.touched || this.showErrors());
  }

  /** Messages for problems spanning rows (see findVariantProblems). */
  protected problemsFor(index: number): string[] {
    const problems: VariantProblems | undefined = this.variants().errors?.['variants'];
    if (!problems) return [];
    return [
      problems.duplicateVariants.includes(index) ? 'ეს ფერი და ზომა უკვე არის სხვა ვარიანტში.' : '',
      problems.duplicateSkus.includes(index) ? 'ეს SKU უკვე გამოყენებულია სხვა ვარიანტში.' : '',
      problems.colorNameMismatch.includes(index)
        ? 'ამ ფერის სხვა ვარიანტებს სხვა სახელი აქვს. ერთი ფერის სახელი ყველგან ერთნაირი უნდა იყოს.'
        : '',
    ].filter(Boolean);
  }

  protected describe(index: number): string {
    const { colorName, size } = this.variants().at(index).getRawValue();
    return `${colorName?.ka || 'უსახელო ფერი'}, ${size}`;
  }

  protected add(): void {
    const array = this.variants();
    array.push(variantForm(nextVariant(array.getRawValue())));
    array.markAsDirty();
  }

  /** Saved variants ask first; they are deleted from the database when the product is saved. */
  protected async remove(index: number): Promise<void> {
    const array = this.variants();
    const row = array.at(index);
    if (row.controls.id.value) {
      const confirmed = await this.confirm.confirm({
        title: 'ვარიანტის წაშლა',
        message: `ვარიანტი „${this.describe(index)}“ წაიშლება პროდუქტის შენახვისას. შეკვეთების ისტორიაში ის დარჩება.`,
        confirmLabel: 'წაშლა',
        danger: true,
      });
      if (!confirmed) return;
    }
    // The row may have moved while the dialog was open.
    const current = array.controls.indexOf(row);
    if (current === -1) return;
    array.removeAt(current);
    array.markAsDirty();
  }
}
