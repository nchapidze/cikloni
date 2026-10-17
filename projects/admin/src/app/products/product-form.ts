import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  AbsorbencyLevel,
  AdminProduct,
  AdminVariant,
  HEX_COLOR_PATTERN,
  LocalizedText,
  SIZES,
  SLUG_PATTERN,
  Size,
  slugify,
} from '@cikloni/shared';

export type VariantForm = FormGroup<{
  id: FormControl<string | null>;
  /** The saved color id; null for a row added in this form (generated on save). */
  colorId: FormControl<string | null>;
  colorName: FormControl<LocalizedText | null>;
  colorHex: FormControl<string>;
  size: FormControl<Size>;
  stock: FormControl<number | null>;
  loadedStock: FormControl<number | null>;
  /** Left empty, it is generated on save (SLUG-COLOR-SIZE). */
  sku: FormControl<string>;
}>;

export type ProductForm = FormGroup<{
  slug: FormControl<string>;
  name: FormControl<LocalizedText | null>;
  description: FormControl<LocalizedText | null>;
  care: FormControl<LocalizedText | null>;
  priceGel: FormControl<number | null>;
  absorbency: FormControl<AbsorbencyLevel>;
  sortOrder: FormControl<number | null>;
  isActive: FormControl<boolean>;
  variants: FormArray<VariantForm>;
}>;

export type VariantValue = ReturnType<VariantForm['getRawValue']>;

const SLUG_MAX_LENGTH = 80;
const SKU_MAX_LENGTH = 64;
export const MAX_PRICE_GEL = 99_999.99;
export const DEFAULT_SWATCH = '#e8546b';

/** At most two decimals (tetri). */
const gelAmount: ValidatorFn = (control) => {
  const amount: number | null = control.value;
  if (amount === null) return null;
  return Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-6 ? null : { decimals: true };
};

const integer: ValidatorFn = (control) =>
  control.value === null || Number.isInteger(control.value) ? null : { integer: true };

const hexKey = (hex: string) => hex.toLowerCase();

/**
 * Problems that span rows: the same color and size twice, the same SKU twice, and one color
 * (hex) with different names. Each is a list of row indexes, for the editor to mark.
 */
export interface VariantProblems {
  duplicateVariants: number[];
  duplicateSkus: number[];
  colorNameMismatch: number[];
}

export function findVariantProblems(rows: VariantValue[]): VariantProblems {
  const duplicates = (key: (row: VariantValue) => string | null) => {
    const seen = new Map<string, number[]>();
    rows.forEach((row, index) => {
      const k = key(row);
      if (k) seen.set(k, [...(seen.get(k) ?? []), index]);
    });
    return [...seen.values()].filter((indexes) => indexes.length > 1).flat();
  };

  const nameByHex = new Map<string, string>();
  const colorNameMismatch: number[] = [];
  rows.forEach((row, index) => {
    const name = row.colorName?.ka?.trim() ?? '';
    const hex = hexKey(row.colorHex);
    const first = nameByHex.get(hex);
    if (first === undefined) nameByHex.set(hex, name);
    else if (first !== name) colorNameMismatch.push(index);
  });

  return {
    duplicateVariants: duplicates((row) => `${hexKey(row.colorHex)}|${row.size}`),
    duplicateSkus: duplicates((row) => row.sku.trim().toUpperCase() || null),
    colorNameMismatch,
  };
}

const variantRows: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const problems = findVariantProblems((control as FormArray<VariantForm>).getRawValue());
  return Object.values(problems).some((rows) => rows.length) ? { variants: problems } : null;
};

export function variantForm(variant?: Partial<AdminVariant>): VariantForm {
  return new FormGroup({
    id: new FormControl(variant?.id ?? null),
    colorId: new FormControl(variant?.colorId ?? null),
    colorName: new FormControl<LocalizedText | null>(variant?.colorName ?? null),
    colorHex: new FormControl(variant?.colorHex ?? DEFAULT_SWATCH, {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(HEX_COLOR_PATTERN)],
    }),
    size: new FormControl<Size>(variant?.size ?? 'M', { nonNullable: true }),
    stock: new FormControl<number | null>(variant?.stock ?? 0, [
      Validators.required,
      Validators.min(0),
      integer,
    ]),
    loadedStock: new FormControl(variant?.loadedStock ?? null),
    sku: new FormControl(variant?.sku ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(SKU_MAX_LENGTH)],
    }),
  });
}

export function productForm(product?: AdminProduct): ProductForm {
  return new FormGroup({
    slug: new FormControl(product?.slug ?? '', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(SLUG_PATTERN),
        Validators.maxLength(SLUG_MAX_LENGTH),
      ],
    }),
    name: new FormControl<LocalizedText | null>(product?.name ?? null),
    description: new FormControl<LocalizedText | null>(product?.description ?? null),
    care: new FormControl<LocalizedText | null>(product?.care ?? null),
    priceGel: new FormControl<number | null>(product?.priceGel ?? null, [
      Validators.min(0),
      Validators.max(MAX_PRICE_GEL),
      gelAmount,
    ]),
    absorbency: new FormControl<AbsorbencyLevel>(product?.absorbency ?? 'medium', {
      nonNullable: true,
    }),
    sortOrder: new FormControl<number | null>(product?.sortOrder ?? 0, [
      Validators.required,
      integer,
    ]),
    isActive: new FormControl(product?.isActive ?? false, { nonNullable: true }),
    variants: new FormArray(
      (product?.variants ?? []).map((v) => variantForm(v)),
      variantRows,
    ),
  });
}

/** A new row: the previous row's color in the first size it does not have yet. */
export function nextVariant(rows: VariantValue[]): Partial<AdminVariant> {
  const last = rows.at(-1);
  if (!last) return {};
  const taken = new Set(
    rows.filter((r) => hexKey(r.colorHex) === hexKey(last.colorHex)).map((r) => r.size),
  );
  const size = SIZES.find((s) => !taken.has(s));
  return size
    ? {
        colorId: last.colorId ?? undefined,
        colorName: last.colorName ?? undefined,
        colorHex: last.colorHex,
        size,
      }
    : {};
}

/**
 * The color id for every hex in the form. A saved color keeps its id (so images and carts
 * that refer to it keep working); a new color gets one from its English name (else its hex).
 */
export function assignColorIds(rows: VariantValue[]): Map<string, string> {
  const byHex = new Map<string, string>();
  const used = new Set<string>();
  for (const row of rows) {
    const hex = hexKey(row.colorHex);
    if (row.colorId && !byHex.has(hex) && !used.has(row.colorId)) {
      byHex.set(hex, row.colorId);
      used.add(row.colorId);
    }
  }
  for (const row of rows) {
    const hex = hexKey(row.colorHex);
    if (byHex.has(hex)) continue;
    const base = slugify(row.colorName?.en ?? '') || `color-${hex.slice(1)}`;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    byHex.set(hex, id);
    used.add(id);
  }
  return byHex;
}

/** The form's product (without images) as save_product expects it. */
export function toProductToSave(
  id: string,
  value: ReturnType<ProductForm['getRawValue']>,
  colorIds: Map<string, string>,
): Omit<AdminProduct, 'images'> {
  const trim = (text: LocalizedText | null): LocalizedText | null => {
    if (!text) return null;
    const en = text.en?.trim();
    return en ? { ka: text.ka.trim(), en } : { ka: text.ka.trim() };
  };
  return {
    id,
    slug: value.slug.trim(),
    name: trim(value.name) ?? { ka: '' },
    description: trim(value.description),
    care: trim(value.care),
    priceGel: value.priceGel,
    absorbency: value.absorbency,
    sortOrder: value.sortOrder ?? 0,
    isActive: value.isActive,
    variants: value.variants.map((row) => {
      const colorId = colorIds.get(hexKey(row.colorHex))!;
      return {
        id: row.id,
        colorId,
        colorName: trim(row.colorName) ?? { ka: '' },
        colorHex: hexKey(row.colorHex),
        size: row.size,
        stock: row.stock ?? 0,
        loadedStock: row.loadedStock,
        sku: row.sku.trim().toUpperCase() || `${value.slug}-${colorId}-${row.size}`.toUpperCase(),
      };
    }),
  };
}
