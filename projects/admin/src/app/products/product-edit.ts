import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
  untracked,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ABSORBENCY_LEVELS, AdminProduct, ProductSaveFailure, slugify } from '@cikloni/shared';
import { AdminProductsApi, ImageToSave, ProductSaveError } from '@cikloni/shared/admin';
import { LocalizedInput } from '@cikloni/shared/forms';
import { ArrowLeft, LucideAngularModule, Trash2 } from 'lucide-angular';
import { map, startWith, switchMap } from 'rxjs';
import { ConfirmService } from '../ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../ui/toast/toast.service';
import { ColorOption, ImageItem, ImagesEditor } from './images-editor';
import { ABSORBENCY_LABELS } from './product-display';
import {
  MAX_PRICE_GEL,
  ProductForm,
  assignColorIds,
  productForm,
  toProductToSave,
} from './product-form';
import { VariantsEditor } from './variants-editor';

const SAVE_MESSAGES: Record<ProductSaveFailure, string> = {
  SLUG_TAKEN: 'ეს slug უკვე სხვა პროდუქტს აქვს. აირჩიეთ სხვა.',
  SKU_TAKEN: 'ერთ-ერთი SKU უკვე გამოყენებულია სხვა პროდუქტში.',
  DUPLICATE_VARIANT: 'ერთი და იგივე ფერი და ზომა ორჯერ არის.',
  STOCK_CHANGED:
    'მარაგი შეიცვალა რედაქტირებისას (შემოვიდა შეკვეთა) და უარყოფითი გახდებოდა. გადაამოწმეთ მარაგი.',
  INVALID_PRODUCT: 'ზოგიერთი მნიშვნელობა არასწორია. გადაამოწმეთ ველები.',
  UPLOAD_FAILED: 'სურათების ატვირთვა ვერ მოხერხდა. სცადეთ თავიდან.',
  FORBIDDEN: 'პროდუქტის შენახვის უფლება არ გაქვთ.',
  NETWORK: 'პროდუქტი ვერ შეინახა. სცადეთ თავიდან.',
};

const FIELD =
  'min-h-12 w-full rounded-chip border-2 border-plum bg-background px-4 text-plum aria-invalid:border-coral-strong';

/** /products/new and /products/:id: the product, its variants and images, saved together. */
@Component({
  selector: 'app-admin-product-edit-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    LocalizedInput,
    VariantsEditor,
    ImagesEditor,
  ],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <a
      class="inline-flex min-h-11 items-center gap-2 self-start font-semibold"
      routerLink="/products"
    >
      <lucide-icon [img]="backIcon" [size]="20" />
      ყველა პროდუქტი
    </a>

    @if (product.error() && !product.isLoading()) {
      <div class="flex flex-col items-start gap-4 rounded-card bg-blush p-6" role="alert">
        <p class="m-0">პროდუქტი ვერ ჩაიტვირთა.</p>
        <button
          type="button"
          class="min-h-11 cursor-pointer rounded-pill border-0 bg-plum px-6 font-bold text-blush"
          (click)="product.reload()"
        >
          თავიდან ცდა
        </button>
      </div>
    } @else if (!isNew() && !product.hasValue()) {
      <p class="m-0" role="status">იტვირთება…</p>
    } @else if (!isNew() && !product.value()) {
      <div class="flex flex-col items-start gap-3 rounded-card bg-blush p-6" role="alert">
        <h1 class="m-0 text-3xl">პროდუქტი ვერ მოიძებნა</h1>
        <a class="inline-flex min-h-11 items-center" routerLink="/products">ყველა პროდუქტი</a>
      </div>
    } @else {
      @let f = form();
      @let c = f.controls;
      <h1 class="m-0 text-3xl md:text-h2">{{ isNew() ? 'ახალი პროდუქტი' : title() }}</h1>

      <form class="flex flex-col gap-8" [formGroup]="f" (ngSubmit)="save()" novalidate>
        <section
          class="flex flex-col gap-5 rounded-card border-2 border-border p-5"
          aria-labelledby="basics"
        >
          <h2 id="basics" class="m-0 text-h3">ძირითადი</h2>

          <app-localized-input
            fieldId="product-name"
            label="სახელი"
            formControlName="name"
            [showErrors]="submitted()"
          />

          <div class="flex flex-col gap-2">
            <label for="product-slug" class="font-bold">Slug (მისამართი)</label>
            <p id="product-slug-hint" class="m-0 text-sm">
              cikloni.ge/product/{{ c.slug.value || '…' }} ·
              @if (isNew()) {
                ავტომატურად იქმნება ინგლისური სახელიდან, შეგიძლიათ შეცვალოთ.
              } @else {
                შეცვლისას ძველი ბმულები აღარ იმუშავებს.
              }
            </p>
            <input
              id="product-slug"
              type="text"
              [class]="field"
              spellcheck="false"
              autocomplete="off"
              maxlength="80"
              formControlName="slug"
              aria-describedby="product-slug-hint"
              [attr.aria-invalid]="showError('slug') || null"
            />
            @if (showError('slug')) {
              <p class="m-0 text-sm font-semibold">
                @if (c.slug.hasError('taken')) {
                  ეს slug უკვე სხვა პროდუქტს აქვს.
                } @else if (c.slug.hasError('required')) {
                  Slug სავალდებულოა (ჩაწერეთ ინგლისური სახელი ან თავად slug).
                } @else {
                  მხოლოდ ლათინური პატარა ასოები, ციფრები და დეფისი, მაგ. floral-bikini.
                }
              </p>
            }
          </div>

          <app-localized-input
            fieldId="product-description"
            label="აღწერა"
            formControlName="description"
            [multiline]="true"
            [rows]="5"
            [showErrors]="submitted()"
          />
          <app-localized-input
            fieldId="product-care"
            label="მოვლის ინსტრუქცია"
            formControlName="care"
            [multiline]="true"
            [showErrors]="submitted()"
          />

          <div class="grid gap-5 sm:grid-cols-3">
            <div class="flex flex-col gap-2">
              <label for="product-price" class="font-bold">ფასი (₾)</label>
              <input
                id="product-price"
                type="number"
                [class]="field"
                min="0"
                [max]="maxPrice"
                step="0.01"
                inputmode="decimal"
                placeholder="არ არის"
                formControlName="priceGel"
                aria-describedby="product-price-hint"
                [attr.aria-invalid]="showError('priceGel') || null"
              />
              <p id="product-price-hint" class="m-0 text-sm">
                @if (showError('priceGel')) {
                  <strong>0-დან {{ maxPrice }}-მდე, მაქსიმუმ 2 ათწილადით.</strong>
                } @else {
                  ცარიელი = ფასი ჯერ არ არის (ყიდვა შეუძლებელია).
                }
              </p>
            </div>

            <div class="flex flex-col gap-2">
              <label for="product-absorbency" class="font-bold">შთანთქმა</label>
              <select
                id="product-absorbency"
                class="cursor-pointer"
                [class]="field"
                formControlName="absorbency"
              >
                @for (level of absorbencyLevels; track level) {
                  <option [value]="level">{{ absorbencyLabels[level] }}</option>
                }
              </select>
            </div>

            <div class="flex flex-col gap-2">
              <label for="product-sort" class="font-bold">რიგითობა</label>
              <input
                id="product-sort"
                type="number"
                [class]="field"
                step="1"
                inputmode="numeric"
                formControlName="sortOrder"
                aria-describedby="product-sort-hint"
                [attr.aria-invalid]="showError('sortOrder') || null"
              />
              <p id="product-sort-hint" class="m-0 text-sm">
                @if (showError('sortOrder')) {
                  <strong>მთელი რიცხვი.</strong>
                } @else {
                  ნაკლები ჩანს პირველი.
                }
              </p>
            </div>
          </div>

          <label class="flex min-h-11 cursor-pointer items-center gap-3 self-start font-bold">
            <input
              type="checkbox"
              class="size-5 cursor-pointer accent-plum"
              formControlName="isActive"
            />
            აქტიური (ჩანს მაღაზიაში)
          </label>
        </section>

        <section
          class="flex flex-col gap-5 rounded-card border-2 border-border p-5"
          aria-labelledby="variants"
        >
          <h2 id="variants" class="m-0 text-h3">ვარიანტები</h2>
          <app-variants-editor [variants]="c.variants" [showErrors]="submitted()" />
        </section>

        <section
          class="flex flex-col gap-5 rounded-card border-2 border-border p-5"
          aria-labelledby="images"
        >
          <h2 id="images" class="m-0 text-h3">სურათები</h2>
          <app-images-editor
            [(images)]="images"
            [colors]="colorOptions()"
            (removed)="onImageRemoved($event)"
          />
        </section>

        <div
          class="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-border bg-background px-4 py-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8"
        >
          @if (!isNew()) {
            <button
              type="button"
              class="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-pill border-2 border-plum bg-background px-6 font-bold text-plum disabled:cursor-wait disabled:opacity-60"
              [disabled]="busy()"
              (click)="deleteProduct()"
            >
              <lucide-icon [img]="trashIcon" [size]="20" />
              პროდუქტის წაშლა
            </button>
          }
          <button
            type="submit"
            class="ml-auto min-h-12 cursor-pointer rounded-pill border-0 bg-plum px-8 font-bold text-blush disabled:cursor-wait disabled:opacity-60"
            [disabled]="busy()"
          >
            {{ saving() ? 'ინახება…' : isNew() ? 'პროდუქტის შექმნა' : 'შენახვა' }}
          </button>
        </div>
      </form>
    }
  `,
})
export class AdminProductEditPage {
  private readonly api = inject(AdminProductsApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Route param; undefined on /products/new. */
  readonly id = input<string>();

  protected readonly isNew = computed(() => !this.id());
  /** A new product's id is made here, so its images can be uploaded under it before it exists. */
  private readonly newId = crypto.randomUUID();
  private readonly productId = computed(() => this.id() ?? this.newId);

  protected readonly product = resource({
    params: () => this.id(),
    loader: ({ params, abortSignal }) => this.api.getProduct(params, abortSignal),
  });

  protected readonly form = signal<ProductForm>(productForm());
  protected readonly images = signal<ImageItem[]>([]);
  /** Saved images removed in this form; their files are deleted after a successful save. */
  private removedPaths: string[] = [];

  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly busy = computed(() => this.saving() || this.product.isLoading());

  private readonly formValue = toSignal(
    toObservable(this.form).pipe(
      switchMap((f) =>
        f.valueChanges.pipe(
          startWith(null),
          map(() => f.getRawValue()),
        ),
      ),
    ),
    { initialValue: this.form().getRawValue() },
  );

  protected readonly title = computed(() => this.formValue().name?.ka || 'უსახელო პროდუქტი');

  /** One option per color (by hex) in the variants, for assigning images. */
  protected readonly colorOptions = computed<ColorOption[]>(() => {
    const options = new Map<string, ColorOption>();
    for (const row of this.formValue().variants) {
      const hex = row.colorHex.toLowerCase();
      if (!options.has(hex)) options.set(hex, { hex, label: row.colorName?.ka || hex });
    }
    return [...options.values()];
  });

  protected readonly field = FIELD;
  protected readonly maxPrice = MAX_PRICE_GEL;
  protected readonly absorbencyLevels = ABSORBENCY_LEVELS;
  protected readonly absorbencyLabels = ABSORBENCY_LABELS;
  protected readonly backIcon = ArrowLeft;
  protected readonly trashIcon = Trash2;

  constructor() {
    // Load (and after each save, reload) the form from the database.
    effect(() => {
      const loaded = this.product.hasValue() ? this.product.value() : null;
      if (loaded) untracked(() => this.populate(loaded));
    });
    effect(() => {
      if (this.isNew()) untracked(() => this.autoSlug());
    });
    inject(DestroyRef).onDestroy(() => this.revokePreviews(this.images()));
  }

  protected showError(name: 'slug' | 'priceGel' | 'sortOrder'): boolean {
    const control = this.form().controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected onImageRemoved(image: ImageItem): void {
    if (image.storagePath) this.removedPaths.push(image.storagePath);
    if (image.file) URL.revokeObjectURL(image.url);
  }

  protected async save(): Promise<void> {
    if (this.busy()) return;
    const form = this.form();
    this.submitted.set(true);
    form.markAllAsTouched();
    if (form.invalid) {
      this.toast.error('შეასწორეთ მონიშნული ველები.');
      this.focusFirstInvalid();
      return;
    }

    const value = form.getRawValue();
    const colorIds = assignColorIds(value.variants);
    const product = toProductToSave(this.productId(), value, colorIds);
    const images: ImageToSave[] = this.images().map((image) => {
      const colorId = image.colorHex ? (colorIds.get(image.colorHex.toLowerCase()) ?? null) : null;
      return image.id && image.storagePath
        ? { id: image.id, storagePath: image.storagePath, colorId }
        : { id: null, file: image.file!, colorId };
    });

    this.saving.set(true);
    try {
      await this.api.saveProduct({ product, images, removedPaths: this.removedPaths });
      this.toast.success(`„${product.name.ka}“ შენახულია.`);
      if (this.isNew()) {
        await this.router.navigate(['/products', product.id], { replaceUrl: true });
      } else {
        this.product.reload();
      }
    } catch (e) {
      const failure = e instanceof ProductSaveError ? e.failure : 'NETWORK';
      this.toast.error(SAVE_MESSAGES[failure]);
      if (failure === 'SLUG_TAKEN') {
        form.controls.slug.setErrors({ taken: true });
        this.focusFirstInvalid();
      }
    } finally {
      this.saving.set(false);
    }
  }

  protected async deleteProduct(): Promise<void> {
    const loaded = this.product.value();
    if (!loaded || this.busy()) return;
    const confirmed = await this.confirm.confirm({
      title: 'პროდუქტის წაშლა',
      message: `„${loaded.name.ka}“ წაიშლება ყველა ვარიანტთან და სურათთან ერთად. შეკვეთების ისტორიაში ის დარჩება. წაშლას ვერ დააბრუნებთ; თუ მხოლოდ დამალვა გინდათ, გამორთეთ „აქტიური“.`,
      confirmLabel: 'წაშლა',
      danger: true,
    });
    if (!confirmed) return;

    this.saving.set(true);
    try {
      const paths = [...loaded.images.map((image) => image.storagePath), ...this.removedPaths];
      await this.api.deleteProduct(loaded.id, paths);
      this.toast.success(`„${loaded.name.ka}“ წაიშალა.`);
      await this.router.navigate(['/products']);
    } catch {
      this.toast.error('პროდუქტი ვერ წაიშალა. სცადეთ თავიდან.');
    } finally {
      this.saving.set(false);
    }
  }

  private populate(product: AdminProduct): void {
    this.revokePreviews(this.images());
    const hexById = new Map(product.variants.map((v) => [v.colorId, v.colorHex.toLowerCase()]));
    this.form.set(productForm(product));
    this.images.set(
      product.images.map((image) => ({
        key: image.id ?? crypto.randomUUID(),
        id: image.id,
        storagePath: image.storagePath,
        file: null,
        url: this.api.imageUrl(image.storagePath),
        colorHex: (image.colorId && hexById.get(image.colorId)) || null,
      })),
    );
    this.removedPaths = [];
    this.submitted.set(false);
  }

  /** New product: the slug follows the English name until the admin edits the slug. */
  private autoSlug(): void {
    const { name, slug } = this.form().controls;
    name.valueChanges.subscribe((value) => {
      if (!slug.dirty) slug.setValue(slugify(value?.en ?? ''));
    });
  }

  private focusFirstInvalid(): void {
    afterNextRender(
      () => {
        const field = this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]');
        field?.focus();
        field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      },
      { injector: this.injector },
    );
  }

  private revokePreviews(images: ImageItem[]): void {
    for (const image of images) if (image.file) URL.revokeObjectURL(image.url);
  }
}
