import { Component } from '@angular/core';
import { AboutSection } from './sections/about-section';
import { AbsorbencySection } from './sections/absorbency-section';
import { BenefitsSection } from './sections/benefits-section';
import { BestsellersSection } from './sections/bestsellers-section';
import { CalculatorTeaserSection } from './sections/calculator-teaser-section';
import { FaqSection } from './sections/faq-section';
import { HeroSection } from './sections/hero-section';
import { HowItWorksSection } from './sections/how-it-works-section';
import { NewsletterSection } from './sections/newsletter-section';

/** Homepage: sections 3-10 of design/HOME.md (1, 2 and 11 live in the main layout). */
@Component({
  selector: 'app-home',
  imports: [
    HeroSection,
    BenefitsSection,
    CalculatorTeaserSection,
    BestsellersSection,
    HowItWorksSection,
    AbsorbencySection,
    FaqSection,
    AboutSection,
    NewsletterSection,
  ],
  template: `
    <app-hero-section />
    <app-benefits-section />
    <app-calculator-teaser-section />
    <app-bestsellers-section />
    <app-how-it-works-section />
    <app-absorbency-section />
    <app-faq-section />
    <app-about-section />
    <app-newsletter-section />
  `,
})
export class Home {}
