import { Component, inject } from '@angular/core';
import { AuthService } from '@cikloni/shared/admin';

@Component({
  selector: 'app-admin-dashboard-page',
  template: `
    <h1 class="mt-0 text-3xl md:text-h2">მთავარი</h1>
    <p class="m-0">შესული ხართ როგორც {{ auth.user()?.email }}.</p>
  `,
})
export class AdminDashboardPage {
  protected readonly auth = inject(AuthService);
}
