-- =============================================================================
-- Demo seed for local dev (supabase db reset). NOT for production.
-- Reference data needed everywhere (permissions, role map, payment gateways, store
-- settings, integration rows) lives in the migrations, not here.
--
-- Deterministic UUIDs so src/data/*.ts can use the same ids:
--   categories   10000000-0000-4000-8000-0000000000NN   (01 clothing, 02 sneakers, 11-15, 21-23)
--   collections  20000000-0000-4000-8000-00000000000N
--   products     30000000-0000-4000-8000-0000000000NN   (01..16)
--   variants     3100PPPP-0000-4000-8000-0000000000VV   (PPPP = product no, VV = (colour-1)*sizes + size)
--   media        3200PPPP-0000-4000-8000-0000000000MM
--   attributes   40000000-...-00000000000N / values 4100000A-...-0000000000VV
--   offers 50000000-..., coupons 51000000-..., zones 60000000-..., methods 61000000-...
--   faqs 70000000-..., testimonials 71000000-..., pages 72000000-..., lookbook 73000000-...
--   blog categories 80000000-..., tags 81000000-..., posts 82000000-..., campaigns 90000000-...
-- Prices in paise.
-- =============================================================================

update public.store_settings
   set store_name = 'wavy', tax_percentage = 12, tax_inclusive = true, gst_number = '29ABCDE1234F1Z5',
       free_shipping_threshold = 149900, flat_shipping_fee = 9900, cod_enabled = true, cod_fee = 4900,
       cod_max_order_amount = 1000000, return_window_days = 7, support_email = 'support@wavy.store',
       support_phone = '+919000000000'
 where id;

-- ---------- Shipping ----------
insert into public.shipping_zones (id, name, states, is_default) values
  ('60000000-0000-4000-8000-000000000001', 'India', '{}', true);
insert into public.shipping_methods (id, zone_id, code, name, description, rate, free_above, cod_available, min_days, max_days, sort_order) values
  ('61000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'standard', 'Standard',
   'Free over Rs 1,499', 9900, null, true, 3, 7, 1),
  ('61000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001', 'express', 'Express',
   'Metro cities in 1-3 days', 19900, 999999999, false, 1, 3, 2);

-- ---------- Categories ----------
insert into public.categories (id, parent_id, name, slug, description, sort_order) values
  ('10000000-0000-4000-8000-000000000001', null, 'Clothing', 'clothing', 'Everyday essentials, cut well.', 1),
  ('10000000-0000-4000-8000-000000000002', null, 'Sneakers', 'sneakers', 'Low, high and running.', 2),
  ('10000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001', 'T-Shirts', 't-shirts', null, 1),
  ('10000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000001', 'Shirts', 'shirts', null, 2),
  ('10000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'Hoodies', 'hoodies', null, 3),
  ('10000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000001', 'Jackets', 'jackets', null, 4),
  ('10000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000001', 'Trousers', 'trousers', null, 5),
  ('10000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000002', 'Low-top', 'low-top', null, 1),
  ('10000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000002', 'High-top', 'high-top', null, 2),
  ('10000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000002', 'Runners', 'runners', null, 3);

-- ---------- Collections ----------
insert into public.collections (id, name, slug, description, sort_order, is_featured, image_url, image_alt) values
  ('20000000-0000-4000-8000-000000000001', 'Everyday Basics', 'everyday-basics',
   'The tees you reach for first. Any 3 for Rs 999.', 1, true,
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1600&q=80', 'Folded plain t-shirts'),
  ('20000000-0000-4000-8000-000000000002', 'New Season', 'new-season',
   'Linen, loopback and canvas for the months ahead.', 2, true,
   'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1600&q=80', 'Linen shirt on a hanger'),
  ('20000000-0000-4000-8000-000000000003', 'The Sneaker Edit', 'sneaker-edit',
   'Five pairs that go with everything.', 3, true,
   'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&q=80', 'Pair of sneakers');

-- ---------- Products + variants + media ----------
create temp table _seed_products (
  no int, code text, name text, slug text, category text, descriptor text, description text,
  material text, fit text, care text, badges text[], price int, compare_at int, try_on boolean,
  colors jsonb, sizes text[], image text, hsn text
);

insert into _seed_products values
  (1,  'TEE01', 'Essential Crew Tee', 'essential-crew-tee', '11', 'Midweight organic cotton',
   'A 180 GSM organic cotton crew with a clean neckline that holds its shape wash after wash.',
   '100% organic cotton', 'Regular', 'Machine wash cold, tumble dry low', '{Bestseller}', 44900, null, true,
   '[{"name":"Black","hex":"#111111"},{"name":"White","hex":"#F5F5F0"},{"name":"Olive","hex":"#5B6B3A"}]',
   '{XS,S,M,L,XL}', 'photo-1521572163474-6864f9cf17ab', '6109'),
  (2,  'TEE02', 'Essential V-Neck Tee', 'essential-v-neck-tee', '11', 'Midweight organic cotton',
   'Our crew in a shallow V. Soft, breathable and made to layer.',
   '100% organic cotton', 'Regular', 'Machine wash cold', '{}', 44900, null, true,
   '[{"name":"Heather Grey","hex":"#9A9A9A"},{"name":"Navy","hex":"#1F2A44"}]',
   '{XS,S,M,L,XL}', 'photo-1583743814966-8936f5b7be1a', '6109'),
  (3,  'TEE03', 'Washed Graphic Tee', 'washed-graphic-tee', '11', 'Garment-dyed, lived-in feel',
   'Garment washed for a broken-in hand and printed with water-based inks.',
   '100% cotton', 'Relaxed', 'Wash inside out', '{New}', 49900, 69900, true,
   '[{"name":"Washed Black","hex":"#2B2B2B"},{"name":"Sand","hex":"#D8C8A8"}]',
   '{XS,S,M,L,XL}', 'photo-1576566588028-4147f3842f27', '6109'),
  (4,  'SHT01', 'Relaxed Oxford Shirt', 'relaxed-oxford-shirt', '12', 'Brushed cotton oxford',
   'A soft oxford with a relaxed body, button-down collar and a single chest pocket.',
   '100% cotton oxford', 'Relaxed', 'Machine wash warm', '{}', 249900, null, true,
   '[{"name":"Sky Blue","hex":"#A7C4E0"},{"name":"White","hex":"#F5F5F0"}]',
   '{XS,S,M,L,XL}', 'photo-1596755094514-f87e34085b2c', '6205'),
  (5,  'SHT02', 'Linen Camp-Collar Shirt', 'linen-camp-collar-shirt', '12', 'European flax linen',
   'Airy linen with a camp collar and straight hem, made for Indian summers.',
   '100% linen', 'Relaxed', 'Hand wash or gentle cycle', '{New}', 279900, 329900, true,
   '[{"name":"Natural","hex":"#E8DFCF"},{"name":"Sage","hex":"#9CAF88"}]',
   '{XS,S,M,L,XL}', 'photo-1602810318383-e386cc2a3ccf', '6205'),
  (6,  'HOD01', 'Loopback Zip Hoodie', 'loopback-zip-hoodie', '13', '400 GSM loopback terry',
   'Heavy loopback terry with a two-way zip, lined hood and ribbed cuffs.',
   '100% cotton loopback', 'Regular', 'Machine wash cold, dry flat', '{}', 349900, null, true,
   '[{"name":"Charcoal","hex":"#36454F"},{"name":"Oatmeal","hex":"#E3D9C6"}]',
   '{XS,S,M,L,XL}', 'photo-1556821840-3a63f95609a7', '6110'),
  (7,  'HOD02', 'Oversized Pullover Hoodie', 'oversized-pullover-hoodie', '13', 'Brushed-back fleece',
   'A dropped-shoulder pullover with a roomy kangaroo pocket.',
   '80% cotton, 20% polyester', 'Oversized', 'Machine wash cold', '{Bestseller}', 319900, null, true,
   '[{"name":"Black","hex":"#111111"},{"name":"Dusty Rose","hex":"#C9A0A0"}]',
   '{XS,S,M,L,XL}', 'photo-1620799140408-edc6dcb6d633', '6110'),
  (8,  'JKT01', 'Canvas Chore Jacket', 'canvas-chore-jacket', '14', '12 oz cotton canvas',
   'A workwear classic with three patch pockets and corozo buttons. Softens with every wear.',
   '100% cotton canvas', 'Regular', 'Spot clean or cold wash', '{New}', 499900, null, true,
   '[{"name":"Tan","hex":"#B08D57"},{"name":"Navy","hex":"#1F2A44"}]',
   '{S,M,L,XL}', 'photo-1591047139829-d91aecb6caea', '6201'),
  (9,  'JKT02', 'Nylon Coach Jacket', 'nylon-coach-jacket', '14', 'Water-resistant nylon',
   'Snap-front coach jacket in a water-resistant shell with a mesh lining.',
   '100% nylon, mesh lining', 'Regular', 'Machine wash cold, hang dry', '{}', 449900, 549900, true,
   '[{"name":"Black","hex":"#111111"},{"name":"Forest","hex":"#2F4F3A"}]',
   '{S,M,L,XL}', 'photo-1551028719-00167b16eac5', '6201'),
  (10, 'TRS01', 'Pleated Wide Trouser', 'pleated-wide-trouser', '15', 'Drapey twill',
   'Single-pleat wide-leg trouser with a clean waistband and side adjusters.',
   '68% polyester, 32% viscose', 'Wide', 'Dry clean or gentle wash', '{}', 299900, null, false,
   '[{"name":"Stone","hex":"#BDB6A6"},{"name":"Black","hex":"#111111"}]',
   '{28,30,32,34,36}', 'photo-1624378439575-d8705ad7ae80', '6203'),
  (11, 'TRS02', 'Utility Cargo Pant', 'utility-cargo-pant', '15', 'Ripstop cotton',
   'Six-pocket cargo in durable ripstop with a tapered leg and drawcord hem.',
   '100% cotton ripstop', 'Relaxed', 'Machine wash cold', '{}', 279900, null, false,
   '[{"name":"Olive","hex":"#5B6B3A"},{"name":"Khaki","hex":"#C3B091"}]',
   '{28,30,32,34,36}', 'photo-1594633312681-425c7b97ccd1', '6203'),
  (12, 'SNK01', 'Court Low Leather', 'court-low-leather', '21', 'Full-grain leather court shoe',
   'A minimal court silhouette in full-grain leather on a stitched cupsole.',
   'Full-grain leather, rubber cupsole', 'True to size', 'Wipe clean', '{Bestseller}', 599900, null, false,
   '[{"name":"White","hex":"#F5F5F0"},{"name":"Black","hex":"#111111"}]',
   '{UK6,UK7,UK8,UK9,UK10}', 'photo-1549298916-b41d501d3772', '6403'),
  (13, 'SNK02', 'Canvas Low Classic', 'canvas-low-classic', '21', 'Vulcanised canvas',
   'The everyday canvas low-top with a vulcanised sole and cushioned insole.',
   'Cotton canvas, vulcanised rubber', 'True to size', 'Hand wash', '{}', 349900, 399900, false,
   '[{"name":"Off White","hex":"#F2EFE6"},{"name":"Navy","hex":"#1F2A44"}]',
   '{UK6,UK7,UK8,UK9,UK10}', 'photo-1608231387042-66d1773070a5', '6404'),
  (14, 'SNK03', 'Hi-Court Suede', 'hi-court-suede', '22', 'Suede high-top',
   'A padded-collar high-top in soft suede with a gum outsole.',
   'Suede upper, gum rubber', 'Runs large - size down', 'Suede brush', '{New}', 649900, null, false,
   '[{"name":"Chestnut","hex":"#8B5A2B"},{"name":"Grey","hex":"#8C8C8C"}]',
   '{UK6,UK7,UK8,UK9,UK10}', 'photo-1600185365483-26d7a4cc7519', '6403'),
  (15, 'SNK04', 'Canvas High Classic', 'canvas-high-classic', '22', 'Vulcanised canvas high-top',
   'Our canvas classic, taller. Metal eyelets and a toe cap that lasts.',
   'Cotton canvas, vulcanised rubber', 'True to size', 'Hand wash', '{}', 399900, null, false,
   '[{"name":"Black","hex":"#111111"},{"name":"Cream","hex":"#F3E9D2"}]',
   '{UK6,UK7,UK8,UK9,UK10}', 'photo-1607522370275-f14206abe5d3', '6404'),
  (16, 'SNK05', 'Stride Runner', 'stride-runner', '23', 'Engineered mesh daily trainer',
   'Breathable engineered mesh on a responsive foam midsole for everyday miles.',
   'Engineered mesh, EVA foam', 'True to size', 'Hand wash, air dry', '{New}', 699900, null, false,
   '[{"name":"Signal Red","hex":"#C8102E"},{"name":"Ice Grey","hex":"#D6DADF"}]',
   '{UK6,UK7,UK8,UK9,UK10}', 'photo-1542291026-7eec264c27ff', '6404');

insert into public.products (id, category_id, name, slug, descriptor, description, material, fit, care, badges,
                             status, try_on_enabled, hsn_code, seo_title, seo_description)
select format('30000000-0000-4000-8000-%s', lpad(no::text, 12, '0'))::uuid,
       format('10000000-0000-4000-8000-%s', lpad(category, 12, '0'))::uuid,
       name, slug, descriptor, description, material, fit, care, badges, 'published', try_on, hsn,
       left(name || ' | wavy', 70), left(descriptor || '. ' || description, 170)
from _seed_products;

insert into public.product_variants (id, product_id, sku, color, color_hex, size, size_sort, price, compare_at, sort_order)
select format('3100%s-0000-4000-8000-%s', lpad(p.no::text, 4, '0'), lpad(((c.ci - 1) * array_length(p.sizes, 1) + s.si)::text, 12, '0'))::uuid,
       format('30000000-0000-4000-8000-%s', lpad(p.no::text, 12, '0'))::uuid,
       'wavy-' || p.code || '-' || upper(left(regexp_replace(c.col ->> 'name', '[^A-Za-z]', '', 'g'), 3)) || '-' || s.size,
       c.col ->> 'name', c.col ->> 'hex', s.size, s.si * 10, p.price, p.compare_at,
       (c.ci - 1) * array_length(p.sizes, 1) + s.si
from _seed_products p
cross join lateral jsonb_array_elements(p.colors) with ordinality as c(col, ci)
cross join lateral unnest(p.sizes) with ordinality as s(size, si);

insert into public.product_media (id, product_id, url, alt, width, height, sort_order, is_primary)
select format('3200%s-0000-4000-8000-000000000001', lpad(no::text, 4, '0'))::uuid,
       format('30000000-0000-4000-8000-%s', lpad(no::text, 12, '0'))::uuid,
       'https://images.unsplash.com/' || image || '?w=1200&q=80', name, 1200, 1500, 0, true
from _seed_products;

-- Stock: deterministic 0..24 per variant (a few sell-outs for realism).
select public.adjust_inventory(v.id, ((v.sort_order * 7 + p.no * 3) % 25), 'initial', 'seed')
from public.product_variants v
join _seed_products p on format('30000000-0000-4000-8000-%s', lpad(p.no::text, 12, '0'))::uuid = v.product_id
where ((v.sort_order * 7 + p.no * 3) % 25) > 0;

drop table _seed_products;

-- Collections
insert into public.collection_products (collection_id, product_id, sort_order)
select format('20000000-0000-4000-8000-%s', lpad(c::text, 12, '0'))::uuid,
       format('30000000-0000-4000-8000-%s', lpad(p::text, 12, '0'))::uuid, ord
from (values (1, array[1, 2, 3]), (2, array[5, 6, 8, 9, 10, 14]), (3, array[12, 13, 14, 15, 16])) as x(c, ps)
cross join lateral unnest(x.ps) with ordinality as u(p, ord);

-- Related products
insert into public.related_products (product_id, related_product_id, relation_type, sort_order)
select format('30000000-0000-4000-8000-%s', lpad(a::text, 12, '0'))::uuid,
       format('30000000-0000-4000-8000-%s', lpad(b::text, 12, '0'))::uuid, t, 0
from (values (1, 2, 'similar'), (1, 3, 'similar'), (1, 10, 'complete_the_look'), (4, 5, 'similar'),
             (6, 7, 'similar'), (8, 11, 'complete_the_look'), (12, 13, 'similar'), (14, 15, 'similar'),
             (16, 12, 'related')) as r(a, b, t);

-- ---------- Filter attributes ----------
insert into public.attributes (id, code, name, applies_to, sort_order) values
  ('40000000-0000-4000-8000-000000000001', 'material',   'Material',   'all',      1),
  ('40000000-0000-4000-8000-000000000002', 'silhouette', 'Silhouette', 'footwear', 2),
  ('40000000-0000-4000-8000-000000000003', 'fit',        'Fit',        'apparel',  3);
insert into public.attribute_values (id, attribute_id, value, slug, sort_order) values
  ('41000001-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Cotton',  'cotton',  1),
  ('41000001-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 'Linen',   'linen',   2),
  ('41000001-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001', 'Nylon',   'nylon',   3),
  ('41000001-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000001', 'Leather', 'leather', 4),
  ('41000001-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000001', 'Suede',   'suede',   5),
  ('41000001-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000001', 'Canvas',  'canvas',  6),
  ('41000001-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000001', 'Mesh',    'mesh',    7),
  ('41000002-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 'Low-top', 'low-top', 1),
  ('41000002-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'High-top','high-top',2),
  ('41000002-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000002', 'Runner',  'runner',  3),
  ('41000003-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 'Regular', 'regular', 1),
  ('41000003-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000003', 'Relaxed', 'relaxed', 2),
  ('41000003-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 'Oversized','oversized',3),
  ('41000003-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000003', 'Wide',    'wide',    4);
insert into public.product_attribute_values (product_id, attribute_value_id)
select format('30000000-0000-4000-8000-%s', lpad(p::text, 12, '0'))::uuid, v::uuid
from (values
  (1, '41000001-0000-4000-8000-000000000001'), (2, '41000001-0000-4000-8000-000000000001'), (3, '41000001-0000-4000-8000-000000000001'),
  (4, '41000001-0000-4000-8000-000000000001'), (5, '41000001-0000-4000-8000-000000000002'), (6, '41000001-0000-4000-8000-000000000001'),
  (7, '41000001-0000-4000-8000-000000000001'), (8, '41000001-0000-4000-8000-000000000006'), (9, '41000001-0000-4000-8000-000000000003'),
  (10, '41000003-0000-4000-8000-000000000004'), (11, '41000001-0000-4000-8000-000000000001'),
  (12, '41000001-0000-4000-8000-000000000004'), (13, '41000001-0000-4000-8000-000000000006'), (14, '41000001-0000-4000-8000-000000000005'),
  (15, '41000001-0000-4000-8000-000000000006'), (16, '41000001-0000-4000-8000-000000000007'),
  (12, '41000002-0000-4000-8000-000000000001'), (13, '41000002-0000-4000-8000-000000000001'), (14, '41000002-0000-4000-8000-000000000002'),
  (15, '41000002-0000-4000-8000-000000000002'), (16, '41000002-0000-4000-8000-000000000003'),
  (1, '41000003-0000-4000-8000-000000000001'), (3, '41000003-0000-4000-8000-000000000002'), (4, '41000003-0000-4000-8000-000000000002'),
  (7, '41000003-0000-4000-8000-000000000003')) as x(p, v);

-- ---------- Offers + coupons ----------
insert into public.offers (id, name, slug, description, type, status, priority, required_qty, bundle_price,
                           badge_text, nudge_template) values
  ('50000000-0000-4000-8000-000000000001', '3 for Rs 999', 'basics-3-for-999',
   'Any 3 tees from Everyday Basics for Rs 999.', 'bundle_fixed_price', 'active', 10, 3, 99900,
   '3 for Rs 999', 'Add {n} more to get 3 for Rs 999');
insert into public.discount_targets (offer_id, mode, collection_id) values
  ('50000000-0000-4000-8000-000000000001', 'include', '20000000-0000-4000-8000-000000000001');

insert into public.coupons (id, code, description, type, value, min_order_amount, max_discount_amount,
                            usage_limit_per_user, first_order_only, status) values
  ('51000000-0000-4000-8000-000000000001', 'WELCOME10', '10% off your first order (up to Rs 500)',
   'percent', 10, 99900, 50000, 1, true, 'active'),
  ('51000000-0000-4000-8000-000000000002', 'FREESHIP', 'Free shipping on orders over Rs 499',
   'free_shipping', 0, 49900, null, null, false, 'active');

-- ---------- Campaign ----------
insert into public.campaigns (id, name, slug, status, channel, description, hero_image_url, hero_image_alt,
                              utm_campaign, offer_id, starts_at) values
  ('90000000-0000-4000-8000-000000000001', 'Basics Week', 'basics-week', 'live', 'site',
   'Stock up: any 3 Everyday Basics tees for Rs 999.',
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1600&q=80', 'Stack of tees',
   'basics_week', '50000000-0000-4000-8000-000000000001', now() - interval '1 day');
insert into public.campaign_collections (campaign_id, collection_id) values
  ('90000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001');

-- ---------- Content ----------
insert into public.faqs (id, category, question, answer, sort_order) values
  ('70000000-0000-4000-8000-000000000001', 'shipping', 'How long does delivery take?',
   'Standard delivery takes 3-7 working days across India; Express reaches metro cities in 1-3 days.', 1),
  ('70000000-0000-4000-8000-000000000002', 'shipping', 'Is shipping free?',
   'Standard shipping is free on orders above Rs 1,499. Below that it is Rs 99.', 2),
  ('70000000-0000-4000-8000-000000000003', 'payments', 'Which payment methods do you accept?',
   'UPI, cards, netbanking and wallets via Razorpay, plus Cash on Delivery (Rs 49 fee) on eligible orders.', 3),
  ('70000000-0000-4000-8000-000000000004', 'payments', 'My payment failed but money was deducted. What now?',
   'If the order did not confirm, the amount is auto-refunded by your bank within 5-7 working days. You will never be charged twice for one order.', 4),
  ('70000000-0000-4000-8000-000000000005', 'returns', 'What is your return policy?',
   'Unworn items with tags can be returned within 7 days of delivery from your account. We arrange the pickup.', 5),
  ('70000000-0000-4000-8000-000000000006', 'try_on', 'Is the virtual try-on accurate for sizing?',
   'Try-on is a visual preview only. It is not a fit or size guarantee; please use the size guide.', 6);

insert into public.testimonials (id, author_name, author_role, quote, rating, is_published, sort_order) values
  ('71000000-0000-4000-8000-000000000001', 'Aarav M.', 'Bengaluru',
   'The Essential Crew is the best tee I own. Bought three more with the bundle.', 5, true, 1),
  ('71000000-0000-4000-8000-000000000002', 'Isha K.', 'Mumbai',
   'Linen shirt survived a Mumbai monsoon week and still looks sharp.', 5, true, 2),
  ('71000000-0000-4000-8000-000000000003', 'Rohan S.', 'Delhi',
   'Court Lows are comfortable out of the box. Delivery was two days.', 4, true, 3);

insert into public.content_pages (id, slug, page_type, title, status, blocks, seo_title, seo_description) values
  ('72000000-0000-4000-8000-000000000001', 'about', 'about', 'About wavy', 'published',
   '[{"type":"hero","heading":"Made to be worn, not kept.","body":"wavy makes considered everyday clothing and sneakers in India."},
     {"type":"text","body":"We work with a small set of mills and factories and publish what goes into every piece."}]',
   'About wavy', 'Considered everyday clothing and sneakers, designed and made in India.'),
  ('72000000-0000-4000-8000-000000000002', 'faq', 'faq', 'Help & FAQ', 'published',
   '[{"type":"faq_list","source":"faqs"}]', 'Help & FAQ | wavy', 'Shipping, payments, returns and sizing answers.'),
  ('72000000-0000-4000-8000-000000000003', 'lookbook', 'lookbook', 'Lookbook SS26', 'published',
   '[{"type":"lookbook_grid","source":"lookbook_entries"}]', 'Lookbook SS26 | wavy', 'The new season, styled.');

insert into public.lookbook_entries (id, title, season, description, image_url, image_alt, sort_order, is_published) values
  ('73000000-0000-4000-8000-000000000001', 'Linen, lightly', 'SS26', 'Camp collars and wide trousers.',
   'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1600&q=80', 'Linen shirt and trousers', 1, true),
  ('73000000-0000-4000-8000-000000000002', 'Canvas days', 'SS26', 'Chore jacket over the Essential Crew.',
   'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1600&q=80', 'Canvas jacket', 2, true);
insert into public.lookbook_entry_products (entry_id, product_id, hotspot_x, hotspot_y) values
  ('73000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000005', 45, 35),
  ('73000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000010', 50, 75),
  ('73000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000008', 50, 40),
  ('73000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 50, 55);

-- ---------- Blog ----------
insert into public.blog_categories (id, name, slug) values
  ('80000000-0000-4000-8000-000000000001', 'Style Guides', 'style-guides'),
  ('80000000-0000-4000-8000-000000000002', 'Behind the Seams', 'behind-the-seams');
insert into public.blog_tags (id, name, slug) values
  ('81000000-0000-4000-8000-000000000001', 'Basics', 'basics'),
  ('81000000-0000-4000-8000-000000000002', 'Sneakers', 'sneakers'),
  ('81000000-0000-4000-8000-000000000003', 'Care', 'care');
insert into public.blog_posts (id, slug, title, excerpt, cover_url, cover_alt, body, status, published_at,
                               author_name, category_id, reading_minutes, seo_title, seo_description) values
  ('82000000-0000-4000-8000-000000000001', 'how-to-build-a-tee-rotation', 'How to build a tee rotation that lasts',
   'Three colours, one fit, zero thinking: the case for a small, great tee wardrobe.',
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1600&q=80', 'Folded t-shirts',
   E'## Start with three\n\nBlack, white and one colour you love. Buy them in the same fit.\n\n## Wash cold\n\nCold water and a low tumble keep organic cotton from shrinking.',
   'published', now() - interval '10 days', 'wavy Studio', '80000000-0000-4000-8000-000000000001', 4,
   'How to build a tee rotation | wavy', 'Three colours, one fit: building a tee wardrobe that lasts.'),
  ('82000000-0000-4000-8000-000000000002', 'caring-for-suede-sneakers', 'Caring for suede sneakers in monsoon',
   'A brush, a protector spray and a little patience keep suede looking new.',
   'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1600&q=80', 'Suede high-top sneaker',
   E'## Protect first\n\nSpray before the first wear and every few weeks after.\n\n## Dry naturally\n\nNever use a heater; stuff with paper and let air do the work.',
   'published', now() - interval '3 days', 'wavy Studio', '80000000-0000-4000-8000-000000000002', 3,
   'Suede sneaker care | wavy', 'Keep suede sneakers looking new through the monsoon.');
insert into public.blog_post_tags (post_id, tag_id) values
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001'),
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000003'),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000002'),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000003');

-- ---------- SEO ----------
insert into public.seo_overrides (path, title, description) values
  ('/', 'wavy | Everyday clothing and sneakers', 'Considered tees, shirts, hoodies, jackets and sneakers. Free shipping over Rs 1,499.'),
  ('/collections/everyday-basics', 'Everyday Basics - Any 3 for Rs 999 | wavy', 'Organic cotton tees. Mix any 3 for Rs 999.');
insert into public.redirects (from_path, to_path, status_code) values
  ('/shop', '/collections/new-season', 301);
