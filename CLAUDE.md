# Cikloni — project rules

- Angular, standalone components, signals for state, Tailwind CSS v4 (plain CSS, no SCSS).
- Follow design/DESIGN.md for all colors, fonts, spacing and radii. Use CSS variables, never hardcoded hex values in components.
- Page specs: design/HOME.md and design/PRODUCT.md. Mockups in design/mockups/ are reference only, not runnable code.
- The site is bilingual: Georgian (ka, default) and English (en), using ngx-translate. Never hardcode text in templates; all copy goes in src/assets/i18n/ka.json and en.json. Keep Georgian copy exactly as written in the specs.
- Mobile-first and responsive. Touch targets at least 44px. Use semantic HTML (button, a, details/summary, label).
- Keep components small and reusable. Don't install new libraries without asking me.
- Styling: Tailwind CSS v4. Design tokens from design/DESIGN.md are defined once in src/styles.css with @theme. In components, use only these theme tokens (e.g. bg-plum, text-blush, rounded-card); never arbitrary values like bg-[#3A1D45].
- No component .scss files unless something truly can't be done with Tailwind utilities.
- Approved packages: Tailwind, ngx-translate, Lucide, Angular CDK, Prettier, ESLint. Ask before adding anything else
- Translation keys are UPPER_SNAKE_CASE, nested by section with dots (e.g. HERO.TITLE, PRODUCT.ADD_TO_CART). Section names are uppercase too. ka.json and en.json must always have identical key structure.
