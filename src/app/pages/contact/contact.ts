import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Clock, Instagram, LucideAngularModule, Mail, MapPin, Phone } from 'lucide-angular';
import { CONTACT_DETAILS } from '../../core/contact/contact.config';
import { InfoPage } from '../../shared/info-page/info-page';

interface ContactItem {
  id: string;
  icon: typeof Phone;
  labelKey: string;
  /** Shown as is (handle, number, email); `valueKey` is translated instead. */
  value?: string;
  valueKey?: string;
  href?: string;
  external?: boolean;
}

/** A configured detail as a link, or its translated placeholder while it's still null. */
function detail(
  id: string,
  icon: typeof Phone,
  value: string | null,
  href: (value: string) => string,
): ContactItem {
  const key = `CONTACT.${id.toUpperCase()}`;
  return value
    ? { id, icon, labelKey: `${key}.LABEL`, value, href: href(value) }
    : { id, icon, labelKey: `${key}.LABEL`, valueKey: `${key}.PLACEHOLDER` };
}

const { instagram, phone, email } = CONTACT_DETAILS;

/** Instagram, phone, email, address and hours. Phone and email come from CONTACT_DETAILS. */
@Component({
  selector: 'app-contact-page',
  imports: [TranslatePipe, LucideAngularModule, InfoPage],
  template: `
    <app-info-page titleKey="CONTACT.TITLE" introKey="CONTACT.INTRO" [showContact]="false">
      <ul class="m-0 grid list-none gap-4 p-0 sm:grid-cols-2" data-testid="contact-items">
        @for (item of items; track item.id) {
          <li class="flex items-start gap-4 rounded-card border-2 border-border p-6">
            <span
              class="flex size-12 shrink-0 items-center justify-center rounded-full bg-blush text-coral-strong"
              aria-hidden="true"
            >
              <lucide-icon [img]="item.icon" [size]="24" />
            </span>
            <div class="flex min-w-0 flex-col">
              <h2 class="m-0 text-base font-bold">{{ item.labelKey | translate }}</h2>
              @let text = item.value ?? (item.valueKey! | translate);
              @if (item.href) {
                <a
                  class="inline-flex min-h-11 items-center font-bold break-words"
                  [href]="item.href"
                  [attr.target]="item.external ? '_blank' : null"
                  [attr.rel]="item.external ? 'noopener noreferrer' : null"
                  >{{ text }}</a
                >
              } @else {
                <p class="m-0 flex min-h-11 items-center">{{ text }}</p>
              }
            </div>
          </li>
        }
      </ul>
    </app-info-page>
  `,
})
export class ContactPage {
  protected readonly items: ContactItem[] = [
    {
      id: 'instagram',
      icon: Instagram,
      labelKey: 'CONTACT.INSTAGRAM.LABEL',
      value: instagram.handle,
      href: instagram.url,
      external: true,
    },
    detail('phone', Phone, phone, (number) => `tel:${number.replace(/\s/g, '')}`),
    detail('email', Mail, email, (address) => `mailto:${address}`),
    {
      id: 'address',
      icon: MapPin,
      labelKey: 'CONTACT.ADDRESS.LABEL',
      valueKey: 'CONTACT.ADDRESS.VALUE',
    },
    { id: 'hours', icon: Clock, labelKey: 'CONTACT.HOURS.LABEL', valueKey: 'CONTACT.HOURS.VALUE' },
  ];
}
