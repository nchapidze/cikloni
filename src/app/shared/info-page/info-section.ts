import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * One titled section of an info page. Renders the given paragraph and bullet keys in order
 * (paragraphs, then bullets, then `after`); anything else is projected after them.
 */
@Component({
  selector: 'app-info-section',
  imports: [TranslatePipe],
  template: `
    <section class="flex flex-col gap-3" [attr.aria-labelledby]="sectionId() + '-title'">
      <h2 [id]="sectionId() + '-title'" class="m-0 text-2xl md:text-3xl">
        {{ titleKey() | translate }}
      </h2>
      @for (key of paragraphs(); track key) {
        <p class="m-0">{{ key | translate }}</p>
      }
      @if (bullets().length) {
        <ul class="m-0 flex list-disc flex-col gap-2 pl-6 marker:text-coral">
          @for (key of bullets(); track key) {
            <li>{{ key | translate }}</li>
          }
        </ul>
      }
      @for (key of after(); track key) {
        <p class="m-0">{{ key | translate }}</p>
      }
      <ng-content />
    </section>
  `,
})
export class InfoSection {
  /** Prefix for the heading id, unique on the page. */
  readonly sectionId = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly paragraphs = input<readonly string[]>([]);
  readonly bullets = input<readonly string[]>([]);
  /** Paragraphs after the bullet list. */
  readonly after = input<readonly string[]>([]);
}
