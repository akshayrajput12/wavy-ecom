import type { Media, Product, ProductVariant } from "@/types/domain";

/**
 * Demo catalogue. Prices are paise (₹1 = 100). Variant ids: v_<nnn>_<color>_<size>.
 * `out` marks sold-out variants ("blk_m" = one size, "blk" = whole colour); `low` marks low stock.
 */
type Color = [name: string, hex: string, code: string];
type Def = Omit<Product, "id" | "images" | "variants" | "priceFrom" | "compareAtFrom" | "status"> & {
  n: number; price: number; compareAt?: number; images: [id: string, alt: string][];
  colors: Color[]; sizes: string[]; out?: string[]; low?: string[];
};

const APPAREL = ["XS", "S", "M", "L", "XL"];
const FOOTWEAR = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"];

const media = (id: string, alt: string): Media => ({ url: `https://images.unsplash.com/photo-${id}?w=1200&q=80`, alt });
const pad = (n: number) => String(n).padStart(3, "0");
const sizeCode = (s: string) => s.toLowerCase().replace(/\s+/g, "");

function build({ n, price, compareAt, images, colors, sizes, out = [], low = [], ...rest }: Def): Product {
  const id = `p_${pad(n)}`;
  const variants: ProductVariant[] = colors.flatMap(([color, colorHex, code], ci) =>
    sizes.map((size, si) => {
      const key = `${code}_${sizeCode(size)}`;
      const soldOut = out.includes(key) || out.includes(code);
      const stock = soldOut ? 0 : low.includes(key) ? 2 : 6 + ((n * 7 + ci * 5 + si * 3) % 19);
      return {
        id: `v_${pad(n)}_${key}`, productId: id, sku: `BB-${pad(n)}-${key}`.toUpperCase(),
        color, colorHex, size, price, compareAt, stock, status: soldOut ? "out_of_stock" : "active",
      };
    }),
  );
  return { ...rest, id, status: "published", images: images.map(([i, a]) => media(i, a)), variants, priceFrom: price, compareAtFrom: compareAt };
}

const CARE_COTTON = "Machine wash cold, inside out. Dry flat in shade. Warm iron on reverse.";
const CARE_SNEAKER = "Wipe with a damp cloth. Air dry away from direct sun. Use cedar shoe trees between wears.";

export const products: Product[] = [
  build({
    n: 1, name: "Essential Crew Tee", slug: "essential-crew-tee", descriptor: "180 GSM organic cotton",
    description: "The tee we'd keep if we could keep only one. Mid-weight organic cotton jersey, a clean crew neck that holds its shape, and a length that works tucked or loose.",
    categoryId: "cat_tees", collectionIds: ["c_essentials", "c_three_for_999"], material: "Organic cotton",
    fit: "Regular fit. True to size.", care: CARE_COTTON, badges: ["3 for ₹999"], rating: 4.7, reviewCount: 412, tryOnEnabled: true,
    price: 49900, images: [["1521572163474-6864f9cf17ab", "White crew-neck tee, front view"], ["1618354691373-d851c5c3a990", "Crew tee styled on a model"]],
    colors: [["White", "#f4f1ea", "wht"], ["Black", "#151515", "blk"], ["Clay", "#b86b4b", "cly"]], sizes: APPAREL, out: ["blk_xs"], low: ["wht_m"],
  }),
  build({
    n: 2, name: "Essential Pocket Tee", slug: "essential-pocket-tee", descriptor: "180 GSM organic cotton",
    description: "Our Essential Crew with a single chest pocket and a slightly dropped shoulder. The pocket is set a touch low, the way old workwear used to be.",
    categoryId: "cat_tees", collectionIds: ["c_essentials", "c_three_for_999"], material: "Organic cotton",
    fit: "Relaxed fit. Size down for a closer fit.", care: CARE_COTTON, badges: ["3 for ₹999"], rating: 4.6, reviewCount: 188, tryOnEnabled: true,
    price: 54900, images: [["1583743814966-8936f5b7be1a", "Grey pocket tee laid flat"], ["1503341504253-dff4815485f1", "Pocket tee worn by a model"]],
    colors: [["Heather Grey", "#b9b6b1", "gry"], ["Navy", "#1f2a44", "nvy"], ["Black", "#151515", "blk"]], sizes: APPAREL, out: ["nvy_xl"],
  }),
  build({
    n: 3, name: "Essential Rib Tank", slug: "essential-rib-tank", descriptor: "2×2 rib cotton-modal",
    description: "A fine rib tank for the hottest weeks of the year. Cotton-modal blend for a cool hand, with bound armholes that don't stretch out.",
    categoryId: "cat_tees", collectionIds: ["c_essentials", "c_three_for_999", "c_monsoon"], material: "Cotton-modal",
    fit: "Slim fit. True to size.", care: CARE_COTTON, badges: ["3 for ₹999"], rating: 4.5, reviewCount: 96, tryOnEnabled: false,
    price: 44900, images: [["1576566588028-4147f3842f27", "Ribbed white tank top"], ["1622445275463-afa2ab738c34", "Rib tank styled with trousers"]],
    colors: [["White", "#f4f1ea", "wht"], ["Black", "#151515", "blk"]], sizes: APPAREL,
  }),
  build({
    n: 4, name: "Heavyweight Boxy Tee", slug: "heavyweight-boxy-tee", descriptor: "280 GSM loopwheel cotton",
    description: "A dense, dry-handed jersey knitted on slow loopwheel machines. Boxy through the body, cropped a little shorter, with a thick 1×1 rib collar.",
    categoryId: "cat_tees", collectionIds: ["c_essentials", "c_latest_drop"], material: "Organic cotton",
    fit: "Boxy, oversized fit. Take your usual size.", care: CARE_COTTON, badges: ["Bestseller"], rating: 4.9, reviewCount: 128, tryOnEnabled: true,
    price: 179900, images: [["1581655353564-df123a1eb820", "Heavyweight tee on a hanger"], ["1552374196-1ab2a1c593e8", "Boxy tee worn under a jacket"]],
    colors: [["Bone", "#e7dfd2", "bne"], ["Washed Black", "#2b2a28", "wbk"], ["Olive", "#5e6146", "olv"]], sizes: APPAREL, out: ["olv_s", "olv_m"], low: ["bne_l"],
  }),
  build({
    n: 5, name: "Daybreak Hoodie", slug: "daybreak-hoodie", descriptor: "420 GSM raw loopback",
    description: "Our heaviest fleece: raw loopback cotton, unbrushed, so it breathes better than it has any right to. A self-supporting two-ply hood, hidden kangaroo pocket and heavy 2×2 rib cuffs.",
    categoryId: "cat_sweats", collectionIds: ["c_latest_drop"], material: "Organic cotton",
    fit: "Oversized, drop-shoulder fit. Size down for a regular fit.", care: CARE_COTTON, badges: ["New"], rating: 4.8, reviewCount: 94, tryOnEnabled: true,
    price: 499900, images: [["1556821840-3a63f95609a7", "Heather hoodie, front view"], ["1620799140408-edc6dcb6d633", "Hoodie detail on a model"]],
    colors: [["Heather Bone", "#d9d2c5", "hbn"], ["Deep Clay", "#8c4a36", "dcl"], ["Charcoal Ink", "#2e2f33", "chk"]], sizes: APPAREL, out: ["dcl_xs"], low: ["hbn_m", "chk_l"],
  }),
  build({
    n: 6, name: "Loopback Crew Sweat", slug: "loopback-crew-sweat", descriptor: "340 GSM French terry",
    description: "A classic crew sweat in dense French terry with a V-insert at the neck. Cut a little wider through the chest so it layers over a tee or a shirt.",
    categoryId: "cat_sweats", collectionIds: ["c_essentials"], material: "Organic cotton",
    fit: "Regular fit. True to size.", care: CARE_COTTON, badges: ["Sale"], rating: 4.6, reviewCount: 71, tryOnEnabled: true,
    price: 349900, compareAt: 399900, images: [["1564584217132-2271feaeb3c5", "Crew sweatshirt worn by a model"], ["1434389677669-e08b4cac3105", "Knit textures laid flat"]],
    colors: [["Oat", "#d8cbb5", "oat"], ["Forest", "#2f4a3a", "fst"]], sizes: APPAREL, out: ["fst_xl"],
  }),
  build({
    n: 7, name: "Field Overshirt", slug: "field-overshirt", descriptor: "Brushed cotton twill",
    description: "Somewhere between a shirt and a jacket. Brushed twill, two bellowed chest pockets and horn-effect buttons. Wear it open over a tee through the cooler months.",
    categoryId: "cat_outerwear", collectionIds: ["c_latest_drop", "c_monsoon"], material: "Cotton twill",
    fit: "Relaxed fit. True to size.", care: CARE_COTTON, badges: ["New"], rating: 4.8, reviewCount: 52, tryOnEnabled: true,
    price: 549900, images: [["1591047139829-d91aecb6caea", "Overshirt jacket on a hanger"], ["1617137968427-85924c800a22", "Model wearing an overshirt"]],
    colors: [["Khaki", "#a8956f", "khk"], ["Ink", "#1d2230", "ink"]], sizes: APPAREL, low: ["khk_m"],
  }),
  build({
    n: 8, name: "Linen Camp Shirt", slug: "linen-camp-shirt", descriptor: "Washed European linen",
    description: "A camp-collar shirt in garment-washed linen that softens with every wear. Straight hem, short sleeves, made for 34°C afternoons.",
    categoryId: "cat_shirts", collectionIds: ["c_monsoon"], material: "Linen",
    fit: "Relaxed fit. True to size.", care: "Machine wash cold. Line dry. Linen is meant to crease — iron damp if you must.", badges: [], rating: 4.7, reviewCount: 143, tryOnEnabled: true,
    price: 279900, images: [["1596755094514-f87e34085b2c", "Linen shirt on a model"], ["1602810318383-e386cc2a3ccf", "Linen shirt detail"]],
    colors: [["Sand", "#d9c8a9", "snd"], ["Sky", "#a9bcd0", "sky"], ["White", "#f4f1ea", "wht"]], sizes: APPAREL, out: ["sky"],
  }),
  build({
    n: 9, name: "Oxford Button-Down", slug: "oxford-button-down", descriptor: "Heavy Oxford cotton",
    description: "A properly heavy Oxford cloth with a rolled button-down collar and a box pleat at the back. Ages beautifully, frays gracefully.",
    categoryId: "cat_shirts", collectionIds: ["c_essentials"], material: "Cotton",
    fit: "Regular fit. True to size.", care: CARE_COTTON, badges: [], rating: 4.5, reviewCount: 88, tryOnEnabled: true,
    price: 249900, images: [["1602810318383-e386cc2a3ccf", "Oxford shirt folded"], ["1507679799987-c73779587ccf", "Model in a tailored look"]],
    colors: [["Blue", "#8fa7c7", "blu"], ["White", "#f4f1ea", "wht"]], sizes: APPAREL,
  }),
  build({
    n: 10, name: "Sculpted Knee Trouser", slug: "sculpted-knee-trouser", descriptor: "Stretch cotton twill",
    description: "Pleated at the waist, darted at the knee so they fall straight over a chunky sneaker. A soft stretch twill with a clean, pressed finish.",
    categoryId: "cat_trousers", collectionIds: ["c_latest_drop"], material: "Cotton twill",
    fit: "Relaxed, tapered fit. True to size.", care: CARE_COTTON, badges: ["New"], rating: 4.7, reviewCount: 39, tryOnEnabled: true,
    price: 389900, images: [["1624378439575-d8705ad7ae80", "Pleated trousers on a model"], ["1594633312681-425c7b97ccd1", "Tailored trousers styled"]],
    colors: [["Stone", "#bfb4a1", "stn"], ["Black", "#151515", "blk"]], sizes: APPAREL, out: ["stn_xs", "blk_xl"],
  }),
  build({
    n: 11, name: "Relaxed Selvedge Jean", slug: "relaxed-selvedge-jean", descriptor: "13.5 oz Japanese selvedge",
    description: "A relaxed straight leg in raw 13.5 oz selvedge denim from Okayama. Hard at first, then it becomes yours. Chain-stitched hem and a hidden selvedge coin pocket.",
    categoryId: "cat_trousers", collectionIds: ["c_essentials"], material: "Denim",
    fit: "Relaxed straight fit. Size up if between sizes.", care: "Wash rarely, cold and inside out. Line dry. Expect fading — that's the point.", badges: [], rating: 4.8, reviewCount: 64, tryOnEnabled: false,
    price: 429900, images: [["1542272604-787c3835535d", "Raw denim jeans"], ["1541099649105-f69ad21f3246", "Jeans styled on a model"]],
    colors: [["Raw Indigo", "#26314a", "ind"], ["Rinse Black", "#1b1b1f", "rbk"]], sizes: APPAREL, low: ["ind_m"],
  }),
  build({
    n: 12, name: "Ripstop Cargo", slug: "ripstop-cargo", descriptor: "Quick-dry nylon ripstop",
    description: "Articulated knees, a drawcord hem and two tonal cargo pockets. The ripstop sheds a monsoon shower and dries on the walk home.",
    categoryId: "cat_trousers", collectionIds: ["c_monsoon"], material: "Nylon",
    fit: "Relaxed fit. True to size.", care: "Machine wash cold. Hang dry. Do not iron.", badges: ["Sale"], rating: 4.4, reviewCount: 57, tryOnEnabled: true,
    price: 299900, compareAt: 379900, images: [["1604176354204-9268737828e4", "Cargo trousers detail"], ["1539185441755-769473a23570", "Model in cargo trousers"]],
    colors: [["Black", "#151515", "blk"], ["Moss", "#6a6f4c", "mos"]], sizes: APPAREL, out: ["mos_m", "mos_l"],
  }),
  build({
    n: 13, name: "Monsoon Shell Jacket", slug: "monsoon-shell-jacket", descriptor: "3-layer waterproof shell",
    description: "A seam-sealed three-layer shell with pit zips and a peaked hood that turns with your head. Packs into its own chest pocket.",
    categoryId: "cat_outerwear", collectionIds: ["c_monsoon", "c_latest_drop"], material: "Nylon",
    fit: "Regular fit with room to layer. True to size.", care: "Machine wash cold with technical detergent. Tumble dry low to reactivate the DWR.", badges: ["Limited"], rating: 4.9, reviewCount: 33, tryOnEnabled: true,
    price: 799900, images: [["1551028719-00167b16eac5", "Dark shell jacket"], ["1487222477894-8943e31ef7b2", "Model in outerwear outdoors"]],
    colors: [["Black", "#151515", "blk"], ["Signal Orange", "#e0612f", "sig"]], sizes: APPAREL, out: ["sig_s"], low: ["blk_m"],
  }),
  build({
    n: 14, name: "Merino Crew Knit", slug: "merino-crew-knit", descriptor: "Extra-fine 16 gauge merino",
    description: "A fine-gauge merino crew for air-conditioned offices and December evenings. Fully fashioned, so the seams sit exactly where they should.",
    categoryId: "cat_knit", collectionIds: ["c_essentials"], material: "Merino wool",
    fit: "Regular fit. True to size.", care: "Hand wash cold with wool wash. Dry flat.", badges: [], rating: 4.6, reviewCount: 41, tryOnEnabled: true,
    price: 449900, images: [["1578587018452-892bacefd3f2", "Fine knit sweater"], ["1620799139507-2a76f79a2f4d", "Knitwear detail"]],
    colors: [["Camel", "#b98e5e", "cml"], ["Navy", "#1f2a44", "nvy"]], sizes: APPAREL, out: ["cml", "nvy"],
  }),
  build({
    n: 15, name: "Studio Low", slug: "studio-low", descriptor: "Deconstructed suede, Vibram outsole",
    description: "Our signature low-top. Soft deconstructed suede, a leather-lined collar and a Vibram cupsole stitched all the way round.",
    categoryId: "cat_low", collectionIds: ["c_latest_drop"], material: "Suede",
    fit: "True to size. Half sizes: size up.", care: CARE_SNEAKER, badges: ["Limited"], rating: 5.0, reviewCount: 41, tryOnEnabled: false,
    price: 699900, images: [["1600185365483-26d7a4cc7519", "Suede low-top sneaker, side view"], ["1595950653106-6c9ebd614d3a", "Sneakers on a neutral background"]],
    colors: [["Sand Suede", "#c9b28f", "snd"], ["Chocolate", "#4a3325", "chc"]], sizes: FOOTWEAR, out: ["snd_uk6", "chc_uk11"], low: ["snd_uk9"],
  }),
  build({
    n: 16, name: "Court Classic", slug: "court-classic", descriptor: "Full-grain leather",
    description: "A clean court shoe in full-grain Chennai leather with a margom-style rubber sole. The one you'll wear with everything.",
    categoryId: "cat_low", collectionIds: ["c_essentials"], material: "Leather",
    fit: "True to size.", care: CARE_SNEAKER, badges: ["Bestseller"], rating: 4.8, reviewCount: 212, tryOnEnabled: false,
    price: 549900, images: [["1549298916-b41d501d3772", "White leather court sneakers"], ["1525966222134-fcfa99b8ae77", "Court sneakers worn"]],
    colors: [["White", "#f4f1ea", "wht"], ["White / Green", "#2f5d45", "wgr"]], sizes: FOOTWEAR, out: ["wgr_uk10"],
  }),
  build({
    n: 17, name: "Archive High", slug: "archive-high", descriptor: "Waxed canvas & leather",
    description: "A '70s basketball high-top rebuilt in waxed canvas with leather overlays and a padded ankle. Vulcanised, so it flexes from day one.",
    categoryId: "cat_high", collectionIds: ["c_latest_drop"], material: "Canvas",
    fit: "Runs slightly large. Size down if between sizes.", care: CARE_SNEAKER, badges: ["New"], rating: 4.6, reviewCount: 28, tryOnEnabled: false,
    price: 749900, images: [["1460353581641-37baddab0fa2", "High-top sneaker"], ["1491553895911-0055eca6402d", "Sneaker detail"]],
    colors: [["Ecru", "#e3d9c6", "ecr"], ["Black", "#151515", "blk"]], sizes: FOOTWEAR, low: ["ecr_uk8"],
  }),
  build({
    n: 18, name: "Tempo Runner", slug: "tempo-runner", descriptor: "Engineered mesh, supercritical foam",
    description: "A daily trainer that doesn't look like one. Breathable engineered mesh, a supercritical foam midsole and a heel counter that locks in.",
    categoryId: "cat_runner", collectionIds: ["c_monsoon"], material: "Mesh",
    fit: "True to size. Wide forefoot.", care: CARE_SNEAKER, badges: [], rating: 4.7, reviewCount: 119, tryOnEnabled: false,
    price: 899900, images: [["1542291026-7eec264c27ff", "Red running shoe"], ["1606107557195-0e29a4b5b4aa", "Running shoe side view"]],
    colors: [["Red Clay", "#b8422c", "rcl"], ["Grey Fog", "#bdbcb6", "fog"]], sizes: FOOTWEAR, out: ["rcl_uk7", "rcl_uk8"],
  }),
  build({
    n: 19, name: "Terrain Trail Runner", slug: "terrain-trail-runner", descriptor: "Ripstop upper, 5 mm lugs",
    description: "Built for Western Ghats weekends: a ripstop upper, gusseted tongue and 5 mm lugs that bite into wet laterite.",
    categoryId: "cat_runner", collectionIds: ["c_monsoon", "c_latest_drop"], material: "Mesh",
    fit: "True to size.", care: CARE_SNEAKER, badges: ["New"], rating: 4.8, reviewCount: 22, tryOnEnabled: false,
    price: 949900, images: [["1608231387042-66d1773070a5", "Trail running shoe"], ["1597045566677-8cf032ed6634", "Trail shoe detail"]],
    colors: [["Moss", "#6a6f4c", "mos"], ["Black", "#151515", "blk"]], sizes: FOOTWEAR, out: ["blk"],
  }),
  build({
    n: 20, name: "Canvas Low", slug: "canvas-low", descriptor: "12 oz cotton canvas",
    description: "A simple vulcanised canvas plimsoll. Light, washable and cheap enough to beat up all summer.",
    categoryId: "cat_low", collectionIds: ["c_essentials"], material: "Canvas",
    fit: "True to size.", care: "Hand wash with mild soap. Air dry.", badges: [], rating: 4.4, reviewCount: 305, tryOnEnabled: false,
    price: 299900, images: [["1512374382149-233c42b6a83b", "Canvas sneakers"], ["1525966222134-fcfa99b8ae77", "Canvas sneakers worn with cuffed trousers"]],
    colors: [["Natural", "#e8e0cf", "nat"], ["Navy", "#1f2a44", "nvy"]], sizes: FOOTWEAR,
  }),
];

export const getProductById = (id: string) => products.find((p) => p.id === id);
