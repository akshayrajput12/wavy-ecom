-- =============================================================================
-- Demo seed for local dev (supabase db reset). NOT for production.
-- A general store: electronics, home & kitchen, beauty, fashion, books, grocery.
-- Reference data needed everywhere (permissions, role map, payment gateways, store
-- settings row, integration rows) lives in the migrations; this file only tunes it.
--
-- Deterministic UUIDs so src/data/*.ts can use the same ids:
--   categories   10000000-0000-4000-8000-0000000000NN   top level 01-06, children <parent><n> (11, 12, 21...)
--   collections  20000000-0000-4000-8000-00000000000N   1 new-arrivals 2 best-sellers 3 festive-gifting
--                                                        4 under-999 5 work-from-home
--   products     30000000-0000-4000-8000-0000000000NN   (01..32)
--   variants     3100PPPP-0000-4000-8000-0000000000VV   PPPP = product no, VV = (i1-1) * count(option2) + i2
--   media        3200PPPP-0000-4000-8000-0000000000MM
--   reviews      3300PPPP-0000-4000-8000-0000000000RR
--   attributes   40000000-...-00000000000N / values 4100000A-...-0000000000VV
--   offers 50000000-..., coupons 51000000-..., zones 60000000-..., methods 61000000-...
--   faqs 70000000-..., testimonials 71000000-..., pages 72000000-..., home sections 74000000-...
--   blog categories 80000000-..., tags 81000000-..., posts 82000000-..., campaigns 90000000-...
-- SKU = <CODE>-<OPTION1>-<OPTION2> (letters/digits only, upper case). Prices in paise.
-- =============================================================================

update public.store_settings
   set store_name = 'wavy', tax_percentage = 18, tax_inclusive = true, gst_number = '29ABCDE1234F1Z5',
       free_shipping_threshold = 99900, flat_shipping_fee = 7900, cod_enabled = true, cod_fee = 4900,
       cod_max_order_amount = 2500000, return_window_days = 7, low_stock_default = 5,
       support_email = 'support@wavy.store', support_phone = '+919000000000'
 where id;

-- ---------- Shipping ----------
insert into public.shipping_zones (id, name, states, is_default) values
  ('60000000-0000-4000-8000-000000000001', 'Rest of India', '{}', true),
  ('60000000-0000-4000-8000-000000000002', 'Metro',
   '{Maharashtra,Delhi,Karnataka,Tamil Nadu,Telangana,West Bengal}', false);
insert into public.shipping_methods (id, zone_id, code, name, description, rate, free_above, cod_available, min_days, max_days, sort_order) values
  ('61000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'standard', 'Standard',
   'Free over Rs 999', 7900, null, true, 4, 7, 1),
  ('61000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', 'metro_standard', 'Standard',
   'Free over Rs 999', 4900, null, true, 2, 4, 1),
  ('61000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000002', 'metro_express', 'Express',
   'Next-day delivery in metro cities', 14900, 299900, false, 1, 2, 2);

-- ---------- Categories ----------
insert into public.categories (id, parent_id, name, slug, description, image_url, image_alt, banner_url, banner_alt,
                               sort_order, show_on_home, seo_title, seo_description)
select format('10000000-0000-4000-8000-%s', lpad(no, 12, '0'))::uuid,
       case when parent is null then null else format('10000000-0000-4000-8000-%s', lpad(parent, 12, '0'))::uuid end,
       name, slug, descr,
       'https://images.unsplash.com/photo-' || tile || '?w=1200&q=80', name,
       case when banner is not null then 'https://images.unsplash.com/photo-' || banner || '?w=1200&q=80' end,
       case when banner is not null then name end,
       sort, parent is null, left(name || ' | wavy', 70), left(descr, 170)
from (values
  ('01', null, 'Electronics',        'electronics',        'Phones, audio, wearables and the accessories that make them better.',
   '1498049794561-7780e7231661', '1468495244123-6c6c332eeece', 1),
  ('02', null, 'Home & Kitchen',     'home-kitchen',       'Cookware, tableware, decor and bedding for a home that works.',
   '1586023492125-27b2c045efd7', '1513694203232-719a280e022f', 2),
  ('03', null, 'Beauty',             'beauty',             'Skincare, haircare and makeup with clean, readable ingredient lists.',
   '1522335789203-aabd1fc54bc9', '1570172619644-dfd03ed5d881', 3),
  ('04', null, 'Fashion',            'fashion',            'Everyday clothing, footwear and accessories, cut well and made to last.',
   '1515886657613-9f3515b0c78f', '1483985988355-763728e1935b', 4),
  ('05', null, 'Books',              'books',              'New fiction, sharp non-fiction and stories for young readers.',
   '1543002588-bfa74002ed7e', '1481627834876-b7833e8f5570', 5),
  ('06', null, 'Grocery & Gourmet',  'grocery-gourmet',    'Pantry staples, snacks, tea and coffee from growers we know.',
   '1596040033229-a9821ebd058d', '1542838132-92c53300491e', 6),
  ('11', '01', 'Smartphones',        'smartphones',        'Unlocked phones with honest specs.',                     '1511707171634-5f897ff02aa9', null, 1),
  ('12', '01', 'Audio',              'audio',              'Headphones, earbuds and speakers.',                      '1505740420928-5e560c06d30e', null, 2),
  ('13', '01', 'Computer Accessories','computer-accessories','Keyboards, mice and desk upgrades.',                   '1587829741301-dc798b83add3', null, 3),
  ('14', '01', 'Wearables',          'wearables',          'Smartwatches and fitness bands.',                        '1523275335684-37898b6baf30', null, 4),
  ('21', '02', 'Kitchen & Dining',   'kitchen-dining',     'Cookware and tableware for everyday cooking.',           '1590794056226-79ef3a8147e1', null, 1),
  ('22', '02', 'Home Decor',         'home-decor',         'Candles, planters and finishing touches.',               '1602874801007-bd458bb1b8b6', null, 2),
  ('23', '02', 'Bedding & Bath',     'bedding-bath',       'Sheets, pillows and towels.',                            '1616627561950-9f746e330187', null, 3),
  ('31', '03', 'Skincare',           'skincare',           'Cleansers, serums and moisturisers.',                    '1620916566398-39f1143ab7be', null, 1),
  ('32', '03', 'Haircare',           'haircare',           'Oils, shampoos and treatments.',                         '1535585209827-a15fcdbc4c2d', null, 2),
  ('33', '03', 'Makeup',             'makeup',             'Everyday makeup essentials.',                            '1522335789203-aabd1fc54bc9', null, 3),
  ('41', '04', 'Men',                'men',                'Tees, shirts and layers.',                               '1521572163474-6864f9cf17ab', null, 1),
  ('42', '04', 'Women',              'women',              'Co-ords, loungewear and essentials.',                    '1515886657613-9f3515b0c78f', null, 2),
  ('43', '04', 'Footwear',           'footwear',           'Sneakers for every day.',                                '1608231387042-66d1773070a5', null, 3),
  ('44', '04', 'Bags & Accessories', 'bags-accessories',   'Backpacks, sunglasses and more.',                        '1553062407-98eeb64c6a62', null, 4),
  ('51', '05', 'Fiction',            'fiction',            'Novels and short stories.',                              '1543002588-bfa74002ed7e', null, 1),
  ('52', '05', 'Non-fiction',        'non-fiction',        'Money, work, health and ideas.',                         '1512820790803-83ca734da794', null, 2),
  ('53', '05', 'Children''s Books',  'childrens-books',    'Picture books and early readers.',                       '1532012197267-da84d127e765', null, 3),
  ('61', '06', 'Snacks & Sweets',    'snacks-sweets',      'Chocolate, nuts and better snacking.',                   '1511381939415-e44015466834', null, 1),
  ('62', '06', 'Tea & Coffee',       'tea-coffee',         'Estate teas and freshly roasted coffee.',                '1509042239860-f550ce710b93', null, 2),
  ('63', '06', 'Staples & Spices',   'staples-spices',     'Rice, oils and whole spices.',                           '1532336414038-cf19250c5757', null, 3)
) as c(no, parent, name, slug, descr, tile, banner, sort)
order by parent nulls first, no;

-- ---------- Collections ----------
insert into public.collections (id, name, slug, description, image_url, image_alt, banner_url, banner_alt,
                                sort_order, show_on_home, starts_at, ends_at, seo_title, seo_description) values
  ('20000000-0000-4000-8000-000000000001', 'New Arrivals', 'new-arrivals',
   'Just landed: the latest across tech, home, beauty and more.',
   'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80', 'Shopper carrying new purchases',
   'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&q=80', 'New gadgets laid out on a desk',
   1, true, null, null, 'New Arrivals | wavy', 'The newest products across every category at wavy.'),
  ('20000000-0000-4000-8000-000000000002', 'Best Sellers', 'best-sellers',
   'What everyone is buying right now.',
   'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&q=80', 'Headphones, watch and phone flat lay',
   null, null, 2, true, null, null, 'Best Sellers | wavy', 'Our most-loved products, ranked by what customers buy.'),
  ('20000000-0000-4000-8000-000000000003', 'Festive Gifting', 'festive-gifting',
   'Thoughtful gifts for everyone on your list. Use FESTIVE500 for Rs 500 off.',
   'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=1200&q=80', 'Lit candle beside a plant',
   'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=1200&q=80', 'Dark chocolate pieces',
   3, true, now() - interval '30 days', now() + interval '60 days',
   'Festive Gifting | wavy', 'Gift ideas across tech, home, beauty and gourmet.'),
  ('20000000-0000-4000-8000-000000000004', 'Under Rs 999', 'under-999',
   'Great finds that cost less than Rs 999.',
   'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80', 'Fresh produce on shelves',
   null, null, 4, true, null, null, 'Under Rs 999 | wavy', 'Everyday essentials and small treats under Rs 999.'),
  ('20000000-0000-4000-8000-000000000005', 'Work From Home', 'work-from-home',
   'Kit out your desk: audio, input devices, coffee and calm.',
   'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80', 'Laptop on a tidy home desk',
   'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80', 'Team working on laptops',
   5, false, null, null, 'Work From Home Essentials | wavy', 'Desk upgrades, audio and coffee for working from home.');

-- ---------- Products + variants + media ----------
-- opt1/opt2: [{"v": value, "hex"?: swatch, "price"?: paise, "compare"?: paise, "w"?: grams}]
create temp table _seed_products (
  no int, code text, cat text, brand text, name text, slug text, short text, descr text,
  highlights text[], specs jsonb, tags text[], badges text[], opt_names text[], opt1 jsonb, opt2 jsonb,
  price int, compare int, weight int, dims int[], hsn text, warranty text, returnable boolean, rwin int,
  featured boolean, images text[], barcode text
);

insert into _seed_products values
-- ===== Electronics =====
  (1, 'NOVAX5', '11', 'Nova', 'Nova X5 5G Smartphone', 'nova-x5-5g-smartphone',
   '6.5-inch AMOLED, 50 MP camera and a two-day battery.',
   E'The **Nova X5** pairs a bright 120 Hz AMOLED display with a 50 MP main camera that holds up in low light.\n\nA 5,000 mAh battery with 33 W fast charging gets you through two days of normal use, and the phone ships with two years of OS updates.',
   '{"120 Hz 6.5-inch AMOLED display","50 MP OIS main camera","5,000 mAh battery with 33 W charging","5G dual SIM"}',
   '[{"group":"Display","label":"Size","value":"6.5 in AMOLED, 120 Hz"},{"group":"Display","label":"Resolution","value":"2400 x 1080"},{"group":"Performance","label":"Processor","value":"Octa-core 2.4 GHz"},{"group":"Performance","label":"RAM","value":"8 GB"},{"group":"Camera","label":"Rear","value":"50 MP + 8 MP ultra-wide"},{"group":"Camera","label":"Front","value":"16 MP"},{"group":"Battery","label":"Capacity","value":"5000 mAh, 33 W"},{"group":"General","label":"In the box","value":"Phone, charger, USB-C cable, case"}]',
   '{smartphone,5g,android,amoled}', '{New}', '{Storage,Color}',
   '[{"v":"128 GB","price":2499900,"compare":2799900},{"v":"256 GB","price":2799900,"compare":3099900}]',
   '[{"v":"Midnight Black","hex":"#1C1C1E"},{"v":"Glacier Blue","hex":"#A7C7E7"}]',
   2499900, null, 195, '{163,76,8}', '8517', '1 year manufacturer warranty', true, 7, true,
   '{1511707171634-5f897ff02aa9,1512499617640-c74ae3a79d37}', null),
  (2, 'TONICANC', '12', 'Tonic Audio', 'Pulse ANC Wireless Headphones', 'pulse-anc-wireless-headphones',
   'Hybrid noise cancelling, 40-hour battery, all-day comfort.',
   E'Pulse uses hybrid active noise cancelling to quiet flights, trains and open offices, with a transparency mode for when you need to hear the room.\n\nMemory-foam cushions and a light 250 g frame keep them comfortable for hours. Quick charge: 10 minutes gives 5 hours of play.',
   '{"Hybrid active noise cancelling","40 h battery (ANC on)","Multipoint Bluetooth 5.3","Fold-flat design with case"}',
   '[{"group":"Audio","label":"Driver","value":"40 mm dynamic"},{"group":"Audio","label":"Noise cancelling","value":"Hybrid ANC, transparency mode"},{"group":"Battery","label":"Playback","value":"40 h ANC on, 60 h off"},{"group":"Connectivity","label":"Bluetooth","value":"5.3, multipoint"},{"group":"Connectivity","label":"Codecs","value":"AAC, SBC"},{"group":"General","label":"Weight","value":"250 g"}]',
   '{headphones,wireless,anc,bluetooth}', '{Bestseller}', '{Color}',
   '[{"v":"Matte Black","hex":"#111111"},{"v":"Stone Grey","hex":"#8C8C8C"}]', null,
   799900, 1199900, 250, '{190,160,80}', '8518', '1 year manufacturer warranty', true, 7, true,
   '{1505740420928-5e560c06d30e,1546435770-a3e426bf472b,1583394838336-acd977736f90}', null),
  (3, 'TONICBUDS', '12', 'Tonic Audio', 'Tonic Buds Pro True Wireless Earbuds', 'tonic-buds-pro-earbuds',
   'Pocketable ANC earbuds with a 30-hour charging case.',
   E'Tonic Buds Pro bring active noise cancelling and clear call quality to a case that slips into a coin pocket.\n\nIPX5 sweat resistance makes them gym-ready, and the low-latency mode keeps audio in sync for games and video.',
   '{"Active noise cancelling","30 h total with case","IPX5 sweat resistant","Low-latency game mode"}',
   '[{"group":"Audio","label":"Driver","value":"11 mm dynamic"},{"group":"Battery","label":"Buds","value":"7 h"},{"group":"Battery","label":"With case","value":"30 h, USB-C"},{"group":"Durability","label":"Rating","value":"IPX5"},{"group":"Connectivity","label":"Bluetooth","value":"5.3"}]',
   '{earbuds,tws,wireless,anc}', '{Bestseller}', '{Color}',
   '[{"v":"Carbon","hex":"#2B2B2B"},{"v":"Pearl White","hex":"#F2F2F2"}]', null,
   349900, 499900, 55, '{60,50,28}', '8518', '1 year manufacturer warranty', true, 7, false,
   '{1590658268037-6bf12165a8df,1606220588913-b3aacb4d2f46}', null),
  (4, 'KEYLITE', '13', 'Deskmate', 'KeyLite Wireless Keyboard and Mouse Combo', 'keylite-wireless-keyboard-mouse-combo',
   'Slim, quiet keys and a silent-click mouse on one receiver.',
   E'A low-profile keyboard with quiet scissor keys and a full number pad, paired with a contoured silent-click mouse.\n\nBoth connect through one USB receiver or Bluetooth, and switch between three devices at the tap of a key.',
   '{"Quiet low-profile keys","Connect up to 3 devices","12-month keyboard battery life","Silent-click mouse"}',
   '[{"group":"Keyboard","label":"Layout","value":"Full size, 104 keys"},{"group":"Keyboard","label":"Battery","value":"2 x AAA, up to 12 months"},{"group":"Mouse","label":"DPI","value":"1000 / 1600 / 2400"},{"group":"Connectivity","label":"Wireless","value":"2.4 GHz receiver + Bluetooth"},{"group":"Compatibility","label":"OS","value":"Windows, macOS, ChromeOS, Android"}]',
   '{keyboard,mouse,wireless,work-from-home}', '{}', '{Color}',
   '[{"v":"Graphite","hex":"#3A3A3C"},{"v":"Silver","hex":"#C7C7CC"}]', null,
   279900, 349900, 780, '{440,140,25}', '8471', '1 year manufacturer warranty', true, 7, false,
   '{1587829741301-dc798b83add3,1527864550417-7fd91fc51a46}', null),
  (5, 'NOVAFIT2', '14', 'Nova', 'Nova Fit 2 Smartwatch', 'nova-fit-2-smartwatch',
   'AMOLED smartwatch with GPS, SpO2 and 10-day battery.',
   E'Nova Fit 2 tracks 100+ workouts with built-in GPS, monitors heart rate, SpO2 and sleep, and shows notifications on a crisp 1.43-inch AMOLED screen.\n\nA single charge lasts up to 10 days, and the watch is water resistant to 5 ATM.',
   '{"1.43-inch always-on AMOLED","Built-in GPS","Heart rate, SpO2, sleep tracking","Up to 10 days battery"}',
   '[{"group":"Display","label":"Screen","value":"1.43 in AMOLED, always-on"},{"group":"Health","label":"Sensors","value":"Heart rate, SpO2, accelerometer"},{"group":"Fitness","label":"Sport modes","value":"100+"},{"group":"Battery","label":"Life","value":"Up to 10 days"},{"group":"Durability","label":"Water resistance","value":"5 ATM"}]',
   '{smartwatch,fitness,gps,wearable}', '{New}', '{Color}',
   '[{"v":"Obsidian","hex":"#1C1C1E"},{"v":"Frost White","hex":"#F2F2F2"}]', null,
   499900, 699900, 45, '{46,46,11}', '8517', '1 year manufacturer warranty', true, 7, true,
   '{1523275335684-37898b6baf30,1498049794561-7780e7231661}', null),
-- ===== Home & Kitchen =====
  (6, 'HEARTHDO', '21', 'Hearth & Co', 'Enamelled Cast Iron Dutch Oven', 'enamelled-cast-iron-dutch-oven',
   'Even heat for curries, stews and no-knead bread.',
   E'Heavy cast iron with a chip-resistant enamel finish holds and spreads heat evenly, from slow-cooked dal to crusty bread.\n\nWorks on gas, induction and in the oven up to 250 C. The self-basting lid keeps moisture in.',
   '{"Gas, induction and oven safe","Chip-resistant enamel","Self-basting lid","Lifetime warranty on the casting"}',
   '[{"group":"Material","label":"Body","value":"Enamelled cast iron"},{"group":"Use","label":"Hob","value":"Gas, electric, induction"},{"group":"Use","label":"Oven safe","value":"Up to 250 C"},{"group":"Care","label":"Cleaning","value":"Hand wash recommended"}]',
   '{cookware,cast-iron,induction,gift}', '{}', '{Capacity}',
   '[{"v":"3.8 L","price":649900,"w":4800},{"v":"5.2 L","price":799900,"w":5900}]', null,
   649900, null, 4800, '{300,260,160}', '7323', 'Lifetime warranty on the casting', true, 10, false,
   '{1590794056226-79ef3a8147e1,1556911220-bff31c812dba}', null),
  (7, 'CLAYMUG4', '21', 'Clayworks', 'Stoneware Coffee Mugs, Set of 4', 'stoneware-coffee-mugs-set-of-4',
   'Hand-glazed 350 ml mugs that feel good to hold.',
   E'Thrown and glazed in small batches, each mug has a slightly different finish. A generous 350 ml fits a proper filter coffee or a milky chai.\n\nMicrowave and dishwasher safe.',
   '{"Set of 4, 350 ml each","Hand-glazed stoneware","Microwave and dishwasher safe"}',
   '[{"group":"Material","label":"Body","value":"Stoneware, lead-free glaze"},{"group":"Size","label":"Capacity","value":"350 ml each"},{"group":"Care","label":"Dishwasher","value":"Safe"},{"group":"Care","label":"Microwave","value":"Safe"}]',
   '{mugs,tableware,coffee,gift}', '{Bestseller}', '{Color}',
   '[{"v":"Chalk White","hex":"#F4F1EA"},{"v":"Slate","hex":"#5A6470"}]', null,
   129900, 159900, 1600, '{260,260,110}', '6912', null, true, null, false,
   '{1514228742587-6b1558fcca3d,1495474472287-4d71bcdd2085}', null),
  (8, 'LUMENCANDLE', '22', 'Lumen Home', 'Soy Wax Scented Candle', 'soy-wax-scented-candle',
   'Clean-burning soy wax, cotton wick, 40 hours of burn.',
   E'Poured by hand from natural soy wax with a cotton wick for a clean, even burn. Each 200 g candle burns for around 40 hours.\n\nThe amber glass jar makes a lovely planter or pen pot once the candle is done.',
   '{"Natural soy wax","Around 40 h burn time","Cotton wick, no soot","Reusable glass jar"}',
   '[{"group":"Product","label":"Wax","value":"100% soy"},{"group":"Product","label":"Net weight","value":"200 g"},{"group":"Product","label":"Burn time","value":"About 40 h"},{"group":"Safety","label":"Tip","value":"Trim wick to 5 mm before each burn"}]',
   '{candle,home-fragrance,gift,soy}', '{}', '{Fragrance}',
   '[{"v":"Sandalwood"},{"v":"Lavender"},{"v":"Vanilla Bean"}]', null,
   89900, 109900, 420, '{85,85,100}', '3406', null, false, null, true,
   '{1602874801007-bd458bb1b8b6,1565193566173-7a0ee3dbe261}', null),
  (9, 'CLAYPLANT', '22', 'Clayworks', 'Ceramic Planter with Wooden Stand', 'ceramic-planter-with-wooden-stand',
   'Matte ceramic pot with drainage and a teak stand.',
   E'A matte ceramic planter with a drainage hole and saucer, raised on a solid teak stand. Sized for snake plants, pothos and small palms.\n\nPlant not included.',
   '{"Drainage hole and saucer","Solid teak stand","Matte, fingerprint-resistant glaze"}',
   '[{"group":"Material","label":"Pot","value":"Ceramic"},{"group":"Material","label":"Stand","value":"Teak wood"},{"group":"Care","label":"Indoor / outdoor","value":"Indoor"}]',
   '{planter,decor,plants,work-from-home}', '{}', '{Size}',
   '[{"v":"Small","price":79900,"w":900},{"v":"Medium","price":129900,"w":1500},{"v":"Large","price":179900,"w":2400}]', null,
   79900, null, 900, '{200,200,300}', '6913', null, true, null, false,
   '{1485955900006-10f4d324d411,1586023492125-27b2c045efd7}', null),
  (10, 'DREAMSHEET', '23', 'Dreamweave', 'Percale Cotton Bedsheet Set', 'percale-cotton-bedsheet-set',
   'Crisp, breathable 300 TC percale that softens with every wash.',
   E'Woven from long-staple cotton in a cool, crisp percale weave: ideal for Indian summers. The set includes one flat sheet and two pillow covers.\n\nPre-washed for softness and colour-fast for the long run.',
   '{"300 thread count percale","100% long-staple cotton","1 bedsheet + 2 pillow covers","Pre-washed, colour-fast"}',
   '[{"group":"Fabric","label":"Weave","value":"Percale, 300 TC"},{"group":"Fabric","label":"Material","value":"100% cotton"},{"group":"Set","label":"Includes","value":"1 flat sheet, 2 pillow covers"},{"group":"Care","label":"Wash","value":"Machine wash warm"}]',
   '{bedding,cotton,bedsheet}', '{New}', '{Size,Color}',
   '[{"v":"Queen","price":249900},{"v":"King","price":299900}]',
   '[{"v":"Ivory","hex":"#F3EFE6"},{"v":"Sage","hex":"#9CAF88"}]',
   249900, 329900, 1200, '{320,260,60}', '6302', null, true, null, false,
   '{1522771739844-6a9f6d5f14af,1616627561950-9f746e330187,1584100936595-c0654b55a2e2}', null),
-- ===== Beauty =====
  (11, 'DEWVITC', '31', 'Dewdrop', 'Vitamin C Brightening Serum 30 ml', 'vitamin-c-brightening-serum',
   '10% vitamin C with ferulic acid for brighter, even skin.',
   E'A lightweight serum with 10% ethyl ascorbic acid, a stable form of vitamin C, plus ferulic acid and vitamin E to boost its effect.\n\nUse 3-4 drops every morning before sunscreen. Suitable for all skin types.',
   '{"10% stable vitamin C","Ferulic acid + vitamin E","Fragrance free","Dermatologically tested"}',
   '[{"group":"Product","label":"Volume","value":"30 ml"},{"group":"Product","label":"Skin type","value":"All skin types"},{"group":"Ingredients","label":"Key actives","value":"Ethyl ascorbic acid 10%, ferulic acid, tocopherol"},{"group":"Usage","label":"When","value":"Morning, before sunscreen"}]',
   '{serum,vitamin-c,skincare,fragrance-free}', '{Bestseller}', '{}', null, null,
   64900, 79900, 90, '{40,40,110}', '3304', null, false, null, true,
   '{1556228578-8c89e6adf883,1570172619644-dfd03ed5d881}', null),
  (12, 'DEWCLEANSE', '31', 'Dewdrop', 'Gentle Foaming Face Cleanser', 'gentle-foaming-face-cleanser',
   'Low-pH cleanser that removes sunscreen without the squeak.',
   E'A pH 5.5 gel cleanser with amino-acid surfactants that lifts sunscreen, sweat and city grime without stripping.\n\nContains panthenol and glycerin to leave skin soft, never tight.',
   '{"pH 5.5, sulphate free","Removes sunscreen","Panthenol + glycerin"}',
   '[{"group":"Product","label":"Skin type","value":"Normal to oily, sensitive"},{"group":"Ingredients","label":"Key actives","value":"Panthenol, glycerin, amino-acid surfactants"},{"group":"Product","label":"pH","value":"5.5"}]',
   '{cleanser,face-wash,skincare,sulphate-free}', '{}', '{Size}',
   '[{"v":"100 ml","price":39900,"w":130},{"v":"200 ml","price":64900,"w":240}]', null,
   39900, null, 130, '{50,40,150}', '3304', null, false, null, false,
   '{1620916566398-39f1143ab7be}', null),
  (13, 'ROOTSOIL', '32', 'Roots Ritual', 'Cold-Pressed Coconut Hair Oil', 'cold-pressed-coconut-hair-oil',
   'Single-ingredient, cold-pressed virgin coconut oil.',
   E'Pressed from fresh Kerala coconuts without heat or chemicals, so it keeps its natural aroma and nutrients.\n\nWarm a little between your palms and massage into scalp and lengths; leave for an hour or overnight.',
   '{"100% virgin coconut oil","Cold-pressed, unrefined","No mineral oil or fragrance"}',
   '[{"group":"Product","label":"Ingredients","value":"Cocos nucifera (coconut) oil"},{"group":"Product","label":"Process","value":"Cold-pressed"},{"group":"Product","label":"Origin","value":"Kerala"}]',
   '{hair-oil,coconut,haircare,natural}', '{}', '{Size}',
   '[{"v":"200 ml","price":34900,"w":230},{"v":"500 ml","price":69900,"w":540}]', null,
   34900, null, 230, '{55,55,160}', '1513', null, false, null, false,
   '{1526947425960-945c6e72858f}', null),
  (14, 'ROOTSSHAMP', '32', 'Roots Ritual', 'Argan Repair Shampoo 300 ml', 'argan-repair-shampoo',
   'Sulphate-free shampoo for dry, frizzy hair.',
   E'A mild, sulphate-free shampoo with argan oil and hydrolysed rice protein to smooth frizz and strengthen dry lengths.\n\nSafe for colour-treated hair.',
   '{"Sulphate and paraben free","Argan oil + rice protein","Colour safe"}',
   '[{"group":"Product","label":"Volume","value":"300 ml"},{"group":"Product","label":"Hair type","value":"Dry, frizzy, colour-treated"},{"group":"Ingredients","label":"Key actives","value":"Argan oil, hydrolysed rice protein"}]',
   '{shampoo,haircare,sulphate-free}', '{}', '{}', null, null,
   49900, 59900, 340, '{60,45,180}', '3305', null, false, null, false,
   '{1535585209827-a15fcdbc4c2d,1608248597279-f99d160bfcbc}', null),
  (15, 'HUEKIT', '33', 'Hue Studio', 'Everyday Makeup Kit', 'everyday-makeup-kit',
   'Skin tint, blush, brow and lip: the five-minute face.',
   E'Everything for a quick, polished look in one pouch: a buildable skin tint, cream blush, brow pencil, mascara and a tinted lip balm.\n\nPick the shade family closest to your skin; the tint is designed to adapt across a range.',
   '{"5 essentials in one pouch","Buildable skin tint","Travel-friendly sizes"}',
   '[{"group":"Kit","label":"Includes","value":"Skin tint, cream blush, brow pencil, mascara, lip balm"},{"group":"Product","label":"Finish","value":"Natural, satin"}]',
   '{makeup,kit,gift}', '{New}', '{Shade}',
   '[{"v":"Light"},{"v":"Medium"},{"v":"Deep"}]', null,
   189900, 249900, 300, '{180,120,60}', '3304', null, false, null, false,
   '{1522335789203-aabd1fc54bc9}', null),
-- ===== Fashion =====
  (16, 'WTEE', '41', 'wavy basics', 'Essential Crew Tee', 'essential-crew-tee',
   '180 GSM organic cotton crew that keeps its shape.',
   E'A midweight organic cotton crew with a clean neckline that holds its shape wash after wash.\n\nRegular fit: size down for a closer cut.',
   '{"180 GSM organic cotton","Regular fit","Pre-shrunk"}',
   '[{"group":"Fabric","label":"Material","value":"100% organic cotton"},{"group":"Fabric","label":"Weight","value":"180 GSM"},{"group":"Fit","label":"Fit","value":"Regular"},{"group":"Care","label":"Wash","value":"Machine wash cold, tumble dry low"}]',
   '{t-shirt,cotton,basics,men}', '{Bestseller}', '{Color,Size}',
   '[{"v":"Black","hex":"#111111"},{"v":"White","hex":"#F5F5F0"},{"v":"Olive","hex":"#5B6B3A"}]',
   '[{"v":"S"},{"v":"M"},{"v":"L"},{"v":"XL"}]',
   59900, null, 200, '{300,250,30}', '6109', null, true, 15, true,
   '{1521572163474-6864f9cf17ab,1576566588028-4147f3842f27}', null),
  (17, 'WDENIM', '41', 'wavy basics', 'Relaxed Denim Shirt', 'relaxed-denim-shirt',
   'Soft 6 oz denim with a relaxed body and two chest pockets.',
   E'Lightweight 6 oz cotton denim, garment-washed so it feels broken-in from day one.\n\nWear it buttoned or open over a tee.',
   '{"6 oz washed denim","Relaxed fit","Two flap chest pockets"}',
   '[{"group":"Fabric","label":"Material","value":"100% cotton denim, 6 oz"},{"group":"Fit","label":"Fit","value":"Relaxed"},{"group":"Care","label":"Wash","value":"Machine wash cold, inside out"}]',
   '{shirt,denim,men}', '{}', '{Color,Size}',
   '[{"v":"Indigo","hex":"#3B5B8C"},{"v":"Light Wash","hex":"#8FA9C9"}]',
   '[{"v":"S"},{"v":"M"},{"v":"L"},{"v":"XL"}]',
   199900, 249900, 350, '{320,260,40}', '6205', null, true, 15, false,
   '{1596755094514-f87e34085b2c,1602810318383-e386cc2a3ccf}', null),
  (18, 'WCOORD', '42', 'wavy basics', 'Lounge Co-ord Set', 'lounge-co-ord-set',
   'Brushed fleece sweatshirt and joggers, made to match.',
   E'A cropped sweatshirt and tapered joggers in brushed-back fleece. Soft enough for Sunday, neat enough for the school run.\n\nSold as a set.',
   '{"Brushed-back fleece","Sweatshirt + joggers set","Elastic waist with drawcord"}',
   '[{"group":"Fabric","label":"Material","value":"80% cotton, 20% polyester"},{"group":"Set","label":"Includes","value":"Sweatshirt, joggers"},{"group":"Care","label":"Wash","value":"Machine wash cold"}]',
   '{co-ord,loungewear,women}', '{New}', '{Color,Size}',
   '[{"v":"Sunflower","hex":"#E8B923"},{"v":"Heather Grey","hex":"#9A9A9A"}]',
   '[{"v":"XS"},{"v":"S"},{"v":"M"},{"v":"L"}]',
   229900, 289900, 650, '{350,280,80}', '6110', null, true, 15, false,
   '{1515886657613-9f3515b0c78f,1556821840-3a63f95609a7}', null),
  (19, 'STRIDEW', '43', 'Stride', 'Everyday White Sneakers', 'everyday-white-sneakers',
   'Clean low-tops on a cushioned rubber sole.',
   E'Minimal white low-tops in soft synthetic leather with a padded collar and a cushioned insole for all-day comfort.\n\nWipe clean with a damp cloth.',
   '{"Cushioned memory-foam insole","Non-marking rubber outsole","True to size"}',
   '[{"group":"Build","label":"Upper","value":"Synthetic leather"},{"group":"Build","label":"Sole","value":"Rubber, non-marking"},{"group":"Fit","label":"Sizing","value":"True to UK size"}]',
   '{sneakers,shoes,white,footwear}', '{Bestseller}', '{Size}',
   '[{"v":"UK 6"},{"v":"UK 7"},{"v":"UK 8"},{"v":"UK 9"},{"v":"UK 10"}]', null,
   299900, 399900, 800, '{330,210,120}', '6404', null, true, 15, true,
   '{1608231387042-66d1773070a5,1549298916-b41d501d3772}', null),
  (20, 'TRANSITBP', '44', 'Transit', 'Commuter Laptop Backpack 25 L', 'commuter-laptop-backpack',
   'Water-resistant 25 L pack with a padded 15.6-inch sleeve.',
   E'A clean-lined 25 L backpack in water-resistant recycled polyester with a padded, suspended sleeve for laptops up to 15.6 inches.\n\nLuggage strap, hidden passport pocket and a bottle pocket on each side.',
   '{"Fits 15.6-inch laptops","Water-resistant recycled fabric","Luggage pass-through strap"}',
   '[{"group":"Size","label":"Capacity","value":"25 L"},{"group":"Size","label":"Laptop","value":"Up to 15.6 in"},{"group":"Material","label":"Fabric","value":"Recycled polyester, water resistant"}]',
   '{backpack,laptop-bag,travel,work-from-home}', '{}', '{Color}',
   '[{"v":"Navy","hex":"#1F2A44"},{"v":"Charcoal","hex":"#36454F"}]', null,
   249900, 329900, 900, '{460,300,170}', '4202', '1 year warranty against manufacturing defects', true, 15, false,
   '{1553062407-98eeb64c6a62}', null),
  (21, 'SHADECLASSIC', '44', 'Shade & Co', 'Polarised Classic Sunglasses', 'polarised-classic-sunglasses',
   'UV400 polarised lenses in a timeless acetate frame.',
   E'A classic square frame in hand-polished acetate with polarised, UV400 lenses that cut glare on the road and at the beach.\n\nComes with a hard case and cleaning cloth.',
   '{"Polarised UV400 lenses","Acetate frame","Hard case included"}',
   '[{"group":"Lens","label":"Protection","value":"UV400, polarised"},{"group":"Frame","label":"Material","value":"Acetate"},{"group":"Box","label":"Includes","value":"Hard case, microfibre cloth"}]',
   '{sunglasses,accessories,gift}', '{}', '{}', null, null,
   149900, 199900, 60, '{160,60,50}', '9004', null, true, 15, false,
   '{1572635196237-14b3f281503f}', null),
-- ===== Books =====
  (22, 'BKMONSOON', '51', 'Juniper Press', 'The Monsoon Archive', 'the-monsoon-archive',
   'A family saga told through the letters left behind in a Kochi house.',
   E'When Anjali inherits her grandmother''s house in Fort Kochi, she finds seventy years of letters stacked in tin trunks. Reading them, she pieces together a family story of migration, loss and stubborn love.\n\nA warm, sweeping debut from Meera Iyer.',
   '{"Debut novel by Meera Iyer","Paperback, 384 pages","Book club favourite"}',
   '[{"group":"Book","label":"Author","value":"Meera Iyer"},{"group":"Book","label":"Publisher","value":"Juniper Press"},{"group":"Book","label":"Format","value":"Paperback"},{"group":"Book","label":"Pages","value":"384"},{"group":"Book","label":"Language","value":"English"},{"group":"Book","label":"ISBN","value":"9789390000011"}]',
   '{fiction,novel,family-saga}', '{New}', '{}', null, null,
   44900, 59900, 380, '{198,129,28}', '4901', null, true, 7, true,
   '{1543002588-bfa74002ed7e}', '9789390000011'),
  (23, 'BKSALT', '51', 'Juniper Press', 'Salt and Circuit', 'salt-and-circuit',
   'Speculative short stories set in a near-future Mumbai.',
   E'Twelve stories about delivery riders, sea walls and the machines that listen to us: funny, unsettling and very human.\n\nBy Kabir Rao.',
   '{"12 short stories","Paperback, 256 pages"}',
   '[{"group":"Book","label":"Author","value":"Kabir Rao"},{"group":"Book","label":"Publisher","value":"Juniper Press"},{"group":"Book","label":"Format","value":"Paperback"},{"group":"Book","label":"Pages","value":"256"},{"group":"Book","label":"ISBN","value":"9789390000028"}]',
   '{fiction,short-stories,speculative}', '{}', '{}', null, null,
   39900, null, 280, '{198,129,20}', '4901', null, true, 7, false,
   '{1532012197267-da84d127e765}', '9789390000028'),
  (24, 'BKHABITS', '52', 'Brightline Books', 'Small Habits, Big Money', 'small-habits-big-money',
   'A practical guide to budgeting, saving and investing in India.',
   E'No jargon, no get-rich-quick schemes: just a clear system for tracking spending, building an emergency fund and investing steadily through SIPs.\n\nBy Priya Nair, with worksheets you can photocopy.',
   '{"Plain-language personal finance","Worksheets included","Paperback, 240 pages"}',
   '[{"group":"Book","label":"Author","value":"Priya Nair"},{"group":"Book","label":"Publisher","value":"Brightline Books"},{"group":"Book","label":"Format","value":"Paperback"},{"group":"Book","label":"Pages","value":"240"},{"group":"Book","label":"ISBN","value":"9789390000035"}]',
   '{non-fiction,personal-finance,self-help}', '{Bestseller}', '{}', null, null,
   49900, 59900, 300, '{216,138,18}', '4901', null, true, 7, false,
   '{1512820790803-83ca734da794}', '9789390000035'),
  (25, 'BKNEEM', '53', 'Little Owl', 'Stories Under the Neem Tree', 'stories-under-the-neem-tree',
   'Ten illustrated bedtime stories for ages 4 to 8.',
   E'A grandmother, a neem tree and ten stories about kindness, courage and very naughty monkeys. Big, bright illustrations on every page.\n\nPerfect for reading aloud.',
   '{"Ages 4-8","Full-colour illustrations","Hardcover, 96 pages"}',
   '[{"group":"Book","label":"Author","value":"Leela Menon"},{"group":"Book","label":"Illustrator","value":"Arun Das"},{"group":"Book","label":"Format","value":"Hardcover"},{"group":"Book","label":"Pages","value":"96"},{"group":"Book","label":"Age","value":"4-8 years"},{"group":"Book","label":"ISBN","value":"9789390000042"}]',
   '{childrens,picture-book,bedtime,gift}', '{}', '{}', null, null,
   34900, null, 450, '{250,200,12}', '4903', null, true, 7, false,
   '{1543002588-bfa74002ed7e,1532012197267-da84d127e765}', '9789390000042'),
-- ===== Grocery & Gourmet =====
  (26, 'COCOA70', '61', 'Cocoa Trail', 'Dark Chocolate 70% Cacao', 'dark-chocolate-70-cacao',
   'Bean-to-bar dark chocolate from Idukki cacao.',
   E'Single-origin cacao from Idukki, fermented and roasted in small batches for notes of red berries and toasted nuts.\n\nJust cacao, cane sugar and cocoa butter.',
   '{"Single-origin Indian cacao","3 ingredients","Vegan"}',
   '[{"group":"Food","label":"Net weight","value":"100 g per bar"},{"group":"Food","label":"Ingredients","value":"Cacao beans, cane sugar, cocoa butter"},{"group":"Food","label":"Diet","value":"Vegan, gluten free"},{"group":"Food","label":"Shelf life","value":"12 months"},{"group":"Food","label":"FSSAI","value":"10020000000001"}]',
   '{chocolate,vegan,gift,snacks}', '{}', '{Pack}',
   '[{"v":"Single bar","price":19900,"w":110},{"v":"Pack of 3","price":54900,"compare":59700,"w":330}]', null,
   19900, null, 110, '{160,80,10}', '1806', null, false, null, false,
   '{1511381939415-e44015466834,1606312619070-d48b4c652a52}', null),
  (27, 'HPALMOND', '61', 'Harvest Pantry', 'California Almonds', 'california-almonds',
   'Large, crunchy, hand-sorted almonds.',
   E'Premium, hand-sorted California almonds, packed fresh in a resealable pouch. Snack on them raw, soak overnight or toast for salads.',
   '{"Hand-sorted, large kernels","Resealable pouch","Rich in protein and vitamin E"}',
   '[{"group":"Food","label":"Origin","value":"California, USA"},{"group":"Food","label":"Diet","value":"Vegan, gluten free"},{"group":"Food","label":"Shelf life","value":"9 months"},{"group":"Food","label":"Storage","value":"Cool, dry place"}]',
   '{almonds,dry-fruits,snacks,healthy}', '{Bestseller}', '{Weight}',
   '[{"v":"250 g","price":34900,"w":260},{"v":"500 g","price":64900,"w":515},{"v":"1 kg","price":119900,"compare":129800,"w":1030}]', null,
   34900, null, 260, '{200,140,50}', '0802', null, false, null, false,
   '{1508061253366-f7da158b6d46}', null),
  (28, 'HILLCOFFEE', '62', 'Hilltop Roasters', 'Single-Origin Arabica Coffee', 'single-origin-arabica-coffee',
   'Medium roast from Chikmagalur: chocolate, caramel, citrus.',
   E'Shade-grown arabica from a single Chikmagalur estate, roasted weekly to a medium profile with notes of milk chocolate, caramel and orange peel.\n\nChoose whole bean or have it ground for your brewer.',
   '{"Single estate, Chikmagalur","Roasted weekly","Whole bean or ground to order"}',
   '[{"group":"Coffee","label":"Roast","value":"Medium"},{"group":"Coffee","label":"Tasting notes","value":"Milk chocolate, caramel, orange peel"},{"group":"Coffee","label":"Altitude","value":"1,200 m"},{"group":"Food","label":"Shelf life","value":"6 months (best within 6 weeks of roast)"}]',
   '{coffee,arabica,work-from-home,gift}', '{New}', '{Weight,Grind}',
   '[{"v":"250 g","price":49900,"w":270},{"v":"500 g","price":89900,"w":530}]',
   '[{"v":"Whole Bean"},{"v":"Filter"},{"v":"Espresso"}]',
   49900, null, 270, '{190,120,60}', '0901', null, false, null, true,
   '{1509042239860-f550ce710b93,1495474472287-4d71bcdd2085}', null),
  (29, 'HILLCHAI', '62', 'Hilltop Roasters', 'Assam Masala Chai', 'assam-masala-chai',
   'Strong Assam CTC with cardamom, ginger and clove.',
   E'Bold Assam CTC blended with green cardamom, dried ginger, clove and a hint of black pepper. Brew it strong with milk and a little jaggery.',
   '{"Assam CTC base","Whole spices, no flavouring","Makes about 100 cups per 250 g"}',
   '[{"group":"Tea","label":"Type","value":"Black CTC with spices"},{"group":"Tea","label":"Ingredients","value":"Assam tea, cardamom, ginger, clove, black pepper"},{"group":"Food","label":"Shelf life","value":"12 months"}]',
   '{tea,chai,masala}', '{Bestseller}', '{Weight}',
   '[{"v":"100 g","price":19900,"w":115},{"v":"250 g","price":42900,"w":270}]', null,
   19900, null, 115, '{150,100,50}', '0902', null, false, null, false,
   '{1576092768241-dec231879fc3,1544787219-7f47ccb76574}', null),
  (30, 'HPBASMATI', '63', 'Harvest Pantry', 'Aged Basmati Rice', 'aged-basmati-rice',
   'Two-year aged extra-long grain basmati.',
   E'Aged for two years for long, separate grains and a delicate aroma: the rice for biryani and pulao.\n\nRinse twice and soak for 30 minutes before cooking.',
   '{"Aged 2 years","Extra-long grain","Ideal for biryani"}',
   '[{"group":"Food","label":"Grain","value":"Extra-long, 8.3 mm average"},{"group":"Food","label":"Ageing","value":"24 months"},{"group":"Food","label":"Origin","value":"Punjab"},{"group":"Food","label":"Shelf life","value":"18 months"}]',
   '{rice,basmati,staples}', '{}', '{Weight}',
   '[{"v":"1 kg","price":18900,"w":1020},{"v":"5 kg","price":84900,"compare":94500,"w":5080}]', null,
   18900, null, 1020, '{250,160,70}', '1006', null, false, null, false,
   '{1586201375761-83865001e31c}', null),
  (31, 'HPSPICEBOX', '63', 'Harvest Pantry', 'Whole Spice Box (Masala Dabba)', 'whole-spice-box',
   'Steel masala dabba filled with seven whole spices.',
   E'A classic stainless-steel masala dabba with seven small tins, filled with cumin, mustard seeds, cloves, green cardamom, cinnamon, black pepper and bay leaves.\n\nRefill packs available separately.',
   '{"Stainless-steel dabba with 7 tins","Filled with whole spices","Great housewarming gift"}',
   '[{"group":"Box","label":"Material","value":"Stainless steel"},{"group":"Box","label":"Tins","value":"7"},{"group":"Food","label":"Spices","value":"Cumin, mustard, clove, cardamom, cinnamon, pepper, bay leaf"}]',
   '{spices,masala,gift,staples}', '{}', '{}', null, null,
   59900, 74900, 650, '{200,200,80}', '0910', null, false, null, false,
   '{1596040033229-a9821ebd058d,1532336414038-cf19250c5757}', null),
  (32, 'HPOLIVE', '63', 'Harvest Pantry', 'Extra Virgin Olive Oil', 'extra-virgin-olive-oil',
   'Cold-extracted, first-press olive oil from Spain.',
   E'Cold-extracted from Spanish Arbequina olives: fruity, mildly peppery and great for dressings, dips and light sauteing.',
   '{"First cold press","Acidity below 0.5%","Dark glass bottle"}',
   '[{"group":"Food","label":"Olive","value":"Arbequina"},{"group":"Food","label":"Origin","value":"Spain"},{"group":"Food","label":"Acidity","value":"< 0.5%"},{"group":"Food","label":"Shelf life","value":"18 months"}]',
   '{olive-oil,cooking-oil,staples}', '{}', '{Size}',
   '[{"v":"500 ml","price":69900,"w":900},{"v":"1 L","price":129900,"w":1700}]', null,
   69900, null, 900, '{80,80,290}', '1509', null, false, null, false,
   '{1474979266404-7eaacbcd87c5}', null);

insert into public.products (id, category_id, name, slug, brand, short_description, description, highlights, specifications,
                             tags, badges, option_names, weight_grams, length_mm, width_mm, height_mm, hsn_code,
                             country_of_origin, warranty, returnable, return_window_days, return_policy, status,
                             published_at, is_featured, sort_order, seo_title, seo_description)
select format('30000000-0000-4000-8000-%s', lpad(no::text, 12, '0'))::uuid,
       format('10000000-0000-4000-8000-%s', lpad(cat, 12, '0'))::uuid,
       name, slug, brand, short, descr, highlights, specs, tags, badges, opt_names, weight, dims[1], dims[2], dims[3], hsn,
       case when no = 27 then 'USA' when no = 32 then 'Spain' else 'India' end,
       warranty, returnable, rwin,
       case when not returnable then 'Not returnable for hygiene or food-safety reasons. Damaged or wrong items are always replaced.' end,
       'published', now() - make_interval(days => 60 - no), featured, no,
       left(name || ' | wavy', 70), left(short, 170)
from _seed_products;

-- Variants = option1 x option2 (a product without options gets one 'Default' variant).
insert into public.product_variants (id, product_id, sku, barcode, option1, option2, color_hex, price, compare_at_price,
                                     cost_price, weight_grams, position)
select format('3100%s-0000-4000-8000-%s', lpad(p.no::text, 4, '0'), lpad(x.vv::text, 12, '0'))::uuid,
       format('30000000-0000-4000-8000-%s', lpad(p.no::text, 12, '0'))::uuid,
       upper(p.code || coalesce('-' || left(regexp_replace(x.o1 ->> 'v', '[^A-Za-z0-9]', '', 'g'), 10), '')
                    || coalesce('-' || left(regexp_replace(x.o2 ->> 'v', '[^A-Za-z0-9]', '', 'g'), 10), '')),
       case when p.opt1 is null then p.barcode end,
       x.o1 ->> 'v', x.o2 ->> 'v',
       coalesce(x.o1 ->> 'hex', x.o2 ->> 'hex'),
       x.price,
       case when x.compare > x.price then x.compare end,
       (x.price * 0.55)::int,
       (x.o1 ->> 'w')::int,
       x.vv
from _seed_products p
cross join lateral (
  select o1.e as o1, o2.e as o2,
         (o1.i - 1) * greatest(coalesce(jsonb_array_length(p.opt2), 0), 1) + o2.i as vv,
         coalesce((o1.e ->> 'price')::int, p.price) as price,
         coalesce((o1.e ->> 'compare')::int, p.compare) as compare
  from (select e, i from jsonb_array_elements(p.opt1) with ordinality t(e, i)
        union all select null, 1 where p.opt1 is null) o1
  cross join (select e, i from jsonb_array_elements(p.opt2) with ordinality t(e, i)
              union all select null, 1 where p.opt2 is null) o2
) x;

insert into public.product_media (id, product_id, url, alt, width, height, position, is_primary)
select format('3200%s-0000-4000-8000-%s', lpad(p.no::text, 4, '0'), lpad(m.i::text, 12, '0'))::uuid,
       format('30000000-0000-4000-8000-%s', lpad(p.no::text, 12, '0'))::uuid,
       'https://images.unsplash.com/photo-' || m.img || '?w=1200&q=80',
       p.name || case when m.i > 1 then ' - view ' || m.i else '' end, 1200, 1200, m.i - 1, m.i = 1
from _seed_products p
cross join lateral unnest(p.images) with ordinality as m(img, i);

-- Stock: deterministic 0..29 per variant (a few sell-outs for realism), written through the ledger.
select public.adjust_inventory(v.id, ((v.position * 7 + p.no * 3) % 30), 'initial', 'seed', 'import')
from public.product_variants v
join _seed_products p on format('30000000-0000-4000-8000-%s', lpad(p.no::text, 12, '0'))::uuid = v.product_id
where ((v.position * 7 + p.no * 3) % 30) > 0;

-- ---------- Collections membership ----------
insert into public.collection_products (collection_id, product_id, position)
select format('20000000-0000-4000-8000-%s', lpad(c::text, 12, '0'))::uuid,
       format('30000000-0000-4000-8000-%s', lpad(p::text, 12, '0'))::uuid, ord
from (values (1, array[1, 5, 10, 18, 22, 28, 15, 3]),
             (2, array[2, 3, 16, 19, 27, 29, 7, 11, 24]),
             (3, array[8, 7, 26, 31, 15, 5, 21, 6, 25]),
             (4, array[8, 9, 11, 12, 13, 14, 16, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]),
             (5, array[4, 2, 3, 7, 20, 28, 9])) as x(c, ps)
cross join lateral unnest(x.ps) with ordinality as u(p, ord);

-- ---------- Related products ----------
insert into public.related_products (product_id, related_product_id, relation_type, sort_order)
select format('30000000-0000-4000-8000-%s', lpad(a::text, 12, '0'))::uuid,
       format('30000000-0000-4000-8000-%s', lpad(b::text, 12, '0'))::uuid, t, 0
from (values (1, 3, 'accessory'), (1, 5, 'frequently_bought_together'), (2, 3, 'similar'), (3, 2, 'similar'),
             (4, 20, 'frequently_bought_together'), (6, 31, 'frequently_bought_together'), (7, 28, 'frequently_bought_together'),
             (11, 12, 'frequently_bought_together'), (13, 14, 'frequently_bought_together'), (16, 17, 'similar'),
             (16, 19, 'frequently_bought_together'), (22, 23, 'similar'), (28, 7, 'accessory'), (29, 26, 'related')) as r(a, b, t);

-- ---------- Filter attributes ----------
insert into public.attributes (id, code, name, sort_order) values
  ('40000000-0000-4000-8000-000000000001', 'material', 'Material', 1),
  ('40000000-0000-4000-8000-000000000002', 'diet',     'Diet',     2);
insert into public.attribute_values (id, attribute_id, value, slug, sort_order) values
  ('41000001-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Cotton',    'cotton',    1),
  ('41000001-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 'Ceramic',   'ceramic',   2),
  ('41000001-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001', 'Cast iron', 'cast-iron', 3),
  ('41000002-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 'Vegan',       'vegan',       1),
  ('41000002-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'Gluten free', 'gluten-free', 2);
insert into public.product_attribute_values (product_id, attribute_value_id)
select format('30000000-0000-4000-8000-%s', lpad(p::text, 12, '0'))::uuid, v::uuid
from (values
  (10, '41000001-0000-4000-8000-000000000001'), (16, '41000001-0000-4000-8000-000000000001'),
  (17, '41000001-0000-4000-8000-000000000001'), (7,  '41000001-0000-4000-8000-000000000002'),
  (9,  '41000001-0000-4000-8000-000000000002'), (6,  '41000001-0000-4000-8000-000000000003'),
  (26, '41000002-0000-4000-8000-000000000001'), (27, '41000002-0000-4000-8000-000000000001'),
  (26, '41000002-0000-4000-8000-000000000002'), (27, '41000002-0000-4000-8000-000000000002'),
  (30, '41000002-0000-4000-8000-000000000002')) as x(p, v);

-- ---------- Reviews (approved, imported) ----------
-- 2-4 per product from a per-department pool; the trigger rolls them up into products.rating_avg.
create temp table _seed_review_pool (dept int, slot int, rating int, title text, body text);
insert into _seed_review_pool values
  (1, 1, 5, 'Worth every rupee', 'Battery easily lasts the day and setup took two minutes. Feels far more premium than the price.'),
  (1, 2, 4, 'Solid, a few quirks', 'Great performance overall. The companion app could be better, but the hardware is excellent.'),
  (1, 3, 5, 'The upgrade I needed', 'Replaced a much pricier device with this and honestly I do not miss anything.'),
  (1, 4, 4, 'Good value', 'Does what it promises. Packaging was neat and delivery came a day early.'),
  (2, 1, 5, 'Looks lovely at home', 'Even nicer in person. Well packed and arrived without a scratch.'),
  (2, 2, 4, 'Good quality', 'Sturdy and well finished. The colour is a shade lighter than the photos.'),
  (2, 3, 5, 'Use it every day', 'It quickly became the thing I reach for first. Would buy again as a gift.'),
  (2, 4, 3, 'Decent', 'Nice product, but it took a little longer to arrive than expected.'),
  (3, 1, 5, 'Gentle and effective', 'No irritation on my sensitive skin and I noticed a difference within two weeks.'),
  (3, 2, 4, 'Nice texture', 'Absorbs quickly and the scent is subtle. The pump could be better.'),
  (3, 3, 5, 'Repurchasing', 'Third bottle already. Lasts a good two months with daily use.'),
  (3, 4, 4, 'Does the job', 'Good for the price. Would love a bigger size.'),
  (4, 1, 5, 'Great fit', 'True to size and the fabric feels substantial. Held up well after several washes.'),
  (4, 2, 4, 'Comfortable', 'Very comfortable for all-day wear. Colour is exactly as shown.'),
  (4, 3, 5, 'Bought two more', 'Became my go-to. Stitching and finish are excellent.'),
  (4, 4, 4, 'Good buy', 'Nice quality, and the size exchange was quick and easy.'),
  (5, 1, 5, 'Could not put it down', 'Finished it in two evenings. Beautifully written.'),
  (5, 2, 4, 'Thoughtful read', 'A few slow chapters, but the ideas stayed with me for days.'),
  (5, 3, 5, 'Perfect gift', 'Gifted it to my sister and she loved it. Print quality is great.'),
  (5, 4, 4, 'Recommended', 'Well edited and easy to read. Good paper and binding.'),
  (6, 1, 5, 'Fresh and flavourful', 'Tastes noticeably fresher than supermarket packs. The resealable pack is handy.'),
  (6, 2, 4, 'Consistent quality', 'Same great quality every time I order. Delivery was quick.'),
  (6, 3, 5, 'A pantry staple now', 'It is on our monthly list now. The whole family loves it.'),
  (6, 4, 4, 'Nice', 'Good taste. A little pricey, but worth it for the quality.');

insert into public.reviews (id, product_id, rating, title, body, author_name, author_location, source, status,
                            verified_purchase, created_at)
select format('3300%s-0000-4000-8000-%s', lpad(p.no::text, 4, '0'), lpad(k::text, 12, '0'))::uuid,
       format('30000000-0000-4000-8000-%s', lpad(p.no::text, 12, '0'))::uuid,
       rp.rating, rp.title, rp.body,
       (array['Aarav M.','Isha K.','Rohan S.','Priya N.','Kabir D.','Ananya R.','Vikram P.','Sneha J.',
              'Arjun T.','Meera V.','Farhan A.','Nisha G.'])[1 + (p.no * 5 + k) % 12],
       (array['Bengaluru','Mumbai','Delhi','Pune','Hyderabad','Chennai','Kolkata','Jaipur','Kochi','Ahmedabad',
              'Lucknow','Indore'])[1 + (p.no * 7 + k) % 12],
       'import', 'approved', k % 2 = 1, now() - make_interval(days => p.no * 3 + k * 5)
from _seed_products p
cross join lateral generate_series(1, 2 + p.no % 3) as k
join _seed_review_pool rp on rp.dept = (p.cat::int / 10) and rp.slot = 1 + (p.no + k) % 4;

drop table _seed_review_pool;
drop table _seed_products;

-- Marketing overrides (storefront shows these instead of the roll-up; audited).
update public.products set rating_override = 4.7, review_count_override = 1284
 where id = '30000000-0000-4000-8000-000000000002';
update public.products set rating_override = 4.6, review_count_override = 860
 where id = '30000000-0000-4000-8000-000000000016';

-- ---------- Offers + coupons ----------
insert into public.offers (id, name, slug, description, type, status, priority, required_qty, bundle_price,
                           badge_text, nudge_template) values
  ('50000000-0000-4000-8000-000000000001', 'Any 3 books for Rs 999', 'books-3-for-999',
   'Mix and match any three books for Rs 999.', 'bundle_fixed_price', 'active', 10, 3, 99900,
   '3 for Rs 999', 'Add {n} more book(s) to get 3 for Rs 999');
insert into public.discount_targets (offer_id, mode, category_id) values
  ('50000000-0000-4000-8000-000000000001', 'include', '10000000-0000-4000-8000-000000000005');

insert into public.coupons (id, code, description, type, value, min_order_amount, max_discount_amount,
                            usage_limit_total, usage_limit_per_user, first_order_only, combinable_with_offers,
                            starts_at, ends_at, status) values
  ('51000000-0000-4000-8000-000000000001', 'WELCOME10', '10% off your first order (up to Rs 500)',
   'percent', 10, 99900, 50000, null, 1, true, true, null, null, 'active'),
  ('51000000-0000-4000-8000-000000000002', 'FREESHIP', 'Free shipping on orders over Rs 499',
   'free_shipping', 0, 49900, null, null, null, false, true, null, null, 'active'),
  ('51000000-0000-4000-8000-000000000003', 'AUDIO15', '15% off Tonic Audio headphones and earbuds (up to Rs 1,500)',
   'percent', 15, 0, 150000, 500, 1, false, true, null, now() + interval '90 days', 'active'),
  ('51000000-0000-4000-8000-000000000004', 'BEAUTY20', '20% off beauty (makeup kits excluded, up to Rs 500)',
   'percent', 20, 49900, 50000, null, 2, false, false, null, null, 'active'),
  ('51000000-0000-4000-8000-000000000005', 'FESTIVE500', 'Rs 500 off Festive Gifting orders over Rs 2,999',
   'fixed', 50000, 299900, null, 1000, 1, false, true, now() - interval '30 days', now() + interval '60 days', 'active'),
  ('51000000-0000-4000-8000-000000000006', 'STORAGE2K', 'Rs 2,000 off the 256 GB Nova X5',
   'fixed', 200000, 0, null, 200, 1, false, true, null, now() + interval '30 days', 'active');
insert into public.discount_targets (coupon_id, mode, product_id, variant_id, category_id, collection_id) values
  -- product-targeted
  ('51000000-0000-4000-8000-000000000003', 'include', '30000000-0000-4000-8000-000000000002', null, null, null),
  ('51000000-0000-4000-8000-000000000003', 'include', '30000000-0000-4000-8000-000000000003', null, null, null),
  -- category-targeted (descendants included) with a product exclusion
  ('51000000-0000-4000-8000-000000000004', 'include', null, null, '10000000-0000-4000-8000-000000000003', null),
  ('51000000-0000-4000-8000-000000000004', 'exclude', '30000000-0000-4000-8000-000000000015', null, null, null),
  -- collection-targeted
  ('51000000-0000-4000-8000-000000000005', 'include', null, null, null, '20000000-0000-4000-8000-000000000003'),
  -- variant-targeted: both 256 GB colourways
  ('51000000-0000-4000-8000-000000000006', 'include', null, '31000001-0000-4000-8000-000000000003', null, null),
  ('51000000-0000-4000-8000-000000000006', 'include', null, '31000001-0000-4000-8000-000000000004', null, null);

-- ---------- Campaign ----------
insert into public.campaigns (id, name, slug, status, channel, description, hero_image_url, hero_image_alt,
                              utm_campaign, coupon_id, starts_at, ends_at) values
  ('90000000-0000-4000-8000-000000000001', 'Festive Gifting 2026', 'festive-gifting-2026', 'live', 'site',
   'Gift ideas for everyone, plus Rs 500 off with FESTIVE500.',
   'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=1200&q=80', 'Candle glowing beside a plant',
   'festive_2026', '51000000-0000-4000-8000-000000000005', now() - interval '30 days', now() + interval '60 days');
insert into public.campaign_collections (campaign_id, collection_id) values
  ('90000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003');

-- ---------- Home page ----------
insert into public.home_sections (id, type, title, subtitle, config, sort_order) values
  ('74000000-0000-4000-8000-000000000001', 'hero_carousel', null, null, '{
     "autoplayMs": 6000,
     "slides": [
       {"image": "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&q=80", "imageAlt": "Phone, laptop and headphones on a desk",
        "eyebrow": "New in electronics", "heading": "Tech that keeps up with you", "body": "The Nova X5 and Nova Fit 2 are here.",
        "cta": {"label": "Shop electronics", "href": "/collections/electronics"}, "theme": "dark"},
       {"image": "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=1200&q=80", "imageAlt": "Candle glowing beside a plant",
        "eyebrow": "Festive Gifting", "heading": "Gifts they will actually use", "body": "Rs 500 off orders over Rs 2,999 with FESTIVE500.",
        "cta": {"label": "Shop gifts", "href": "/collections/festive-gifting"}, "theme": "dark"},
       {"image": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80", "imageAlt": "Fresh produce on market shelves",
        "eyebrow": "Pantry", "heading": "Better staples, delivered", "body": "Estate coffee, aged basmati and whole spices.",
        "cta": {"label": "Shop grocery", "href": "/collections/grocery-gourmet"}, "theme": "light"}
     ]}', 1),
  ('74000000-0000-4000-8000-000000000002', 'category_grid', 'Shop by category', null,
   '{"categoryIds": ["10000000-0000-4000-8000-000000000001", "10000000-0000-4000-8000-000000000002",
                     "10000000-0000-4000-8000-000000000003", "10000000-0000-4000-8000-000000000004",
                     "10000000-0000-4000-8000-000000000005", "10000000-0000-4000-8000-000000000006"], "limit": 6}', 2),
  ('74000000-0000-4000-8000-000000000003', 'product_carousel', 'New arrivals', 'Fresh picks across every department',
   '{"source": "collection", "collectionId": "20000000-0000-4000-8000-000000000001", "limit": 12,
     "cta": {"label": "View all", "href": "/collections/new-arrivals"}}', 3),
  ('74000000-0000-4000-8000-000000000004', 'floating_showcase', 'Sound, without the noise', 'Tonic Audio: hybrid ANC, all-day comfort',
   '{"productIds": ["30000000-0000-4000-8000-000000000002", "30000000-0000-4000-8000-000000000003", "30000000-0000-4000-8000-000000000005"],
     "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80", "imageAlt": "Black headphones on yellow",
     "cta": {"label": "Shop audio", "href": "/collections/audio"}}', 4),
  ('74000000-0000-4000-8000-000000000005', 'product_carousel', 'Best sellers', 'What everyone is buying',
   '{"source": "collection", "collectionId": "20000000-0000-4000-8000-000000000002", "limit": 12,
     "cta": {"label": "View all", "href": "/collections/best-sellers"}}', 5),
  ('74000000-0000-4000-8000-000000000006', 'promo_banner', 'Festive Gifting', 'Rs 500 off orders over Rs 2,999',
   '{"image": "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=1200&q=80", "imageAlt": "Dark chocolate pieces",
     "heading": "Gifts they will actually use", "body": "Candles, chocolate, tech and more. Use code FESTIVE500 at checkout.",
     "couponCode": "FESTIVE500", "cta": {"label": "Shop Festive Gifting", "href": "/collections/festive-gifting"}, "theme": "dark"}', 6),
  ('74000000-0000-4000-8000-000000000007', 'collection_rail', 'Shop the edits', null,
   '{"collectionIds": ["20000000-0000-4000-8000-000000000003", "20000000-0000-4000-8000-000000000004",
                       "20000000-0000-4000-8000-000000000005", "20000000-0000-4000-8000-000000000002"], "limit": 4}', 7),
  ('74000000-0000-4000-8000-000000000008', 'product_carousel', 'Under Rs 999', 'Small prices, big smiles',
   '{"source": "collection", "collectionId": "20000000-0000-4000-8000-000000000004", "limit": 12,
     "cta": {"label": "View all", "href": "/collections/under-999"}}', 8),
  ('74000000-0000-4000-8000-000000000009', 'testimonials', 'Loved by our customers', null, '{"limit": 6}', 9),
  ('74000000-0000-4000-8000-000000000010', 'blog_rail', 'From the journal', 'Guides and ideas from the wavy team',
   '{"limit": 3}', 10),
  ('74000000-0000-4000-8000-000000000011', 'newsletter', 'Get Rs 100 off your first order', null,
   '{"heading": "Join the wavy list", "body": "New arrivals, offers and the occasional good read. No spam.",
     "placeholder": "Your email", "buttonLabel": "Subscribe",
     "consentText": "By subscribing you agree to receive marketing emails. Unsubscribe anytime."}', 11);

-- ---------- Content ----------
insert into public.faqs (id, category, question, answer, sort_order) values
  ('70000000-0000-4000-8000-000000000001', 'shipping', 'How long does delivery take?',
   'Metro cities get standard delivery in 2-4 working days (next day with Express); the rest of India in 4-7 working days.', 1),
  ('70000000-0000-4000-8000-000000000002', 'shipping', 'Is shipping free?',
   'Standard shipping is free on orders above Rs 999. Below that it is Rs 49 in metro cities and Rs 79 elsewhere.', 2),
  ('70000000-0000-4000-8000-000000000003', 'payments', 'Which payment methods do you accept?',
   'UPI, cards, netbanking and wallets via Razorpay, plus Cash on Delivery (Rs 49 fee) on eligible orders.', 3),
  ('70000000-0000-4000-8000-000000000004', 'payments', 'My payment failed but money was deducted. What now?',
   'If the order did not confirm, the amount is refunded to your source account within 5-7 working days. You are never charged twice for one order.', 4),
  ('70000000-0000-4000-8000-000000000005', 'returns', 'What is your return policy?',
   'Most items can be returned within 7 days of delivery (15 days for fashion, 10 for cookware). Beauty, grocery and candles are not returnable; damaged or wrong items are always replaced.', 5),
  ('70000000-0000-4000-8000-000000000006', 'products', 'Do electronics come with a warranty?',
   'Yes. Every electronics product carries the manufacturer warranty shown on its page; keep the invoice from your order page for claims.', 6),
  ('70000000-0000-4000-8000-000000000007', 'orders', 'Can I change or cancel my order?',
   'You can cancel from your account until the order is packed. After that, you can refuse delivery or request a return.', 7);

insert into public.testimonials (id, author_name, author_role, quote, rating, product_id, is_published, sort_order) values
  ('71000000-0000-4000-8000-000000000001', 'Aarav M.', 'Bengaluru',
   'The Pulse headphones are the best thing I bought this year. Delivery took two days.', 5,
   '30000000-0000-4000-8000-000000000002', true, 1),
  ('71000000-0000-4000-8000-000000000002', 'Isha K.', 'Mumbai',
   'Coffee, almonds and a candle in one order, all packed beautifully. My monthly ritual now.', 5, null, true, 2),
  ('71000000-0000-4000-8000-000000000003', 'Rohan S.', 'Delhi',
   'Returned a size and the exchange arrived before the pickup did. Great service.', 4, null, true, 3),
  ('71000000-0000-4000-8000-000000000004', 'Priya N.', 'Pune',
   'The Dutch oven is a beast. Best biryani I have made at home.', 5, '30000000-0000-4000-8000-000000000006', true, 4);

insert into public.content_pages (id, slug, page_type, title, status, blocks, seo_title, seo_description) values
  ('72000000-0000-4000-8000-000000000001', 'about', 'about', 'About wavy', 'published',
   '[{"type":"hero","heading":"Good things, fewer decisions.","body":"wavy is a small, carefully chosen store for tech, home, beauty, fashion, books and pantry."},
     {"type":"text","body":"We test what we sell, publish honest specs and work directly with makers across India."}]',
   'About wavy', 'A carefully chosen store for tech, home, beauty, fashion, books and pantry.'),
  ('72000000-0000-4000-8000-000000000002', 'faq', 'faq', 'Help & FAQ', 'published',
   '[{"type":"faq_list","source":"faqs"}]', 'Help & FAQ | wavy', 'Shipping, payments, returns and warranty answers.');

-- ---------- Blog ----------
insert into public.blog_categories (id, name, slug) values
  ('80000000-0000-4000-8000-000000000001', 'Buying Guides', 'buying-guides'),
  ('80000000-0000-4000-8000-000000000002', 'Home & Living', 'home-living');
insert into public.blog_tags (id, name, slug) values
  ('81000000-0000-4000-8000-000000000001', 'Audio', 'audio'),
  ('81000000-0000-4000-8000-000000000002', 'Kitchen', 'kitchen'),
  ('81000000-0000-4000-8000-000000000003', 'Skincare', 'skincare'),
  ('81000000-0000-4000-8000-000000000004', 'Pantry', 'pantry');
insert into public.blog_posts (id, slug, title, excerpt, cover_url, cover_alt, body, status, published_at,
                               author_name, category_id, reading_minutes, seo_title, seo_description) values
  ('82000000-0000-4000-8000-000000000001', 'how-to-choose-wireless-earbuds', 'How to choose wireless earbuds',
   'ANC, codecs, fit and battery: what actually matters when you pick a pair.',
   'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1200&q=80', 'Wireless earbuds with charging case',
   E'## Fit first\n\nThe best earbuds are the ones that stay in. Try all the tip sizes in the box.\n\n## Noise cancelling\n\nANC matters most on commutes and flights; for the gym, prioritise sweat resistance (IPX4 or better).\n\n## Battery\n\nLook at buds-only playtime, not just the case total.',
   'published', now() - interval '12 days', 'wavy Studio', '80000000-0000-4000-8000-000000000001', 5,
   'How to choose wireless earbuds | wavy', 'ANC, codecs, fit and battery: what matters when choosing earbuds.'),
  ('82000000-0000-4000-8000-000000000002', 'five-pantry-staples-worth-upgrading', 'Five pantry staples worth upgrading',
   'Small swaps that make everyday cooking noticeably better.',
   'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&q=80', 'Whole spices laid out on a table',
   E'## Whole spices\n\nToast and grind them as you need: the aroma difference is huge.\n\n## Aged basmati\n\nAged rice cooks up longer and fluffier.\n\n## Good olive oil\n\nKeep an extra virgin bottle for finishing, not frying.',
   'published', now() - interval '6 days', 'wavy Studio', '80000000-0000-4000-8000-000000000002', 4,
   'Five pantry staples worth upgrading | wavy', 'Small pantry swaps that make everyday cooking better.'),
  ('82000000-0000-4000-8000-000000000003', 'a-simple-morning-skincare-routine', 'A simple morning skincare routine',
   'Cleanse, treat, protect: a three-step routine that fits a busy morning.',
   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80', 'Person receiving a facial treatment',
   E'## Cleanse\n\nA low-pH cleanser removes sweat without stripping.\n\n## Treat\n\nA vitamin C serum brightens and supports your sunscreen.\n\n## Protect\n\nSunscreen, every day, even indoors near windows.',
   'published', now() - interval '2 days', 'wavy Studio', '80000000-0000-4000-8000-000000000001', 3,
   'A simple morning skincare routine | wavy', 'A three-step morning skincare routine for busy days.');
insert into public.blog_post_tags (post_id, tag_id) values
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001'),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000002'),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000004'),
  ('82000000-0000-4000-8000-000000000003', '81000000-0000-4000-8000-000000000003');

-- ---------- SEO ----------
insert into public.seo_overrides (path, title, description) values
  ('/', 'wavy | Tech, home, beauty, fashion, books and pantry', 'A carefully chosen store for everyday things. Free shipping over Rs 999.'),
  ('/collections/new-arrivals', 'New Arrivals | wavy', 'The newest products across every department at wavy.');
insert into public.redirects (from_path, to_path, status_code) values
  ('/shop', '/collections/new-arrivals', 301);
