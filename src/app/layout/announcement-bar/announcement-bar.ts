import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-announcement-bar',
  imports: [TranslatePipe],
  template: `
    <p class="m-0 bg-plum px-6 py-2.5 text-center text-sm/body font-medium text-blush">
      {{ 'HEADER.ANNOUNCEMENT' | translate }}
    </p>
  `,
})
export class AnnouncementBar {}
