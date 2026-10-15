import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AnnouncementBar } from '../announcement-bar/announcement-bar';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';

/** Shell shared by every page: skip link, banner (announcement + header), content, footer. */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, TranslatePipe, AnnouncementBar, Header, Footer],
  host: { class: 'flex min-h-screen flex-col' },
  template: `
    <a
      href="#main"
      class="sr-only z-50 rounded-pill bg-plum px-5 py-3 font-bold text-blush focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus-visible:outline-offset-4"
      (click)="skipToContent($event)"
      >{{ 'HEADER.SKIP_TO_CONTENT' | translate }}</a
    >
    <header>
      <app-announcement-bar />
      <app-header />
    </header>
    <main #main id="main" tabindex="-1" class="flex-1 focus:outline-none">
      <router-outlet />
    </main>
    <app-footer />
  `,
})
export class MainLayout {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  /** Moves focus (not just scroll) to the content; a plain #main link would also change the route. */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
