/**
 * Shop contact details, used by the footer and the contact page.
 *
 * TODO: fill in phone and email. While null, the pages show the translated
 * placeholder (CONTACT.PHONE.PLACEHOLDER / CONTACT.EMAIL.PLACEHOLDER) instead of a link.
 */
export const CONTACT_DETAILS: ContactDetails = {
  instagram: { handle: '@cikloni.ge', url: 'https://www.instagram.com/cikloni.ge/' },
  /** Shown as typed and dialed as `tel:` with spaces removed, e.g. '+995 555 12 34 56'. */
  phone: null,
  email: null,
};

export interface ContactDetails {
  readonly instagram: { readonly handle: string; readonly url: string };
  readonly phone: string | null;
  readonly email: string | null;
}
