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
- Backend: Supabase (Postgres, Auth, Storage, Edge Functions). Row Level Security is enabled on every table.
- Never trust prices, totals or stock from the browser. Orders are created server-side, where prices are recalculated from the database.
- Secrets (service role key, payment keys) never go in Angular code or environment files committed to git.
- The admin app (projects/admin) is not translated (Georgian only) and is not indexed (noindex)."
- Supabase may later be replaced by a NestJS API. Components never import supabase-js; all data access goes through services in projects/shared/src/lib/data-access/ (admin-only ones exported from @cikloni/shared/admin). Business logic for orders lives server-side only.
- Workspace has two apps: "shop" (cikloni.ge) and "admin" (admin.cikloni.ge), plus a "shared" library. Shared types, pipes, models and data-access services live in shared; never import between the two apps directly.