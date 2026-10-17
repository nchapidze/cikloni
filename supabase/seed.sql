-- Launch catalog from design/HOME.md section 5 and design/PRODUCT.md (formerly the mock data
-- in the Angular app). Prices are not set yet: null renders the "[ფასი] ₾" placeholder.
-- Runs on `supabase db reset`; safe to re-run (rows are upserted, stock is never overwritten).

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

insert into public.products
  (slug, name, description, care, price_gel, absorbency, style, is_bestseller, is_active, sort_order)
select
  p.slug, p.name, p.description, care.text, null, p.absorbency::public.absorbency_level,
  p.style::public.product_style,
  true, true, p.sort_order
from (
  values
    (
      'floral-bikini',
      '{"ka": "ყვავილოვანი ბიკინი", "en": "Floral bikini"}'::jsonb,
      '{"ka": "ფერადი ყვავილოვანი ბიკინი რამდენიმეშრიანი შთამნთქმელი ფენით. [ქსოვილის შემადგენლობა, ფენების რაოდენობა, სერტიფიკატები]", "en": "A colorful floral bikini with a multi-layer absorbent lining. [fabric composition, number of layers, certificates]"}'::jsonb,
      'medium',
      'bikini',
      1
    ),
    (
      'seamless-hipster',
      '{"ka": "უნაკერო ჰიპსტერი", "en": "Seamless hipster"}'::jsonb,
      '{"ka": "[აღწერა]", "en": "[description]"}'::jsonb,
      'light',
      'hipster',
      2
    ),
    (
      'colorful-boxer',
      '{"ka": "ფერადი ბოქსერი", "en": "Colorful boxer"}'::jsonb,
      '{"ka": "[აღწერა]", "en": "[description]"}'::jsonb,
      'heavy',
      'boxer',
      3
    ),
    (
      'lace-brazilian',
      '{"ka": "მაქმანიანი ბრაზილიანა", "en": "Lace Brazilian"}'::jsonb,
      '{"ka": "[აღწერა]", "en": "[description]"}'::jsonb,
      'light',
      'brazilian',
      4
    )
) as p (slug, name, description, absorbency, style, sort_order)
cross join (
  select '{"ka": "გამოავლე ცივ წყალში, გარეცხე ცივ რეჟიმზე, გააშრე ჰაერზე. არ გამოიყენო ქსოვილის დამარბილებელი და საშრობი მანქანა.", "en": "Rinse in cold water, machine wash on a cold cycle and air dry. Don''t use fabric softener or a tumble dryer."}'::jsonb as text
) as care
on conflict (slug) do update set
  name          = excluded.name,
  description   = excluded.description,
  care          = excluded.care,
  absorbency    = excluded.absorbency,
  style         = excluded.style,
  is_bestseller = excluded.is_bestseller,
  is_active     = excluded.is_active,
  sort_order    = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Variants: every listed color in sizes XS-XXL
-- ---------------------------------------------------------------------------

insert into public.product_variants (product_id, color_id, color_name, color_hex, size, stock, sku)
select
  p.id, c.color_id, c.color_name, c.color_hex, s.size, 20,
  upper(p.slug || '-' || c.color_id || '-' || s.size)
from public.products p
join (
  values
    -- PRODUCT.md lists four colors for the floral bikini; HOME.md cards show three for the rest.
    ('floral-bikini', 'coral'), ('floral-bikini', 'lilac'),
    ('floral-bikini', 'orange'), ('floral-bikini', 'mint'),
    ('seamless-hipster', 'coral'), ('seamless-hipster', 'lilac'), ('seamless-hipster', 'orange'),
    ('colorful-boxer', 'coral'), ('colorful-boxer', 'lilac'), ('colorful-boxer', 'orange'),
    ('lace-brazilian', 'coral'), ('lace-brazilian', 'lilac'), ('lace-brazilian', 'orange')
) as pc (slug, color_id) on pc.slug = p.slug
-- Swatch colors match the theme tokens in src/styles.css (design/PRODUCT.md color table).
join (
  values
    ('coral', '{"ka": "ვარდისფერი", "en": "Pink"}'::jsonb, '#e8546b'),
    ('lilac', '{"ka": "იასამნისფერი", "en": "Lilac"}'::jsonb, '#8e5bd9'),
    ('orange', '{"ka": "ნარინჯისფერი", "en": "Orange"}'::jsonb, '#f28c38'),
    ('mint', '{"ka": "პიტნისფერი", "en": "Mint"}'::jsonb, '#2aa79b')
) as c (color_id, color_name, color_hex) on c.color_id = pc.color_id
cross join unnest(array['XS', 'S', 'M', 'L', 'XL', 'XXL']) as s (size)
on conflict (product_id, color_id, size) do update set
  color_name = excluded.color_name,
  color_hex  = excluded.color_hex,
  sku        = excluded.sku;
