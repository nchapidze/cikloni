import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LogoMark } from '@cikloni/shared';
import { CONTACT_DETAILS } from '../../core/contact/contact.config';

interface FooterItem {
  label: string;
  /** In-app route; `fragment` targets a home page section. */
  route?: string;
  fragment?: string;
  href?: string;
}

interface FooterColumn {
  title: string;
  items: FooterItem[];
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslatePipe, LogoMark],
  templateUrl: './footer.html',
})
export class Footer {
  // Items without route/href have no page yet and render as plain text.
  protected readonly columns: FooterColumn[] = [
    {
      title: 'FOOTER.SHOP.TITLE',
      items: [
        { label: 'FOOTER.SHOP.ALL_PRODUCTS', route: '/', fragment: 'shop' },
        { label: 'FOOTER.SHOP.SIZE_GUIDE' },
      ],
    },
    {
      title: 'FOOTER.INFO.TITLE',
      items: [
        { label: 'FOOTER.INFO.DELIVERY', route: '/delivery' },
        { label: 'FOOTER.INFO.RETURNS', route: '/returns' },
        { label: 'FOOTER.INFO.PRIVACY', route: '/privacy' },
        { label: 'FOOTER.INFO.TERMS', route: '/terms' },
      ],
    },
    {
      title: 'FOOTER.CONTACT.TITLE',
      items: [
        { label: 'FOOTER.CONTACT.INSTAGRAM', href: CONTACT_DETAILS.instagram.url },
        { label: 'FOOTER.CONTACT.DETAILS', route: '/contact' },
      ],
    },
  ];
}
