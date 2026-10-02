# Video Stories: Research Note

Status: research only, nothing is implemented. Date: 2026-10-01.
Scope: Instagram-style story bubbles on the home page that open a full-screen 9:16 player with progress bars,
tap/swipe navigation, product tags ("Shop this look"), and admin-managed content.
Anything not confirmed on a primary source is marked **(verify)**.

---

## 0. Recommendation

**Use Mux Video (HLS, `basic` quality, public playback), played with a native `<video>` plus `hls.js` (light build)
that loads only when the viewer opens. Do not add a player library. Model stories as a `stories` table plus a new
`home_section_type` value `stories`, and manage them through the existing generic admin CRUD (`backend/admin/crud.ts`).**

Why Mux for a small Indian D2C store:

| Reason | Detail |
|---|---|
| Cost at our scale is about $0 | The first 100,000 delivered minutes each month are free, `basic` on-demand encoding is free, and storage is $0.0024–0.003 per stored minute per month. Twelve 15 s stories are 3 stored minutes, which costs cents. At 45k minutes a month (the growth scenario in §2.3) the bill is still $0. |
| Adaptive bitrate (HLS) | Indian mobile users on a weak 4G/3G cell get a low rendition and start quickly instead of downloading one 720p MP4. |
| Least code for us | Direct uploads (the browser PUTs to Mux, so no file passes through Next or Vercel's 4.5 MB body limit), a `passthrough` id that comes back in webhooks, and posters from `image.mux.com/{id}/thumbnail.webp?time=…&width=…` (no poster upload). |
| Delivery | "Mux Video streams are delivered using multiple CDNs. The best performing CDN is selected for the viewer." India PoP coverage is not published **(verify with a test from Jio/Airtel)**. |
| Named in the Next 16 docs | `node_modules/next/dist/docs/01-app/02-guides/videos.md` lists Mux (and `next-video`) as video platforms. |

**Switch to Bunny Stream if** monthly delivery goes well past 100k minutes. Bunny charges by GB with no per-minute
fee (Asia $0.03/GB on the standard network) and has PoPs in Mumbai, New Delhi, Bangalore, Chennai and Kolkata.
At about 300k minutes a month it costs about $108 against Mux's $160–200 (§2.3).
**No-vendor fallback:** Supabase Storage MP4. `content-media` already accepts `video/mp4` up to 10 MB. It works for a
validation pilot, but it has no adaptive bitrate, no automatic posters, and its egress shares the project quota.

---

## 1. UX patterns

### 1.1 What the reference products do
| Source | Pattern |
|---|---|
| Instagram (Help Center) | Tap right/left to skip forward/back, tap and hold to pause, swipe horizontally to the next account, swipe down to close. Users already know these gestures, so copy them. |
| Myntra Glamstream (Walmart corporate, Jul 2025) | Vertical video with "interactive product trays" so users go "from video to product detail to cart". It opens from a floating button on the app home. It launched with 500+ hours of content. |
| Nykaa "watch and buy" (2018) | Add to cart while the video plays, then check out after the video ends. **(verify: Business Standard returned 403. This comes from the search snippet only.)** |
| Whatmore (Shopify app, Bangalore) | Stories, carousels and floating widgets with product tagging. Used by Indian D2C brands (Oath, KAVA). Merchant reviews claim "15–20% sales lifts" (vendor testimonial, not a study). |
| Ajio, Meesho | No primary source found. **(verify)** |

### 1.2 What works on mobile (design decisions)
- **Rail**: a horizontal row of 64–72 px circular posters with a short label, placed directly under the hero (or as the
  first section). Use a gradient ring for "new" and a plain ring for "seen". Because colour alone must not carry status
  (CONVENTIONS §2), also add sr-only text "viewed".
- **One bubble opens one story** for the MVP. Story groups (several clips per bubble, Instagram-style) can come in v2.
- **Viewer**: full-screen 9:16 (`100dvh`). Show segmented progress bars at the top, then title and close. A product
  tray sits at the bottom: one to six product chips (image, name, price) that link to the PDP, plus an optional
  "Shop this look" CTA.
- **Gestures**: tapping the left third goes back, tapping the right two-thirds goes forward, press and hold (about
  200 ms) pauses, swipe down closes, and the viewer pauses when the tab is hidden. Each story lasts 5–30 s and the
  viewer auto-advances.
- **Sound**: start muted with a visible unmute button. The unmute choice persists across stories while the viewer is
  open.

### 1.3 Accessibility requirements (non-negotiable)
| Need | Requirement | How |
|---|---|---|
| Pause/stop | WCAG 2.2.2: auto-advancing content longer than 5 s needs a way to pause, stop or hide it | A visible Pause/Play button plus Space/K. Hold-to-pause alone is not enough. |
| No autoplay with sound | WCAG 1.4.2 Audio Control. Browsers block unmuted autoplay anyway (Chrome, WebKit). | Always `muted` and `playsinline`. Unmute only from a user gesture. |
| Gesture alternatives | WCAG 2.5.7 and 2.5.1: a swipe is not a valid alternative. A single-pointer equivalent is required. | Previous, Next and Close buttons. Tap zones are single-pointer and acceptable. |
| Keyboard and focus trap | APG modal dialog: Tab stays inside, Esc closes, focus goes back to the trigger, the dialog is labelled | Native `<dialog>.showModal()` gives inert background, initial focus, Esc and focus return (Baseline since Mar 2022). Reuse `components/ui/Drawer.tsx`, which already uses native `<dialog>`. Keys: ←/→ for previous/next and M for mute. |
| Captions | Next docs and MDN: `<track kind="subtitles">` | Required only for stories with speech. On-screen text in the video needs a text equivalent (title plus an optional description read by screen readers). |
| Reduced motion | `useReducedMotion` (Motion docs) | Swap slide/scale transitions for opacity, and keep the visible Pause control. |
| Announcements | | An `aria-live="polite"` line such as "Story 2 of 6: Monsoon edit". |
| Touch targets | CONVENTIONS §3: 44 px | Bubbles are 64+ px. Viewer buttons are at least 44 px. |

---

## 2. Video delivery options

### 2.1 Options compared
Prices were read from the vendors' pages on 2026-10-01, in USD, excluding GST.

| Provider | Price (delivery · storage · encode) | Upload / poster / security / webhooks | India | Effort |
|---|---|---|---|---|
| **(a) Supabase Storage + MP4** | Pro: 250 GB cached egress included, then $0.03/GB (uncached $0.09/GB). 100 GB storage, then $0.0213/GB. Free plan: 5 GB egress, 50 MB max file. No encoding. | `createSignedUploadUrl` (valid for 2 h) and TUS resumable uploads (6 MB chunks, URLs valid up to 24 h). Image transformations do **not** support video, so the poster must be uploaded separately. Public bucket means a better CDN hit rate. No webhooks needed. | The CDN location is undocumented (the `cf-cache-status` header suggests Cloudflare, **verify**). | **S**, but no adaptive bitrate. Range/206 support for seeking needs a curl check **(verify)**. |
| **(b1) Mux** | 100k delivered minutes a month free, then $0.0008/min (720p) or $0.001/min (1080p). Storage $0.0024–0.003/min/month. Basic encoding free. Pay-as-you-go has a $20 monthly credit. Buffered segments are billed even if not watched. | Direct upload URL with `cors_origin` and `passthrough`. Webhooks `video.upload.asset_created` and `video.asset.ready`. Posters, animated WebP and GIF via `image.mux.com`. Public or signed (JWT RS256) playback. | Multi-CDN, best performer chosen per viewer. India PoPs **(verify)**. | **M** |
| **(b2) Cloudflare Stream** | $1 per 1,000 minutes delivered. $5 per 1,000 minutes stored (prepaid). Ingress and encoding free. Billed in 4 s segments. | Direct creator uploads (basic POST up to 200 MB, otherwise tus) with `maxDurationSeconds`. Thumbnails `…/thumbnails/thumbnail.jpg?time=` (GIF previews not billed). Signed URLs, allowed origins. One webhook per account, HMAC `Webhook-Signature`. Do not cache or proxy manifests. | 348 cities, about 20 in India (Mumbai, New Delhi, Bangalore, Chennai, Hyderabad, Kolkata, Pune, …). | **M** |
| **(b3) Bunny Stream** | Encoding free. Storage from $0.01/GB. CDN Asia $0.03/GB (standard, 119 PoPs) or $0.005/GB (volume network, 10 PoPs, **verify India coverage**). $1 monthly minimum. | Create the video, then TUS upload to `video.bunnycdn.com/tusupload` signed with `SHA256(library_id+api_key+expires+video_id)`. HMAC-SHA256 signed webhooks (status 3 = finished, 5 = failed). Embed token auth. Direct-HLS token auth details **(verify)**. | PoPs in Mumbai, New Delhi, Bangalore, Chennai and Kolkata. | **M** |
| **(b4) api.video** | Delivery from $0.0017/min. Storage from $0.00285/min/month. Encoding free. The sandbox is watermarked, limited to 30 s, and auto-deleted after 24 h. | Not researched in depth **(verify)**. | **(verify)** | **M** |
| **(b5) Vercel Blob** | bom1: $0.067/GB Blob Data Transfer, $0.025/GB storage, and CDN requests. Hobby includes 10 GB transfer. | Client uploads avoid the 4.5 MB function body limit. Plain files only: no transcoding, no posters, no adaptive bitrate. | Served from Vercel's CDN (bom1 region exists). | **S**, but no adaptive bitrate. Commercial use on Hobby **(verify)**. |
| **(c) Self-transcode with ffmpeg in a queue** | Compute plus storage plus egress | `ffmpeg -f hls -hls_playlist_type vod -hls_segment_type fmp4 -var_stream_map … -master_pl_name`. Supabase Queues (pgmq) can hold jobs, but the worker must run outside Vercel: functions are capped at 300 s (Hobby) or 800 s (Pro), with a 250 MB bundle. | Depends on the CDN. | **L** (worker host, ladder tuning, poster extraction, failures, ops) |

### 2.2 Why not the others
- **(a) / (b5) plain MP4**: the simplest option, but a 720p file is the same bytes on 2G and on 5G. That is acceptable
  for a pilot only if the admin exports 720p H.264 with `+faststart` and keeps clips short (≤ 15 s is about 3 MB).
- **Cloudflare Stream**: good and close in quality, but it costs from the first minute (about $9/month at launch).
  Mux is $0 at our scale.
- **api.video**: the most expensive per minute delivered.
- **ffmpeg queue**: far more work than the problem needs. A small store should not run a transcoding fleet.

### 2.3 Cost scenarios (assumptions, not quotes)
Assumptions: 15 s stories, a 720p ladder, about 12 MB per delivered minute for byte-billed providers **(verify bitrate)**,
and minutes counted including buffered or prefetched video.

| Scenario | Delivered min/month | Mux | Cloudflare Stream | Bunny (std Asia) | api.video | Vercel Blob (bom1) | Supabase Pro egress |
|---|---|---|---|---|---|---|---|
| Launch: 20k home sessions, 20% open, about 1 min | 4,000 (≈ 48 GB) | $0 | ≈ $9 | ≈ $1.5 (min $1) | ≈ $7 | ≈ $3 | $0 if total egress < 250 GB |
| Growth: 100k sessions, 30% open, 1.5 min | 45,000 (≈ 540 GB) | $0 | ≈ $50 | ≈ $16 | ≈ $77 | ≈ $36 | ≈ $9 (but eats the shared quota) |
| Large | 300,000 (≈ 3.6 TB) | ≈ $160–200 | ≈ $305 | ≈ $108 (≈ $18 on volume network) | ≈ $510 | ≈ $241 | ≈ $100 |

Byte-billed providers get cheaper with adaptive bitrate because mobile users pull lower renditions. Mux and Cloudflare
bill per minute regardless of rendition.

---

## 3. Front-end implementation

### 3.1 Player core: native `<video>`, no player library
```tsx
<video ref={v} playsInline muted preload="metadata" poster={posterUrl}
       disableRemotePlayback className="size-full object-cover" aria-describedby={captionId}>
  {captionsUrl && <track kind="subtitles" src={captionsUrl} srcLang="en" label="English" default />}
</video>
```
- Use `playsInline` and `muted` for iOS inline autoplay (WebKit, Next docs). `preload` is only a hint and browsers may
  ignore it (MDN).
- `disableRemotePlayback` is required for hls.js to use Managed Media Source on iOS 17.1+ (WebKit 17.1). On iOS we play
  native HLS instead, so this only matters as a safety net.
- **Always handle the `play()` promise** (Chrome autoplay guide). iOS Low Power Mode rejects muted autoplay (Apple dev
  forum thread, unresolved as of Dec 2024), so on rejection show a large Play button. Never show a Pause icon unless
  playback is actually running.
- **HLS attach**: if `video.canPlayType('application/vnd.apple.mpegurl')` succeeds (Safari/iOS), set `src` to the
  `.m3u8` URL. Otherwise `const Hls = (await import('hls.js/light')).default` and check `Hls.isSupported()`. That is
  the pattern in the hls.js README and the Mux docs. The light build drops subtitles, alternate audio, EME and
  interstitials, none of which stories need. If WebVTT captions are needed, use `<track>` rather than HLS subtitles.
  Whether Chrome for Android plays HLS natively **(verify)**. Treat hls.js as the default there.
- Reuse **one** `<video>` element across stories (swap `src`) so an iOS user-gesture unmute keeps working
  **(verify on device)**.

### 3.2 Player libraries (bundlephobia, min+gzip, main entry)
| Library | Size | Verdict |
|---|---|---|
| `hls.js` 1.7.3 (full) | 177 KB | Load lazily, light build only. Light size **(verify)**. |
| `@mux/mux-player` 3.13.4 | 313 KB | Too heavy. Its chrome is not a stories UI. |
| `video.js` 8.24.1 | 204 KB | Too heavy, wrong UI. |
| `@vidstack/react` 1.15.6 (npm `next` tag; `latest` is still 0.6.15) | 74 KB (+ provider chunks) | Good library, but we would override all of its UI. |
| `plyr` 3.8.4 | 32 KB (no HLS, still needs hls.js) | No gain. |

Stories need custom chrome (progress bars, tap zones, product tray), so a player library adds bytes without removing
work. The home page already ships about 305 KB gzip of JS (PERFORMANCE.md §3). Nothing video-related may be added to
that initial bundle.

### 3.3 Loading strategy (keep LCP, CLS and INP healthy)
- **Rail is a Server Component** that renders `<button>` bubbles with tiny posters. The posters are Mux thumbnails
  resized by Mux (`?width=144`) and rendered with `next/image` `unoptimized`, or plain `<img loading="lazy">`, so
  Vercel does not re-optimise them. If `next/image` is used, add `image.mux.com` to `remotePatterns`. The rail has a
  fixed height, so CLS is 0. The hero stays the LCP element. (LCP counts a video's poster or first frame, so never
  autoplay video in the rail.)
- **Viewer chunk**: `next/dynamic(() => import('./StoryViewer'), { ssr: false })` from a small client leaf, prefetched
  on `pointerdown`, hover or focus of a bubble. This is the same pattern as `QuickViewHost` (PERFORMANCE.md §2). Note
  from the Next 16 docs (`lazy-loading.md`, cited in PERFORMANCE.md): code splitting via `dynamic` applies to client
  components, not Server Components.
- **No video bytes until a tap.** That makes IntersectionObserver unnecessary for the MVP. If a v2 rail plays muted
  previews, use IntersectionObserver plus `preload="none"` with a swap on intersection (web.dev lazy-loading video),
  or `loading="lazy"` on `<video>` (MDN lists it; check support).
- **Preload the next story**: MVP preloads only the next poster image. v2 adds a hidden second video with
  `preload="metadata"` once the current story passes 50%. Skip this when `navigator.connection.saveData` is true or
  `effectiveType` is `2g` or `slow-2g`. These APIs are not Baseline (no Safari), so treat them as hints. Prefetched
  segments count as billable Mux minutes.
- **INP ≤ 200 ms** (web.dev): progress bars are driven by a `requestAnimationFrame` loop that reads
  `video.currentTime / duration` and writes `style.transform = scaleX(..)` on a ref, with no React state per frame.
  Tap handlers only change the index.
- **Lenis**: call `lenis.stop()` while the dialog is open and `start()` on close. Also lock body scroll.

### 3.4 Motion and gestures (Framer Motion 13, already installed)
- Use `AnimatePresence` for open and close: scale from the bubble's rect, or a plain fade when `useReducedMotion()`.
- `drag="y"` on the stage with `dragConstraints={{ top: 0, bottom: 0 }}` and `dragElastic`. Close when `onDragEnd`
  reports `offset.y > 120` or `velocity.y > 800`. Buttons give the non-gesture path (WCAG 2.5.7).
- Tap zones use pointer events: `pointerdown` starts a 200 ms hold timer that pauses, and a `pointerup` before the
  timer fires navigates. Horizontal swipe to the next group is v2 (groups only).

---

## 4. Data model and admin sketch

### 4.1 Migration `supabase/migrations/0025_stories.sql`
```sql
-- 0025: video stories (home rail). Video lives at Mux; this row holds ids, tags and the schedule.
alter type public.home_section_type add value if not exists 'stories';
-- only if events go to the first-party table (§4.5); past tense matches the existing enum
alter type public.analytics_event_name add value if not exists 'story_viewed';
alter type public.analytics_event_name add value if not exists 'story_completed';
alter type public.analytics_event_name add value if not exists 'story_product_clicked';

create type public.story_status as enum ('waiting_upload', 'processing', 'ready', 'errored');

create table public.stories (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 60),
  status        public.story_status not null default 'waiting_upload',
  upload_id     text unique,                    -- Mux direct upload id
  asset_id      text unique,                    -- Mux asset id (webhook video.upload.asset_created)
  playback_id   text,                           -- Mux public playback id (webhook video.asset.ready)
  duration_ms   integer check (duration_ms between 1000 and 60000),
  poster_url    text,                           -- null = image.mux.com thumbnail
  poster_time_s numeric(5,2) not null default 1,
  captions_url  text,                           -- WebVTT in content-media, only when the clip has speech
  product_ids   uuid[] not null default '{}' check (cardinality(product_ids) <= 6),
  cta_label     text check (char_length(cta_label) <= 40),
  cta_href      text check (cta_href ~ '^/'),   -- internal links only
  sort_order    integer not null default 0,
  is_active     boolean not null default false,
  starts_at     timestamptz,
  ends_at       timestamptz,
  updated_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check ((cta_label is null) = (cta_href is null)),
  check (status <> 'ready' or playback_id is not null)
);
comment on table public.stories is 'Home video stories; public read = active, ready and inside its window.';
create index stories_live_idx on public.stories (sort_order) where is_active and status = 'ready';
create index stories_updated_by_idx on public.stories (updated_by);
create trigger stories_set_updated_at before update on public.stories
  for each row execute function public.set_updated_at();

alter table public.stories enable row level security;
create policy public_read on public.stories for select to anon, authenticated
  using (is_active and status = 'ready'
         and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy staff_write_content_write on public.stories for all to authenticated
  using ((select public.has_permission('content.write')))
  with check ((select public.has_permission('content.write')));
```
Notes:
- `product_ids uuid[]` follows the existing home convention ("ids inside config are plain uuids: a deleted product is
  skipped at render time", 0012). Product loads stay batched in one `in()` for the whole section.
- `upload_id` and `asset_id` are visible to anon through RLS. They are useless without the Mux token. Revoke column
  grants if that matters.
- The webhook update keyed on `id = passthrough` is naturally idempotent (it sets the same values), so no event-dedupe
  table is needed (unlike `payment_events`).
- No `provider` column yet. Add one if Bunny ever replaces Mux.

### 4.2 Domain types (`src/types/domain.ts`)
```ts
export interface StoryProduct { id: string; slug: string; name: string; price: number; image?: Media } // slim: not full Product
export interface Story { id: string; title: string; playbackId: string; posterUrl: string; durationMs: number;
  captionsUrl?: string; products: StoryProduct[]; cta?: Cta }
// HomeSection union:
| { type: "stories"; config: { storyIds?: string[]; limit?: number }; stories: Story[] }
```
Pass `StoryProduct`, not `Product`, to the client viewer. PERFORMANCE.md §4 flags full `Product` serialisation into
the RSC payload as a cost.

### 4.3 Files (repo conventions)
```
supabase/migrations/0025_stories.sql
src/backend/content/schema.ts            + StorySchema / StoryPatchSchema (zod), HomeSectionConfig 'stories'
src/backend/content/home.ts              + resolve 'stories' section: live stories + one in() for products (cached, TAGS.home)
src/backend/content/providers/mux.ts     createDirectUpload(storyId), verifyWebhook(raw, header), thumbnailUrl()
src/backend/admin/crud.ts                + RESOURCES.stories { table:'stories', read/write:'content.write', tags:['home'], order:'sort_order' }
src/backend/admin/stories.ts             createStoryUpload(): guard content.write, insert row, return Mux upload URL
src/app/api/admin/uploads/video/route.ts POST -> createStoryUpload (next to the existing uploads route)
src/app/api/webhooks/mux/route.ts        verify signature -> update story by passthrough -> revalidateTag(TAGS.home,'max')
src/app/admin/stories/page.tsx           -> <StoriesAdminView />
src/views/admin/stories/StoriesAdminView.tsx  list, reorder (existing /reorder), status badge (text), schedule
src/views/admin/stories/components/StoryUploader.tsx  file input -> PUT to Mux with progress (UpChunk or one PUT)
src/views/home/components/StoriesRail.tsx       server: bubbles + labels (fixed height)
src/views/home/components/StoryRailClient.tsx   "use client" leaf: seen state, prefetch + open, dynamic(StoryViewer)
src/views/home/components/stories/StoryViewer.tsx   <dialog> (reuse components/ui/Drawer), progress, tap zones, drag-to-close
src/views/home/components/stories/useStoryPlayer.ts index, paused, muted, rAF progress, hls attach, play() fallback
src/views/home/components/stories/StoryProductTray.tsx  product chips + "Shop this look" (PriceTag from components/commerce)
src/views/home/HomeView.tsx               + case "stories"
src/data/copy.ts                           labels: "Open story", "Pause", "Unmute", "Shop this look", "Story {n} of {total}"
```
If the viewer is later reused on the PDP or collections, move `stories/` to `src/components/commerce/` (CONVENTIONS
rule 1).

### 4.4 Admin upload flow (files never pass through Next)
1. The admin clicks "New story". `POST /api/admin/uploads/video` runs `guard('content.write')`, inserts a row with
   `status='waiting_upload'`, and calls Mux `POST /video/v1/uploads` with
   `{ cors_origin: SITE_URL, new_asset_settings: { playback_policies:['public'], video_quality:'basic', passthrough: storyId } }`
   (field names **verify** against the Mux API reference). The route returns `{ storyId, uploadUrl }`.
2. The browser PUTs the file straight to `uploadUrl` with progress, using UpChunk for large files and resume. This
   sidesteps Vercel's 4.5 MB body limit, which the current `uploadFile()` FormData path would hit for video.
3. The `video.upload.asset_created` webhook sets `asset_id` and `status='processing'`. Then `video.asset.ready` sets
   `playback_id`, `duration_ms` and `status='ready'`, and the route calls `revalidateTag(TAGS.home,'max')`. On
   `errored`, the row shows the error state as text. The webhook signature header name **(verify: Mux docs)**.
4. The admin picks products (reuse the product picker from the home-sections editor), sets the CTA, window and order,
   and toggles `is_active`. The generic CRUD already handles audit, tags and reorder.
5. Validation, both client-side and in zod: 9:16 ± tolerance, duration 3–60 s, a size cap (e.g. 200 MB), and MP4/MOV.

### 4.5 Analytics
Events: `story_viewed {story_id, position}` fires after 1 s of playback. `story_completed {story_id}` fires at the end.
`story_product_clicked {story_id, product_id}`. Use the existing past-tense naming (`product_viewed`), so the
requested `story_view`, `story_complete` and `story_product_click` become the names above. The repo has **no
first-party ingestion route** today: `posthog-js` is installed, but there are no capture calls and no
`/api/analytics`. For the MVP, send these as PostHog `capture` calls. Add the enum values and a route only if the
admin dashboard needs them in `analytics_events` (`product_id` is already indexed there). Attribution to orders can
use `add_to_cart` events with `properties.source='story'`.

### 4.6 Caching
Stories render inside `home_sections`, so the existing `cached()` call under `TAGS.home` (300 s) covers them, with no
new tag. Story CRUD (`tags:['home']`) and the Mux webhook both revalidate `home`. Posters and HLS come from Mux's CDN.
Next only serves ids.

---

## 5. Effort, risks, phases

### 5.1 Effort (one developer, rough)
| Part | Size |
|---|---|
| Migration, types, zod, CRUD resource, home section resolve | S |
| Mux provider, upload-init route, webhook route, env and secrets | M |
| Admin view, uploader with progress, product picker reuse | M |
| Home rail (server) and client leaf | S |
| Story viewer: dialog, progress, gestures, HLS, a11y, reduced motion, Lenis | M–L |
| Analytics (PostHog capture) | S |
| Device QA (iPhone with Low Power Mode on and off, low-end Android on throttled 3G/4G, keyboard, screen readers) | M |
| **Total** | **About 2–3 weeks (verify after the spike)** |

### 5.2 Risks
| Risk | Mitigation |
|---|---|
| Bandwidth cost if traffic spikes. Mux bills buffered segments. | Short clips (≤ 15 s), 720p cap, no autoplay in the rail, no next-story prefetch on Save-Data. Watch Mux usage and set a billing alert. Plan B is Bunny (byte-billed). |
| Autoplay policies | Always muted and `playsInline`, unmute only from a gesture, handle `play()` rejection with a Play button. |
| iOS quirks | Low Power Mode blocks muted autoplay. Unmute must come from a gesture. Use `100dvh`, not the Fullscreen API. Use native HLS on iOS. Test unmute persistence when swapping `src`. |
| Data-saver and slow Indian networks | Adaptive bitrate (hls.js `capLevelToPlayerSize`, low start level when `saveData` or 2g/3g). Posters render instantly. Show "Loading" text on stall. Never block the home render. |
| Music rights | Reels using Instagram's licensed music library cannot simply be re-hosted on our site **(verify)**. Use original or royalty-free audio. |
| Vendor billing | USD card billing and GST reverse charge **(verify with the accountant)**. |
| Vendor lock-in | Low: one table with Mux ids. Moving means re-uploading masters and swapping ids. |
| A11y regressions | The §1.3 checklist runs in QA. Pause, mute, previous, next and close are real buttons. |

### 5.3 Phased plan
- **Phase 0, spike (1–2 days)**: upload 3 clips to Mux. Test start-up time and stalls on iPhone (Low Power Mode on and
  off) and on a low-end Android over throttled 3G/4G. Confirm the Mux API field names, the webhook signature and the
  `max_resolution` playback param. As a fallback check, run
  `curl -I -H "Range: bytes=0-1" <supabase public mp4>` and expect `206`.
- **Phase 1, MVP**: schema, RLS, `stories` home section, admin upload, order, schedule and product tags. A rail and a
  single-clip viewer with progress, tap, hold, swipe-down, buttons and keys. Start muted with unmute. A product tray
  that links to the PDP, plus a "Shop this look" CTA. PostHog events. Seen state in `localStorage` (try/catch).
- **Phase 2, v2**: Quick-view and add-to-cart inside the tray (reuse `QuickViewHost`). Next-story double buffering.
  Story groups per bubble. Captions (Mux auto-captions **verify**, or uploaded VTT). Stories on PDP and collections
  (move components to `components/commerce`). A funnel dashboard (viewed → clicked → add_to_cart → order). Seen-state
  sync for logged-in users.
- **Phase 3, optional**: timestamped hotspot tags (x, y, t), UGC submissions with moderation, Instagram import.

### 5.4 Open questions for the owner
1. Expected monthly home sessions? This decides whether Mux's free tier lasts or Bunny is cheaper.
2. Who makes the videos, and do we own the audio rights?
3. Clip length (15 s?) and the maximum number of live stories (12?).
4. Products in a tray (MVP) or positioned hotspots?
5. Evergreen stories or 24 h expiry? `starts_at`/`ends_at` supports both.
6. Is PostHog the analytics source of truth, or do events need to land in `analytics_events`?
7. Is a USD card bill acceptable for Mux or Bunny?
8. Stories only on home, or also on PDP and collections later?

---

## Sources (pages opened for this note)
Repo: `docs/CONVENTIONS.md`, `docs/system-design/PERFORMANCE.md`, `src/types/domain.ts`, `supabase/migrations/0001_extensions_enums.sql`,
`0012_home_content.sql`, `0016_rls_policies.sql`, `0017_storage.sql`, `0019_analytics_single_table.sql`, `0020_home_section_tear_reveal.sql`,
`src/backend/admin/uploads.ts`, `src/backend/admin/crud.ts`, `src/backend/_core/cache.ts`, `src/views/home/HomeView.tsx`,
`node_modules/next/dist/docs/01-app/02-guides/videos.md`.

Delivery and pricing
- Mux pricing: https://www.mux.com/pricing
- Mux video pricing docs: https://www.mux.com/docs/pricing/video
- Mux direct uploads: https://www.mux.com/docs/guides/upload-files-directly
- Mux thumbnails: https://www.mux.com/docs/guides/get-images-from-a-video
- Mux secure playback: https://www.mux.com/docs/guides/secure-video-playback
- Mux playback: https://www.mux.com/docs/guides/play-your-videos
- Cloudflare Stream pricing: https://developers.cloudflare.com/stream/pricing/
- Cloudflare direct creator uploads: https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/
- Cloudflare thumbnails: https://developers.cloudflare.com/stream/viewing-videos/displaying-thumbnails/
- Cloudflare webhooks: https://developers.cloudflare.com/stream/manage-video-library/using-webhooks/
- Cloudflare own player: https://developers.cloudflare.com/stream/viewing-videos/using-own-player/
- Cloudflare securing streams: https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/
- Cloudflare network: https://www.cloudflare.com/network/
- Bunny Stream pricing: https://bunny.net/pricing/stream/
- Bunny CDN pricing: https://bunny.net/pricing/cdn/
- Bunny network: https://bunny.net/network/
- Bunny TUS uploads: https://bunny.net/docs/reference/tus-resumable-uploads
- Bunny webhooks: https://bunny.net/docs/stream-webhook
- Bunny embed token auth: https://bunny.net/docs/stream-embed-token-authentication
- api.video pricing: https://api.video/pricing/
- Vercel Blob pricing: https://vercel.com/docs/vercel-blob/usage-and-pricing
- Vercel bom1 pricing: https://vercel.com/docs/pricing/regional-pricing/bom1
- Vercel function limits: https://vercel.com/docs/functions/limitations
- Supabase pricing: https://supabase.com/pricing
- Supabase CDN: https://supabase.com/docs/guides/storage/cdn/fundamentals
- Supabase Smart CDN: https://supabase.com/docs/guides/storage/cdn/smart-cdn
- Supabase image transformations: https://supabase.com/docs/guides/storage/serving/image-transformations
- Supabase file limits: https://supabase.com/docs/guides/storage/uploads/file-limits
- Supabase resumable uploads: https://supabase.com/docs/guides/storage/uploads/resumable-uploads
- Supabase createSignedUploadUrl: https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl
- Supabase Queues: https://supabase.com/docs/guides/queues
- FFmpeg HLS muxer: https://ffmpeg.org/ffmpeg-formats.html#hls-2

Front-end, performance, accessibility
- hls.js README: https://github.com/video-dev/hls.js
- WebKit Safari 17.1 (Managed Media Source): https://webkit.org/blog/14735/webkit-features-in-safari-17-1/
- WebKit iOS video policies: https://webkit.org/blog/6784/new-video-policies-for-ios/
- Chrome autoplay policy: https://developer.chrome.com/blog/autoplay
- Apple forums, Low Power Mode autoplay: https://developer.apple.com/forums/thread/709821
- web.dev lazy-loading video: https://web.dev/articles/lazy-loading-video
- web.dev LCP: https://web.dev/articles/lcp
- web.dev INP: https://web.dev/articles/inp
- MDN `<video>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video
- MDN `<dialog>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
- MDN Save-Data: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Save-Data
- MDN effectiveType: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType
- WCAG 2.2.2 Pause, Stop, Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- WCAG 1.4.2 Audio Control: https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html
- WCAG 2.5.7 Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- APG modal dialog: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Motion `useReducedMotion`: https://motion.dev/docs/react-use-reduced-motion
- Bundle sizes (bundlephobia API, queried 2026-10-01): https://bundlephobia.com/api/size?package=hls.js (and `@mux/mux-player`, `video.js`, `@vidstack/react@1.15.6`, `plyr`)

UX references
- Instagram stories navigation: https://help.instagram.com/1660923094227526
- Myntra Glamstream: https://corporate.walmart.com/news/2025/07/29/myntra-introduces-glamstream-bringing-shoppable-streaming-to-india
- Whatmore (Shopify app): https://apps.shopify.com/whatmore-live
- Not opened (403, search snippet only): Business Standard on Nykaa "watch and buy"
