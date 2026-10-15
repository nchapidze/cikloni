import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LogoMark } from '../../shared/logo-mark/logo-mark';

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
        { label: 'FOOTER.INFO.DELIVERY' },
        { label: 'FOOTER.INFO.RETURNS' },
        { label: 'FOOTER.INFO.PRIVACY' },
      ],
    },
    {
      title: 'FOOTER.CONTACT.TITLE',
      items: [
        { label: 'FOOTER.CONTACT.INSTAGRAM', href: 'https://www.instagram.com/cikloni.ge/' },
        { label: 'FOOTER.CONTACT.DETAILS' },
      ],
    },
  ];
}
