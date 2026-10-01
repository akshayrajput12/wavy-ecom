-- =============================================================================
-- wavy seed: the fashion catalogue (clothing, shoes, accessories). DATA ONLY, NO IMAGES.
-- Run on a database with migrations 0001-0020 applied, ideally right after supabase/reset.sql:
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql   (or paste it in the Supabase SQL editor)
-- One transaction, dependency order, `on conflict do nothing` (re-running it adds nothing; stock is
-- only set on variants that still have none). Prices are integer PAISE (Rs 1 = 100).
--
-- IMAGES: product, category, collection and blog image columns are left empty: add photos in
-- /admin (Products > Media, Categories, Collections, Blog). The home page sections below need an
-- image to be valid, so they point at these placeholder paths. Upload each file to the Next app's
-- public/ folder at that path (e.g. public/images/hero/hero-01-waxed-cotton-field-jacket.png), or
-- upload anywhere and swap the URL in Admin > Home:
--   /images/hero/hero-01-waxed-cotton-field-jacket.png     hero slide 1 (transparent 1:1 cut-out)
--   /images/hero/hero-02-court-classic-leather-sneaker.png hero slide 2 (transparent 1:1 cut-out)
--   /images/hero/hero-03-everyday-leather-tote.png         hero slide 3 (transparent 1:1 cut-out)
--   /images/hero/hero-04-satin-slip-midi-dress.png         hero slide 4 (transparent 1:1 cut-out)
--   /images/promo/promo-crafted-to-last.webp               promo banner "Crafted to last" (light)
--   /images/promo/promo-festive-drop.webp                  promo banner "Festive drop" (dark)
--   /images/tear/tear-made-to-move.webp                    tear reveal "MADE TO MOVE" (full-bleed photo)
--
-- Deterministic UUIDs:
--   categories   10000000-0000-4000-8000-0000000000NN  01 clothing 02 shoes 03 accessories; children <parent><n>
--   collections  20000000-0000-4000-8000-00000000000N  1 new-arrivals 2 best-sellers 3 festive-edit
--                                                       4 winter-layers 5 weekend-uniform 6 office-ready
--   products     30000000-0000-4000-8000-0000000000NN  (01..23, catalogue order)
--   variants     3100PPPP-0000-4000-8000-0000000000VV  VV = (colour index - 1) * count(sizes) + size index
--   coupon 51000000-...-01, zones 60000000-..., methods 61000000-..., faqs 70000000-...,
--   testimonials 71000000-..., pages 72000000-..., home sections 74000000-...,
--   blog categories 80000000-..., tags 81000000-..., posts 82000000-...
-- SKU = WVY-<NN>-<COLOUR>-<SIZE> (letters/digits only, upper case; one-size items use OS).
-- No product reviews are seeded: ratings come from real customers only.
-- =============================================================================

set client_encoding = 'UTF8';
begin;

-- ---------- Store settings + reference rows (re-created after reset.sql; defaults from migrations) ----------
-- tax: one store-wide GST rate, prices GST-inclusive. Indian GST on apparel/footwear depends on the item's
-- price (5% up to Rs 2,500 a piece, 18% above) and bags/belts/eyewear are 18%: the schema has a single rate,
-- so confirm the figure with your accountant. gst_number / support_phone: set yours in Admin > Settings.
insert into public.store_settings (id, store_name, currency, locale, timezone, tax_percentage, tax_inclusive, gst_number,
                                   free_shipping_threshold, flat_shipping_fee, cod_enabled, cod_fee, cod_max_order_amount,
                                   return_window_days, low_stock_default, support_email, support_phone)
values (true, 'wavy', 'INR', 'en-IN', 'Asia/Kolkata', 18, true, null,
        199900, 9900, true, 0, 500000, 15, 5, 'support@wavy.store', null)
on conflict (id) do update set
  store_name = excluded.store_name, currency = excluded.currency, locale = excluded.locale, timezone = excluded.timezone,
  tax_percentage = excluded.tax_percentage, tax_inclusive = excluded.tax_inclusive, gst_number = excluded.gst_number,
  free_shipping_threshold = excluded.free_shipping_threshold, flat_shipping_fee = excluded.flat_shipping_fee,
  cod_enabled = excluded.cod_enabled, cod_fee = excluded.cod_fee, cod_max_order_amount = excluded.cod_max_order_amount,
  return_window_days = excluded.return_window_days, low_stock_default = excluded.low_stock_default,
  support_email = excluded.support_email, support_phone = excluded.support_phone;

insert into public.payment_gateways (provider, display_name, description, is_enabled, mode, sort_order, supported_methods, config) values
  ('razorpay', 'Pay online', 'UPI, cards, netbanking and wallets via Razorpay', true,  'test', 1,
     '{upi,card,netbanking,wallet,emi,paylater}', '{"key_id": null, "theme_color": "#111111"}'),
  ('payu',     'PayU',       'Cards, UPI and netbanking via PayU',              false, 'test', 2,
     '{upi,card,netbanking,wallet}',              '{"merchant_key": null}'),
  ('cod',      'Cash on delivery', 'Pay in cash or UPI when your order arrives', true,  'live', 3,
     '{cod}',                                     '{}')
on conflict do nothing;

insert into public.integration_configs (provider, environment, secret_ref, config) values
  ('razorpay',   'test', 'RAZORPAY_KEY_SECRET',  '{"key_id": null, "webhook_url": "/api/payments/webhooks/razorpay"}'),
  ('payu',       'test', 'PAYU_MERCHANT_SALT',   '{"merchant_key": null}'),
  ('shiprocket', 'test', 'SHIPROCKET_PASSWORD',  '{"email": null, "pickup_location": "Primary"}'),
  ('resend',     'test', 'RESEND_API_KEY',       '{"from": "wavy <orders@wavy.store>"}'),
  ('ga4',        'live', null,                   '{"measurement_id": null}'),
  ('posthog',    'live', 'POSTHOG_KEY',          '{"host": "https://eu.i.posthog.com"}')
on conflict do nothing;

-- ---------- Shipping (free over Rs 1,999 via store_settings, else the method rate) ----------
insert into public.shipping_zones (id, name, states, is_default) values
  ('60000000-0000-4000-8000-000000000001', 'Rest of India', '{}', true),
  ('60000000-0000-4000-8000-000000000002', 'Metro',
   '{Maharashtra,Delhi,Karnataka,Tamil Nadu,Telangana,West Bengal}', false)
on conflict do nothing;
insert into public.shipping_methods (id, zone_id, code, name, description, rate, free_above, cod_available, min_days, max_days, sort_order) values
  ('61000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'standard', 'Standard',
   'Free over ₹1,999', 9900, null, true, 4, 7, 1),
  ('61000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', 'metro_standard', 'Standard',
   'Free over ₹1,999', 9900, null, true, 2, 4, 1),
  ('61000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000002', 'metro_express', 'Express',
   'Next-day delivery in metro cities. Free over ₹4,999', 19900, 499900, false, 1, 2, 2)
on conflict do nothing;

-- ---------- Categories (3 departments shown on home, 14 sub-categories) ----------
insert into public.categories (id, parent_id, name, slug, description, sort_order, show_on_home, seo_title, seo_description)
select format('10000000-0000-4000-8000-%s', lpad(no, 12, '0'))::uuid,
       case when parent is null then null else format('10000000-0000-4000-8000-%s', lpad(parent, 12, '0'))::uuid end,
       name, slug, descr, sort, parent is null, left(name || ' | wavy', 70), left(descr, 170)
from (values
  ('01', null, 'Clothing',           'clothing',       'Everyday pieces, cut to last.',            1),
  ('02', null, 'Shoes',              'shoes',          'From court to commute.',                   2),
  ('03', null, 'Accessories',        'accessories',    'The finishing details.',                   3),
  ('11', '01', 'T-shirts & Polos',   'tees-polos',     'Heavyweight cotton, made for repeat wear.', 1),
  ('12', '01', 'Shirts',             'shirts',         'Oxford, linen and camp collars.',          2),
  ('13', '01', 'Knitwear & Hoodies', 'knitwear',       'Soft layers for cooler days.',             3),
  ('14', '01', 'Trousers & Denim',   'trousers-denim', 'Clean lines, honest fabrics.',             4),
  ('15', '01', 'Outerwear',          'outerwear',      'Built for weather, worn for years.',       5),
  ('16', '01', 'Dresses & Co-ords',  'dresses-coords', 'Easy sets and evening slips.',             6),
  ('21', '02', 'Sneakers',           'sneakers',       'Leather courts and light runners.',        1),
  ('22', '02', 'Loafers & Formal',   'loafers-formal', 'Polished, never stiff.',                   2),
  ('23', '02', 'Boots',              'boots',          'Chelsea and lace-up, resoled for life.',   3),
  ('24', '02', 'Sandals & Slides',   'sandals-slides', 'For heat, sand and slow weekends.',        4),
  ('31', '03', 'Bags',               'bags',           'Totes and slings that carry well.',        1),
  ('32', '03', 'Caps & Hats',        'caps-hats',      'Washed cotton, softened in.',              2),
  ('33', '03', 'Belts & Wallets',    'belts-wallets',  'Full-grain leather, built to age.',        3),
  ('34', '03', 'Eyewear',            'eyewear',        'Acetate frames with UV400 lenses.',        4)
) as c(no, parent, name, slug, descr, sort)
order by parent nulls first, no
on conflict do nothing;

-- ---------- Collections (new-arrivals + best-sellers slugs are read by the storefront; keep them) ----------
insert into public.collections (id, name, slug, description, sort_order, show_on_home, seo_title, seo_description) values
  ('20000000-0000-4000-8000-000000000001', 'New Arrivals',     'new-arrivals',    'Just landed this season.',                    1, false,
   'New Arrivals | wavy',     'The newest clothing, shoes and accessories at wavy.'),
  ('20000000-0000-4000-8000-000000000002', 'Best Sellers',     'best-sellers',    'The pieces customers come back for.',         2, false,
   'Best Sellers | wavy',     'The wavy pieces customers buy again and again.'),
  ('20000000-0000-4000-8000-000000000003', 'The Festive Edit', 'festive-edit',    'Dressed-up ease for Diwali evenings.',        3, true,
   'The Festive Edit | wavy', 'Satin slips, knit co-ords, merino and suede loafers for Diwali evenings.'),
  ('20000000-0000-4000-8000-000000000004', 'Winter Layers',    'winter-layers',   'Knits, jackets and boots for cooler months.', 4, true,
   'Winter Layers | wavy',    'Merino knits, loopback hoodies, waxed jackets and Chelsea boots.'),
  ('20000000-0000-4000-8000-000000000005', 'Weekend Uniform',  'weekend-uniform', 'Easy pieces for slow days.',                  5, true,
   'Weekend Uniform | wavy',  'Heavyweight tees, linen shirts, selvedge denim and slides for slow days.'),
  ('20000000-0000-4000-8000-000000000006', 'Office Ready',     'office-ready',    'Sharp without trying.',                       6, true,
   'Office Ready | wavy',     'Oxford shirts, pleated trousers, loafers and leather for the working week.')
on conflict do nothing;

-- ---------- Products + variants ----------
-- colours: [{"v": name, "hex": swatch}]; sizes null = one size (option_names {Colour}, SKU suffix OS).
create temp table _seed_products (
  no int, cat text, name text, slug text, short text, descr text, highlights text[], specs jsonb,
  tags text[], badges text[], colours jsonb, sizes text[], price int, compare int, weight int, hsn text
) on commit drop;

insert into _seed_products values
-- ===== Clothing =====
  (1, '11', 'Essential Heavyweight Tee', 'essential-heavyweight-tee',
   '240 gsm combed cotton with a dense rib collar that keeps its shape.',
   E'240 gsm combed cotton with a dense rib collar that keeps its shape.\n\nA boxy cut with a slightly dropped shoulder and a straight hem. Pre-shrunk, so it fits the same after the twentieth wash as the first.',
   '{"240 gsm combed cotton","Dense rib collar","Pre-shrunk, relaxed fit"}',
   '[{"group":"Fabric","label":"Material","value":"100% combed cotton"},{"group":"Fabric","label":"Weight","value":"240 gsm"},{"group":"Fit","label":"Fit","value":"Relaxed, true to size"},{"group":"Care","label":"Wash","value":"Machine wash cold, dry in shade"}]',
   '{t-shirt,cotton,heavyweight,essentials}', '{Bestseller}',
   '[{"v":"Bone","hex":"#E8E2D4"},{"v":"Jet Black","hex":"#111111"},{"v":"Bottle Green","hex":"#1F4D3A"}]',
   '{XS,S,M,L,XL,XXL}', 129900, null, 280, '6109'),
  (2, '11', 'Pima Pique Polo', 'pima-pique-polo',
   'Long-staple Pima pique with a two-button placket and tipped collar.',
   E'Long-staple Pima pique with a two-button placket and tipped collar.\n\nA neat regular fit with ribbed cuffs and a split hem that sits well tucked or untucked.',
   '{"Long-staple Pima cotton pique","Two-button placket, tipped collar","Ribbed cuffs, split hem"}',
   '[{"group":"Fabric","label":"Material","value":"100% Pima cotton pique"},{"group":"Fit","label":"Fit","value":"Regular"},{"group":"Care","label":"Wash","value":"Machine wash cold, do not tumble dry"}]',
   '{polo,pima-cotton,smart-casual}', '{Bestseller}',
   '[{"v":"Navy","hex":"#1F2A44"},{"v":"Off-white","hex":"#F4F1EA"},{"v":"Bottle Green","hex":"#1F4D3A"}]',
   '{S,M,L,XL,XXL}', 199900, 239900, 300, '6105'),
  (3, '12', 'Oxford Button-Down Shirt', 'oxford-button-down-shirt',
   'Brushed oxford cloth, soft collar roll, mother-of-pearl buttons.',
   E'Brushed oxford cloth, soft collar roll, mother-of-pearl buttons.\n\nA regular body with a back box pleat for room through the shoulders. Smart with trousers, easy with denim.',
   '{"Brushed cotton oxford","Button-down collar with a soft roll","Mother-of-pearl buttons"}',
   '[{"group":"Fabric","label":"Material","value":"100% cotton oxford"},{"group":"Fit","label":"Fit","value":"Regular"},{"group":"Care","label":"Wash","value":"Machine wash 30°C, iron medium"}]',
   '{shirt,oxford,office}', '{}',
   '[{"v":"White","hex":"#F7F7F5"},{"v":"Sky Blue","hex":"#A9C8E8"}]',
   '{S,M,L,XL,XXL}', 249900, null, 320, '6205'),
  (4, '12', 'Linen Camp-Collar Shirt', 'linen-camp-collar-shirt',
   'Garment-washed European linen with a relaxed camp collar.',
   E'Garment-washed European linen with a relaxed camp collar.\n\nCut boxy with short sleeves and a straight hem made to be worn out. Linen breathes in the heat and softens with every wash.',
   '{"100% European linen","Garment-washed for softness","Relaxed camp collar"}',
   '[{"group":"Fabric","label":"Material","value":"100% linen"},{"group":"Fit","label":"Fit","value":"Relaxed"},{"group":"Care","label":"Wash","value":"Machine wash cold, line dry"}]',
   '{shirt,linen,summer}', '{New}',
   '[{"v":"Sand","hex":"#D8C7A3"},{"v":"Olive","hex":"#5B6B3A"}]',
   '{S,M,L,XL,XXL}', 279900, null, 260, '6205'),
  (5, '13', 'Merino Crew Knit', 'merino-crew-knit',
   'Extra-fine 18.5-micron merino, light enough for Indian winters.',
   E'Extra-fine 18.5-micron merino, light enough for Indian winters.\n\nA fine-gauge knit with ribbed hem and cuffs. Merino regulates temperature and resists odour, so it needs washing less often.',
   '{"Extra-fine 18.5-micron merino","Fine-gauge knit","Breathable, odour resistant"}',
   '[{"group":"Fabric","label":"Material","value":"100% merino wool"},{"group":"Fit","label":"Fit","value":"Regular"},{"group":"Care","label":"Wash","value":"Hand wash cold or wool cycle, dry flat"}]',
   '{knitwear,merino,wool,winter}', '{}',
   '[{"v":"Charcoal","hex":"#36454F"},{"v":"Oat","hex":"#D9CBB0"}]',
   '{S,M,L,XL}', 399900, null, 330, '6110'),
  (6, '13', 'Loopback Zip Hoodie', 'loopback-zip-hoodie',
   '400 gsm loopback cotton with a two-way metal zip.',
   E'400 gsm loopback cotton with a two-way metal zip.\n\nA lined hood with flat drawcords, front pockets and ribbed cuffs. Loopback stays cooler than brushed fleece in a warm room.',
   '{"400 gsm loopback cotton","Two-way metal zip","Lined hood, flat drawcords"}',
   '[{"group":"Fabric","label":"Material","value":"100% cotton loopback"},{"group":"Fabric","label":"Weight","value":"400 gsm"},{"group":"Fit","label":"Fit","value":"Regular"},{"group":"Care","label":"Wash","value":"Machine wash cold, inside out"}]',
   '{hoodie,sweatshirt,cotton}', '{New}',
   '[{"v":"Heather Grey","hex":"#9A9A9A"},{"v":"Maroon","hex":"#6B1E2B"}]',
   '{S,M,L,XL,XXL}', 329900, null, 750, '6110'),
  (7, '14', 'Pleated Wide-Leg Trousers', 'pleated-wide-leg-trousers',
   'Double front pleats and a high rise in a fluid wool-blend twill.',
   E'Double front pleats and a high rise in a fluid wool-blend twill.\n\nA clean waistband with side adjusters, slant pockets and a full leg that breaks softly over the shoe. Order your usual waist size.',
   '{"Double front pleats","High rise, wide leg","Fluid wool-blend twill"}',
   '[{"group":"Fabric","label":"Material","value":"Wool-blend twill"},{"group":"Fit","label":"Fit","value":"High rise, wide leg"},{"group":"Care","label":"Wash","value":"Dry clean or gentle hand wash"}]',
   '{trousers,pleated,wide-leg,office}', '{}',
   '[{"v":"Taupe","hex":"#8B7D6B"},{"v":"Black","hex":"#111111"}]',
   '{28,30,32,34,36,38}', 349900, null, 480, '6203'),
  (8, '14', 'Rigid Straight Selvedge Jeans', 'rigid-straight-selvedge-jeans',
   '13.5 oz selvedge denim, straight leg, fades to you.',
   E'13.5 oz selvedge denim, straight leg, fades to you.\n\nUnwashed rigid denim with a selvedge outseam, button fly and a straight leg from hip to hem. Expect a little give at the waist as they wear in.',
   '{"13.5 oz selvedge denim","Straight leg, button fly","Fades with wear"}',
   '[{"group":"Fabric","label":"Material","value":"100% cotton selvedge denim"},{"group":"Fabric","label":"Weight","value":"13.5 oz"},{"group":"Fit","label":"Fit","value":"Mid rise, straight leg, true to waist size"},{"group":"Care","label":"Wash","value":"Wash rarely, inside out, cold"}]',
   '{jeans,denim,selvedge}', '{}',
   '[{"v":"Raw Indigo","hex":"#22305A"},{"v":"Washed Black","hex":"#3A3A3C"}]',
   '{28,30,32,34,36,38}', 399900, 449900, 850, '6203'),
  (9, '15', 'Waxed Cotton Field Jacket', 'waxed-cotton-field-jacket',
   'Water-resistant waxed cotton, corduroy collar, four bellow pockets.',
   E'Water-resistant waxed cotton, corduroy collar, four bellow pockets.\n\nA lined body, storm cuffs and a two-way zip under a press-stud placket. The wax darkens and creases into its own character over time.',
   '{"Water-resistant waxed cotton","Corduroy collar","Four bellow pockets"}',
   '[{"group":"Fabric","label":"Material","value":"Waxed cotton, cotton lining"},{"group":"Fit","label":"Fit","value":"Regular, room for a knit underneath"},{"group":"Care","label":"Care","value":"Spot clean, re-wax yearly, never machine wash"}]',
   '{jacket,outerwear,waxed-cotton,winter}', '{New}',
   '[{"v":"Olive","hex":"#5B6B3A"},{"v":"Navy","hex":"#1F2A44"}]',
   '{S,M,L,XL,XXL}', 699900, null, 1400, '6201'),
  (10, '16', 'Satin Slip Midi Dress', 'satin-slip-midi-dress',
   'Bias-cut satin with adjustable straps and a midi hem.',
   E'Bias-cut satin with adjustable straps and a midi hem.\n\nThe bias cut skims rather than clings and moves as you do. Fully lined, so it needs nothing underneath.',
   '{"Bias-cut satin","Adjustable straps","Midi length, fully lined"}',
   '[{"group":"Fabric","label":"Material","value":"Satin, fully lined"},{"group":"Fit","label":"Fit","value":"Bias cut, true to size"},{"group":"Care","label":"Wash","value":"Hand wash cold, cool iron on the reverse"}]',
   '{dress,satin,festive,evening}', '{}',
   '[{"v":"Champagne","hex":"#E9D8B4"},{"v":"Black","hex":"#111111"}]',
   '{XS,S,M,L,XL}', 379900, null, 300, '6204'),
  (11, '16', 'Knit Co-ord Set', 'knit-coord-set',
   'Ribbed knit top and straight pant, sold as a set.',
   E'Ribbed knit top and straight pant, sold as a set.\n\nA short-sleeve top and an elasticated straight pant in a soft rib. Wear them together or split them up.',
   '{"Soft ribbed knit","Top and pant, sold as a set","Elasticated waist"}',
   '[{"group":"Fabric","label":"Material","value":"Cotton-blend rib knit"},{"group":"Set","label":"Includes","value":"Top and straight pant"},{"group":"Care","label":"Wash","value":"Machine wash cold, dry flat"}]',
   '{co-ord,knit,set,festive}', '{New}',
   '[{"v":"Ecru","hex":"#EFE6D2"},{"v":"Mocha","hex":"#6F4E37"}]',
   '{XS,S,M,L,XL}', 449900, null, 600, '6104'),
-- ===== Shoes =====
  (12, '21', 'Court Classic Leather Sneaker', 'court-classic-leather-sneaker',
   'Full-grain leather upper on a stitched cupsole.',
   E'Full-grain leather upper on a stitched cupsole.\n\nA padded collar, leather lining and a removable cushioned insole. The stitched cupsole can be resoled rather than thrown away.',
   '{"Full-grain leather upper","Stitched rubber cupsole","Leather lining, cushioned insole"}',
   '[{"group":"Build","label":"Upper","value":"Full-grain leather"},{"group":"Build","label":"Sole","value":"Stitched rubber cupsole"},{"group":"Fit","label":"Sizing","value":"True to UK size"},{"group":"Care","label":"Care","value":"Wipe clean, condition the leather"}]',
   '{sneakers,leather,white-sneakers}', '{Bestseller}',
   '[{"v":"White/Gum","hex":"#F5F1E6"},{"v":"White/Black","hex":"#F2F2F2"}]',
   '{UK 6,UK 7,UK 8,UK 9,UK 10,UK 11}', 499900, null, 1000, '6403'),
  (13, '21', 'Stone Runner Trainer', 'stone-runner-trainer',
   'Breathable engineered mesh on a light EVA runner sole.',
   E'Breathable engineered mesh on a light EVA runner sole.\n\nA sock-like collar, suede overlays at the toe and heel, and a cushioned midsole that is easy on long city days.',
   '{"Engineered mesh upper","Light EVA sole","Suede overlays"}',
   '[{"group":"Build","label":"Upper","value":"Engineered mesh, suede overlays"},{"group":"Build","label":"Sole","value":"EVA midsole, rubber outsole"},{"group":"Fit","label":"Sizing","value":"True to UK size; half size up for wide feet"},{"group":"Care","label":"Care","value":"Spot clean, air dry"}]',
   '{sneakers,trainers,runners}', '{New}',
   '[{"v":"Stone/Sand","hex":"#CFC6B4"},{"v":"Grey/Black","hex":"#6E6E6E"}]',
   '{UK 6,UK 7,UK 8,UK 9,UK 10,UK 11}', 549900, null, 700, '6404'),
  (14, '22', 'Suede Penny Loafer', 'suede-penny-loafer',
   'Hand-stitched apron toe in soft Italian-tanned suede.',
   E'Hand-stitched apron toe in soft Italian-tanned suede.\n\nA flexible leather sole with a rubber heel, leather lining and a cushioned footbed. Comfortable from the first wear.',
   '{"Italian-tanned suede","Hand-stitched apron toe","Leather sole, rubber heel"}',
   '[{"group":"Build","label":"Upper","value":"Suede"},{"group":"Build","label":"Sole","value":"Leather with rubber heel"},{"group":"Fit","label":"Sizing","value":"True to UK size"},{"group":"Care","label":"Care","value":"Brush when dry, use a suede protector"}]',
   '{loafers,suede,formal,festive}', '{}',
   '[{"v":"Tobacco","hex":"#7A4E2D"},{"v":"Black","hex":"#111111"}]',
   '{UK 6,UK 7,UK 8,UK 9,UK 10,UK 11}', 599900, null, 800, '6403'),
  (15, '23', 'Leather Chelsea Boot', 'leather-chelsea-boot',
   'Goodyear-welted calf leather with elastic gussets and a pull tab.',
   E'Goodyear-welted calf leather with elastic gussets and a pull tab.\n\nThe welt lets a cobbler replace the sole when it wears through, so the uppers you broke in stay with you.',
   '{"Calf leather upper","Goodyear-welted, resoleable","Elastic gussets, pull tab"}',
   '[{"group":"Build","label":"Upper","value":"Calf leather"},{"group":"Build","label":"Sole","value":"Goodyear-welted rubber"},{"group":"Fit","label":"Sizing","value":"True to UK size"},{"group":"Care","label":"Care","value":"Condition monthly, polish as needed"}]',
   '{boots,chelsea-boots,leather,winter}', '{New}',
   '[{"v":"Dark Brown","hex":"#4A3222"},{"v":"Black","hex":"#111111"}]',
   '{UK 6,UK 7,UK 8,UK 9,UK 10,UK 11}', 749900, null, 1300, '6403'),
  (16, '24', 'Moulded Slide', 'moulded-slide',
   'One-piece cushioned EVA with a contoured footbed.',
   E'One-piece cushioned EVA with a contoured footbed.\n\nWaterproof, quick to dry and light enough to pack. The textured footbed keeps its grip when wet.',
   '{"One-piece cushioned EVA","Contoured footbed","Waterproof, quick drying"}',
   '[{"group":"Build","label":"Material","value":"EVA"},{"group":"Fit","label":"Sizing","value":"True to UK size; size up if between sizes"},{"group":"Care","label":"Care","value":"Rinse with water"}]',
   '{slides,sandals,eva}', '{}',
   '[{"v":"Black","hex":"#111111"},{"v":"Bone","hex":"#E8E2D4"}]',
   '{UK 5,UK 6,UK 7,UK 8,UK 9,UK 10,UK 11}', 179900, null, 350, '6402'),
  (17, '24', 'Woven Leather Sandal', 'woven-leather-sandal',
   'Hand-woven vegetable-tanned straps on a leather sole.',
   E'Hand-woven vegetable-tanned straps on a leather sole.\n\nThe straps soften, darken and mould to the foot with wear. A rubber heel tip adds grip on smooth floors.',
   '{"Hand-woven leather straps","Vegetable-tanned leather","Leather sole"}',
   '[{"group":"Build","label":"Upper","value":"Vegetable-tanned leather"},{"group":"Build","label":"Sole","value":"Leather with rubber heel tip"},{"group":"Fit","label":"Sizing","value":"True to UK size"},{"group":"Care","label":"Care","value":"Keep dry, condition occasionally"}]',
   '{sandals,leather,handmade}', '{}',
   '[{"v":"Tan","hex":"#B0804F"}]',
   '{UK 3,UK 4,UK 5,UK 6,UK 7,UK 8}', 329900, 379900, 450, '6403'),
-- ===== Accessories =====
  (18, '31', 'Everyday Leather Tote', 'everyday-leather-tote',
   'Full-grain leather, fits a 14" laptop, inner zip pocket.',
   E'Full-grain leather, fits a 14" laptop, inner zip pocket.\n\nShoulder-length handles, a magnetic top closure and an unlined body that keeps it light. The leather softens and deepens in colour with use.',
   '{"Full-grain leather","Fits a 14-inch laptop","Inner zip pocket"}',
   '[{"group":"Build","label":"Material","value":"Full-grain leather"},{"group":"Size","label":"Fits","value":"Laptops up to 14 inches"},{"group":"Care","label":"Care","value":"Condition every few months, keep out of heavy rain"}]',
   '{tote,bag,leather,work}', '{Bestseller}',
   '[{"v":"Cognac","hex":"#9A4A1F"},{"v":"Black","hex":"#111111"}]',
   null, 599900, null, 900, '4202'),
  (19, '31', 'Canvas Crossbody Sling', 'canvas-crossbody-sling',
   'Waxed canvas sling with leather trims and an adjustable strap.',
   E'Waxed canvas sling with leather trims and an adjustable strap.\n\nTwo zip compartments take a phone, wallet, keys and a small bottle. Wear it across the body or over one shoulder.',
   '{"Waxed cotton canvas","Leather trims","Adjustable strap"}',
   '[{"group":"Build","label":"Material","value":"Waxed cotton canvas, leather trims"},{"group":"Build","label":"Compartments","value":"Two zip pockets"},{"group":"Care","label":"Care","value":"Spot clean"}]',
   '{sling,crossbody,bag,canvas}', '{New}',
   '[{"v":"Olive","hex":"#5B6B3A"},{"v":"Black","hex":"#111111"}]',
   null, 229900, null, 400, '4202'),
  (20, '32', 'Washed Cotton Cap', 'washed-cotton-cap',
   'Six-panel garment-washed twill with a brass back clasp.',
   E'Six-panel garment-washed twill with a brass back clasp.\n\nA low, unstructured crown and a curved brim. Garment-washing gives it a soft, worn-in feel from day one.',
   '{"Garment-washed cotton twill","Six-panel, unstructured","Adjustable brass clasp"}',
   '[{"group":"Build","label":"Material","value":"100% cotton twill"},{"group":"Fit","label":"Size","value":"One size, adjustable"},{"group":"Care","label":"Care","value":"Hand wash cold, reshape and air dry"}]',
   '{cap,hat,cotton}', '{}',
   '[{"v":"Stone","hex":"#CFC6B4"},{"v":"Navy","hex":"#1F2A44"},{"v":"Maroon","hex":"#6B1E2B"}]',
   null, 99900, null, 100, '6505'),
  (21, '33', 'Reversible Leather Belt', 'reversible-leather-belt',
   'Two colours in one, with a twist-to-swap brushed buckle.',
   E'Two colours in one, with a twist-to-swap brushed buckle.\n\nBlack on one side, brown on the other. Choose your trouser waist size.',
   '{"Reversible black and brown leather","Twist-to-swap buckle","Brushed metal hardware"}',
   '[{"group":"Build","label":"Material","value":"Leather, brushed metal buckle"},{"group":"Fit","label":"Sizing","value":"Order your trouser waist size"},{"group":"Care","label":"Care","value":"Wipe clean"}]',
   '{belt,leather,office}', '{}',
   '[{"v":"Black/Brown","hex":"#2B2118"}]',
   '{30,32,34,36,38,40}', 199900, null, 200, '4203'),
  (22, '33', 'Bifold Leather Wallet', 'bifold-leather-wallet',
   'Slim bifold, six card slots, RFID-blocking lining.',
   E'Slim bifold, six card slots, RFID-blocking lining.\n\nTwo note sections in a slim profile that sits flat in a front pocket.',
   '{"Six card slots","RFID-blocking lining","Slim bifold"}',
   '[{"group":"Build","label":"Material","value":"Full-grain leather"},{"group":"Build","label":"Slots","value":"Six cards, two note sections"},{"group":"Care","label":"Care","value":"Condition occasionally"}]',
   '{wallet,leather,gift,festive}', '{}',
   '[{"v":"Tan","hex":"#B0804F"},{"v":"Black","hex":"#111111"}]',
   null, 179900, null, 100, '4202'),
  (23, '34', 'Acetate Square Sunglasses', 'acetate-square-sunglasses',
   'Hand-polished acetate frame with UV400 polarised lenses.',
   E'Hand-polished acetate frame with UV400 polarised lenses.\n\nSturdy hinges, a hard case and a cleaning cloth in the box.',
   '{"Hand-polished acetate","UV400 polarised lenses","Hard case included"}',
   '[{"group":"Lens","label":"Protection","value":"UV400, polarised"},{"group":"Frame","label":"Material","value":"Acetate"},{"group":"Box","label":"Includes","value":"Hard case, cleaning cloth"}]',
   '{sunglasses,eyewear,acetate}', '{New}',
   '[{"v":"Tortoise","hex":"#6B4226"},{"v":"Black","hex":"#111111"}]',
   null, 299900, null, 150, '9004');

insert into public.products (id, category_id, name, slug, brand, short_description, description, highlights, specifications,
                             tags, badges, option_names, weight_grams, hsn_code, country_of_origin, returnable, status,
                             published_at, is_featured, sort_order, seo_title, seo_description)
select format('30000000-0000-4000-8000-%s', lpad(no::text, 12, '0'))::uuid,
       format('10000000-0000-4000-8000-%s', lpad(cat, 12, '0'))::uuid,
       name, slug, 'wavy', short, descr, highlights, specs, tags, badges,
       case when sizes is null then '{Colour}'::text[] else '{Colour,Size}'::text[] end,
       weight, hsn, 'India', true, 'published', now() - make_interval(days => 60 - no),
       'Bestseller' = any (badges), no, left(name || ' | wavy', 70), left(short, 170)
from _seed_products
on conflict do nothing;

-- Variants = colour x size (one-size products: one variant per colour).
insert into public.product_variants (id, product_id, sku, option1, option2, color_hex, price, compare_at_price, position)
select format('3100%s-0000-4000-8000-%s', lpad(p.no::text, 4, '0'), lpad(x.vv::text, 12, '0'))::uuid,
       format('30000000-0000-4000-8000-%s', lpad(p.no::text, 12, '0'))::uuid,
       upper(format('WVY-%s-%s-%s', lpad(p.no::text, 2, '0'),
                    regexp_replace(c.e ->> 'v', '[^A-Za-z0-9]', '', 'g'),
                    coalesce(regexp_replace(s.v, '[^A-Za-z0-9]', '', 'g'), 'OS'))),
       c.e ->> 'v', s.v, c.e ->> 'hex', p.price, p.compare, x.vv
from _seed_products p
cross join lateral jsonb_array_elements(p.colours) with ordinality c(e, ci)
cross join lateral (select v, i from unnest(p.sizes) with ordinality u(v, i)
                    union all select null, 1 where p.sizes is null) s(v, si)
cross join lateral (select (c.ci - 1) * coalesce(cardinality(p.sizes), 1) + s.si as vv) x
on conflict do nothing;

-- Stock: deterministic 25..60 per variant, written through the ledger (only where none is set yet).
select public.adjust_inventory(v.id, 25 + ((v.position * 7 + p.no * 3) % 36), 'initial', 'seed', 'import')
from public.product_variants v
join _seed_products p on format('30000000-0000-4000-8000-%s', lpad(p.no::text, 12, '0'))::uuid = v.product_id
join public.inventory i on i.variant_id = v.id
where i.on_hand = 0;

-- ---------- Collection membership ----------
insert into public.collection_products (collection_id, product_id, position)
select format('20000000-0000-4000-8000-%s', lpad(c::text, 12, '0'))::uuid,
       format('30000000-0000-4000-8000-%s', lpad(p::text, 12, '0'))::uuid, ord
from (values (1, array[4, 6, 9, 11, 13, 15, 19, 23]),
             (2, array[1, 2, 3, 8, 12, 14, 18, 20]),
             (3, array[5, 10, 11, 14, 18, 22]),
             (4, array[5, 6, 9, 15, 7]),
             (5, array[1, 4, 8, 16, 19, 20]),
             (6, array[3, 7, 14, 21, 22, 23])) as x(c, ps)
cross join lateral unnest(x.ps) with ordinality as u(p, ord)
on conflict do nothing;

-- ---------- Coupon ----------
insert into public.coupons (id, code, description, type, value, min_order_amount, starts_at, ends_at, status) values
  ('51000000-0000-4000-8000-000000000001', 'FESTIVE15', '15% off orders over ₹2,999 (15 Oct to 15 Nov 2026)',
   'percent', 15, 299900, '2026-10-15 00:00:00+05:30', '2026-11-15 23:59:59+05:30', 'active')
on conflict do nothing;

-- ---------- Home page (sort_order = render order; the FAQ preview is added by the page itself) ----------
insert into public.home_sections (id, type, title, subtitle, config, sort_order) values
  ('74000000-0000-4000-8000-000000000001', 'hero_carousel', null, null, '{
     "autoplayMs": 6500,
     "slides": [
       {"image": "/images/hero/hero-01-waxed-cotton-field-jacket.png", "imageAlt": "Olive waxed cotton field jacket",
        "eyebrow": "Winter layers, 2026", "heading": "Built for every season",
        "body": "Waxed cotton that shrugs off drizzle and softens with every wear.",
        "cta": {"label": "Get the look", "href": "/products/waxed-cotton-field-jacket"},
        "secondaryCta": {"label": "Shop outerwear", "href": "/collections/outerwear"}, "theme": "light"},
       {"image": "/images/hero/hero-02-court-classic-leather-sneaker.png", "imageAlt": "White leather court sneaker with a gum sole",
        "eyebrow": "The court classic", "heading": "Step into the classic",
        "body": "Full-grain leather on a stitched gum cupsole.",
        "cta": {"label": "Shop sneakers", "href": "/collections/sneakers"},
        "secondaryCta": {"label": "New arrivals", "href": "/collections/new-arrivals"}, "theme": "light"},
       {"image": "/images/hero/hero-03-everyday-leather-tote.png", "imageAlt": "Cognac leather tote bag",
        "eyebrow": "Carry better", "heading": "Carry less, carry better",
        "body": "One cognac leather tote that holds a laptop, a day and a change of plans.",
        "cta": {"label": "Get the look", "href": "/products/everyday-leather-tote"},
        "secondaryCta": {"label": "Shop bags", "href": "/collections/bags"}, "theme": "light"},
       {"image": "/images/hero/hero-04-satin-slip-midi-dress.png", "imageAlt": "Champagne satin slip midi dress",
        "eyebrow": "The festive edit", "heading": "Evening, simplified",
        "body": "A bias-cut satin slip that moves like water.",
        "cta": {"label": "Shop the edit", "href": "/collections/festive-edit"},
        "secondaryCta": {"label": "Sizing help", "href": "/faq"}, "theme": "light"}
     ]}', 1),
  ('74000000-0000-4000-8000-000000000002', 'category_grid', 'Shop by category', 'Built for every day',
   '{"categoryIds": ["10000000-0000-4000-8000-000000000001", "10000000-0000-4000-8000-000000000002",
                     "10000000-0000-4000-8000-000000000003"], "limit": 3}', 2),
  ('74000000-0000-4000-8000-000000000003', 'product_carousel', 'Best sellers', 'Team favourites',
   '{"source": "collection", "collectionId": "20000000-0000-4000-8000-000000000002", "limit": 10,
     "cta": {"label": "View all", "href": "/collections/best-sellers"}}', 3),
  ('74000000-0000-4000-8000-000000000004', 'tear_reveal', null, null,
   '{"word": "UNTAMED", "tagline": "WEAR IT LOUD", "variant": "tiger"}', 4),
  ('74000000-0000-4000-8000-000000000005', 'product_carousel', 'New arrivals', 'Just landed',
   '{"source": "collection", "collectionId": "20000000-0000-4000-8000-000000000001", "limit": 10,
     "cta": {"label": "View all", "href": "/collections/new-arrivals"}}', 5),
  -- collection_rail: subtitle renders as the overline, title as the heading.
  ('74000000-0000-4000-8000-000000000006', 'collection_rail', 'Worn, not stored', 'In the wild',
   '{"collectionIds": ["20000000-0000-4000-8000-000000000003", "20000000-0000-4000-8000-000000000004",
                       "20000000-0000-4000-8000-000000000005", "20000000-0000-4000-8000-000000000006"], "limit": 4}', 6),
  ('74000000-0000-4000-8000-000000000007', 'promo_banner', 'Crafted to last', null,
   '{"image": "/images/promo/promo-crafted-to-last.webp", "imageAlt": "Close-up of selvedge denim, linen and full-grain leather",
     "heading": "Fabric first. Always.",
     "body": "Long-staple cotton, European linen and full-grain leather, chosen to wear in rather than wear out.",
     "cta": {"label": "Shop clothing", "href": "/collections/clothing"}, "theme": "light"}', 7),
  ('74000000-0000-4000-8000-000000000008', 'tear_reveal', null, null,
   '{"word": "MADE TO MOVE", "tagline": "THE SHOE EDIT", "variant": "image",
     "image": "/images/tear/tear-made-to-move.webp", "imageAlt": "Leather sneakers, loafers and Chelsea boots lined up on a stone floor",
     "cta": {"label": "Shop shoes", "href": "/collections/shoes"}}', 8),
  -- testimonials: the "Testimonials" chip comes from UI copy, so the title is the heading.
  ('74000000-0000-4000-8000-000000000009', 'testimonials', 'Loved by people who wear it daily', null, '{"limit": 6}', 9),
  ('74000000-0000-4000-8000-000000000010', 'promo_banner', 'Festive drop', null,
   '{"image": "/images/promo/promo-festive-drop.webp", "imageAlt": "Satin slip dress, suede loafers and a leather tote styled for a festive evening",
     "heading": "Ready for the new season.",
     "body": "15% off orders over ₹2,999 with FESTIVE15, 15 October to 15 November.",
     "couponCode": "FESTIVE15", "cta": {"label": "Shop the edit", "href": "/collections/festive-edit"}, "theme": "dark"}', 10),
  -- blog_rail: the "Journal" overline comes from UI copy.
  ('74000000-0000-4000-8000-000000000011', 'blog_rail', 'Notes on wearing well', null, '{"limit": 3}', 11),
  ('74000000-0000-4000-8000-000000000012', 'newsletter', 'Stay close', null,
   '{"heading": "First look at every drop.", "body": "New arrivals, restocks and the occasional care guide. No spam.",
     "placeholder": "Your email", "buttonLabel": "Subscribe",
     "consentText": "By subscribing you agree to receive marketing emails. Unsubscribe anytime."}', 12)
on conflict do nothing;

-- ---------- FAQs ----------
insert into public.faqs (id, category, question, answer, sort_order) values
  ('70000000-0000-4000-8000-000000000001', 'shipping', 'How long does delivery take?',
   'Metro cities in 2-4 working days, the rest of India in 4-7. You''ll get tracking by email and SMS.', 1),
  ('70000000-0000-4000-8000-000000000002', 'shipping', 'Is shipping free?',
   'Free on orders over ₹1,999; otherwise a flat ₹99.', 2),
  ('70000000-0000-4000-8000-000000000003', 'returns', 'What is your return policy?',
   'Unworn items with tags can be returned within 15 days. Start a return from your account.', 3),
  ('70000000-0000-4000-8000-000000000004', 'returns', 'Can I exchange for a different size?',
   'Yes. Request an exchange from your order page and we''ll reserve the new size while the return is picked up.', 4),
  ('70000000-0000-4000-8000-000000000005', 'products', 'How do I find my size?',
   'Each product page has a size chart. Between sizes in tops, size up; jeans and trousers run true to waist size.', 5),
  ('70000000-0000-4000-8000-000000000006', 'products', 'How do I care for waxed cotton and suede?',
   'Spot-clean waxed cotton and re-wax yearly; brush suede when dry and use a suede protector. Never machine wash either.', 6),
  ('70000000-0000-4000-8000-000000000007', 'payments', 'Which payment methods do you accept?',
   'UPI, cards, net banking and wallets through Razorpay. Cash on delivery on orders up to ₹5,000.', 7)
on conflict do nothing;

-- ---------- Testimonials ----------
-- SAMPLE CONTENT for layout only: these are not real customers. Replace them with real customer
-- quotes (Admin > Testimonials) or unpublish them before launch.
insert into public.testimonials (id, author_name, author_role, quote, rating, product_id, is_published, sort_order) values
  ('71000000-0000-4000-8000-000000000001', 'Ananya R.', 'Architect, Pune',
   'The slip dress was the only thing I packed for three weddings. It never wrinkled once.', 5,
   '30000000-0000-4000-8000-000000000010', true, 1),
  ('71000000-0000-4000-8000-000000000002', 'Kabir S.', 'Product designer, Bengaluru',
   'Heavyweight tee that''s still square after twenty washes. I bought three more.', 5,
   '30000000-0000-4000-8000-000000000001', true, 2),
  ('71000000-0000-4000-8000-000000000003', 'Meera T.', 'Teacher, Kochi',
   'The tote fits my laptop, lunch and a book. Leather is softening beautifully.', 4,
   '30000000-0000-4000-8000-000000000018', true, 3),
  ('71000000-0000-4000-8000-000000000004', 'Arjun M.', 'Founder, Delhi',
   'Field jacket survived a Munnar monsoon weekend. Worth every rupee.', 5,
   '30000000-0000-4000-8000-000000000009', true, 4),
  ('71000000-0000-4000-8000-000000000005', 'Sana K.', 'Stylist, Mumbai',
   'The loafers needed zero breaking-in. Wore them straight to a shoot.', 5,
   '30000000-0000-4000-8000-000000000014', true, 5),
  ('71000000-0000-4000-8000-000000000006', 'Rohan D.', 'Engineer, Hyderabad',
   'Selvedge jeans run true to size. The fades are starting to show.', 4,
   '30000000-0000-4000-8000-000000000008', true, 6)
on conflict do nothing;

-- ---------- Content pages ----------
insert into public.content_pages (id, slug, page_type, title, status, blocks, seo_title, seo_description) values
  ('72000000-0000-4000-8000-000000000001', 'about', 'about', 'About wavy', 'published',
   '[{"type":"hero","heading":"Clothes you keep.","body":"wavy makes everyday clothing, shoes and accessories for India: honest fabrics, careful cuts and pieces that last."},
     {"type":"text","body":"We start with the fabric: heavyweight cotton, European linen, selvedge denim, merino and full-grain leather. Then we keep the designs simple, so they work together and outlast a season."}]',
   'About wavy', 'Everyday clothing, shoes and accessories for India, made from honest fabrics to last.'),
  ('72000000-0000-4000-8000-000000000002', 'faq', 'faq', 'Help & FAQ', 'published',
   '[{"type":"faq_list","source":"faqs"}]', 'Help & FAQ | wavy', 'Delivery, returns, sizing, care and payment answers.')
on conflict do nothing;

-- ---------- Blog ----------
insert into public.blog_categories (id, name, slug) values
  ('80000000-0000-4000-8000-000000000001', 'Style Guides', 'style-guides'),
  ('80000000-0000-4000-8000-000000000002', 'Care', 'care')
on conflict do nothing;
insert into public.blog_tags (id, name, slug) values
  ('81000000-0000-4000-8000-000000000001', 'Capsule wardrobe', 'capsule-wardrobe'),
  ('81000000-0000-4000-8000-000000000002', 'Leather care', 'leather-care'),
  ('81000000-0000-4000-8000-000000000003', 'Festive', 'festive')
on conflict do nothing;
insert into public.blog_posts (id, slug, title, excerpt, body, status, published_at, author_name, category_id,
                               reading_minutes, seo_title, seo_description) values
  ('82000000-0000-4000-8000-000000000001', 'ten-piece-wardrobe-for-indian-weather', 'The 10-piece wardrobe for Indian weather',
   'Ten hard-working pieces that handle dry heat, monsoon humidity and a short northern winter.',
   E'## Start with fabric, not trends\n\nIndian weather asks a lot of clothes: dry heat, humid monsoons and a short, sharp winter in the north. A small wardrobe works when every piece breathes, layers and survives frequent washing.\n\n## The ten pieces\n\n1. **Three heavyweight tees** in bone, black and green. 240 gsm cotton holds its shape and does not cling in humidity.\n2. **One oxford button-down.** Tucked into trousers for work, open over a tee at the weekend.\n3. **One linen shirt** for the hottest weeks of the year.\n4. **Pleated wide-leg trousers.** The fluid drape keeps air moving around the leg.\n5. **Straight selvedge jeans.** Rigid denim softens to you and needs washing far less often than you think.\n6. **One merino knit** for Delhi winters and cold air-conditioned offices.\n7. **White leather sneakers** that go with everything above.\n8. **A leather tote** big enough for a laptop, lunch and a change of plans.\n\n## How to make it work\n\nKeep colours quiet: bone, navy, black, olive and indigo all mix with each other. Spend the most on what you wear most, usually tees and shoes. Wash cotton cold and dry it in the shade so colours last, and give leather a day off between wears so it can dry out.',
   'published', now() - interval '12 days', 'wavy Studio', '80000000-0000-4000-8000-000000000001', 2,
   'The 10-piece wardrobe for Indian weather | wavy', 'Ten pieces that handle Indian heat, monsoon and winter: tees, shirts, trousers, denim, knitwear, sneakers and a tote.'),
  ('82000000-0000-4000-8000-000000000002', 'how-to-break-in-leather', 'How to break in leather (and when you don''t need to)',
   'Suede loafers are comfortable on day one. Welted boots and a new tote take a little patience.',
   E'## Not all leather needs breaking in\n\nSoft suede loafers are usually comfortable from the first wear, because suede is supple and a leather sole flexes easily. Structured calf leather, like a Goodyear-welted Chelsea boot, is different: the upper is firm and the footbed underneath has to mould to your foot.\n\n## Boots\n\nWear them at home for an hour or two at a time during the first week, with the socks you usually wear. Expect some firmness across the instep; it eases as the leather creases. Pinching at the toes, or a heel that slips more than a few millimetres, means the size is wrong, not that the boot needs more time.\n\n## Loafers\n\nIf a loafer rubs at the heel, wear it in short spells and let the lining shape itself. Do not soak leather or use heat to speed things up: both dry it out and can crack it.\n\n## Bags take time too\n\nA new leather tote can feel stiff. Use it daily, carry it by the handles and store it lightly stuffed with paper. Condition it every few months with a neutral cream.\n\n## Simple care\n\nBrush suede only when it is dry, rotate shoes so they rest between wears, and use cedar shoe trees if you can. Leather that is looked after gets better with age.',
   'published', now() - interval '6 days', 'wavy Studio', '80000000-0000-4000-8000-000000000002', 2,
   'How to break in leather | wavy', 'How to break in leather boots, loafers and bags, when you do not need to, and how to care for them.'),
  ('82000000-0000-4000-8000-000000000003', 'dressing-for-diwali-without-the-fuss', 'Dressing for Diwali without the fuss',
   'Comfortable, dressed-up outfits for long festive evenings, plus easy gifting picks.',
   E'## Plan for a long evening\n\nDiwali evenings run from puja to dinner to late visits, often in warm rooms full of diyas and sparklers. Choose clothes that stay comfortable for hours, and keep loose fabric well away from open flames.\n\n## For her\n\nA bias-cut satin slip dress is the easiest dressed-up option there is: it packs flat, barely creases and works with a light shawl or a cropped knit. If you prefer something softer, a ribbed knit co-ord feels relaxed but looks put together, and the top and pant work separately afterwards.\n\n## For him\n\nA fine merino crew, over a collared shirt or on its own, looks smart without a jacket. Pair it with suede penny loafers: they are comfortable for a night of visiting and need no breaking in.\n\n## Keep accessories simple\n\nOne good leather piece goes a long way. A cognac tote carries gifts and sweets between houses, and a slim bifold wallet keeps your pocket line clean.\n\n## Gifting\n\nBuying for someone else? Wallets, caps and sunglasses are safe on size. For clothing, check the size chart on each product page, and remember that unworn items with tags can be exchanged after the festival.',
   'published', now() - interval '2 days', 'wavy Studio', '80000000-0000-4000-8000-000000000001', 2,
   'Dressing for Diwali without the fuss | wavy', 'Easy festive outfits for long Diwali evenings, and simple gifting picks.')
on conflict do nothing;
insert into public.blog_post_tags (post_id, tag_id) values
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001'),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000002'),
  ('82000000-0000-4000-8000-000000000003', '81000000-0000-4000-8000-000000000003')
on conflict do nothing;

-- ---------- SEO ----------
insert into public.seo_overrides (path, title, description) values
  ('/', 'wavy | Everyday clothing, shoes and accessories',
   'Heavyweight tees, linen shirts, selvedge denim, leather sneakers and bags, made to last. Free shipping over ₹1,999.'),
  ('/collections/new-arrivals', 'New Arrivals | wavy', 'The newest clothing, shoes and accessories at wavy.')
on conflict do nothing;
insert into public.redirects (from_path, to_path, status_code) values
  ('/shop', '/collections/new-arrivals', 301)
on conflict do nothing;

commit;
