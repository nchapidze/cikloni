import { Component } from '@angular/core';
import { InfoPage } from '../../shared/info-page/info-page';
import { InfoSection } from '../../shared/info-page/info-section';

/**
 * Privacy policy. Lists the fields the checkout form collects (CreateOrderRequest.customer);
 * update it whenever checkout starts asking for something new.
 */
@Component({
  selector: 'app-privacy-page',
  imports: [InfoPage, InfoSection],
  template: `
    <app-info-page titleKey="PRIVACY.TITLE" introKey="PRIVACY.INTRO" updatedKey="PRIVACY.UPDATED">
      <app-info-section
        sectionId="privacy-who"
        titleKey="PRIVACY.WHO.TITLE"
        [paragraphs]="['PRIVACY.WHO.TEXT']"
      />

      <app-info-section
        sectionId="privacy-collect"
        titleKey="PRIVACY.COLLECT.TITLE"
        [paragraphs]="['PRIVACY.COLLECT.INTRO']"
        [bullets]="[
          'PRIVACY.COLLECT.NAME',
          'PRIVACY.COLLECT.PHONE',
          'PRIVACY.COLLECT.EMAIL',
          'PRIVACY.COLLECT.ADDRESS',
          'PRIVACY.COLLECT.NOTES',
        ]"
        [after]="['PRIVACY.COLLECT.ORDER', 'PRIVACY.COLLECT.NO_CARDS']"
      />

      <app-info-section
        sectionId="privacy-why"
        titleKey="PRIVACY.WHY.TITLE"
        [bullets]="[
          'PRIVACY.WHY.CONFIRM',
          'PRIVACY.WHY.DELIVER',
          'PRIVACY.WHY.SUPPORT',
          'PRIVACY.WHY.LAW',
        ]"
        [after]="['PRIVACY.WHY.NO_SELLING']"
      />

      <app-info-section
        sectionId="privacy-storage"
        titleKey="PRIVACY.STORAGE.TITLE"
        [paragraphs]="['PRIVACY.STORAGE.TEXT', 'PRIVACY.STORAGE.SHARED', 'PRIVACY.STORAGE.BROWSER']"
      />

      <app-info-section
        sectionId="privacy-retention"
        titleKey="PRIVACY.RETENTION.TITLE"
        [paragraphs]="['PRIVACY.RETENTION.TEXT']"
      />

      <app-info-section
        sectionId="privacy-rights"
        titleKey="PRIVACY.RIGHTS.TITLE"
        [paragraphs]="['PRIVACY.RIGHTS.TEXT', 'PRIVACY.RIGHTS.HOW', 'PRIVACY.RIGHTS.COMPLAINT']"
      />
    </app-info-page>
  `,
})
export class PrivacyPage {}
