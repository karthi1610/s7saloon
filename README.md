# Studie'o7 Signature Lounge — website

Single-page marketing site. Plain HTML, CSS and JavaScript. No build step, no
dependencies, nothing to install.

## Folder structure

```
studieo7-salon/
├── index.html          the whole page
├── css/styles.css      all styles (CSS custom-property tokens at the top)
├── js/main.js          nav, hero slider, pricing, gallery lightbox, booking
├── assets/
│   ├── logo.png        wordmark, 2272x726 — hero
│   ├── logo-sm.png     wordmark, 909x290 — nav + footer
│   └── favicon.png     256x256 square
└── images/
    ├── hero-1.jpg      hero slider
    ├── hero-2.jpg
    ├── about.jpg       about section
    ├── gallery-1..11.jpg   masonry gallery, in column-balanced order
    ├── ig-1..14.jpg    Instagram wall tiles, 540x540 (curated fallback)
    └── og-cover.jpg    1200x630 social share card
```

## How to host

Any static host works. Upload the **contents** of this folder so that
`index.html` sits at the web root — not the folder itself, or every URL gains
an extra `/studieo7-salon/` segment.

- **Netlify / Cloudflare Pages / Vercel** — drag this folder onto the deploy
  drop zone. No build command, no output directory.
- **cPanel / shared hosting** — upload into `public_html/`.
- **Local preview** — `python3 -m http.server 8000`, then open
  `http://localhost:8000`.

Opening `index.html` by double-click mostly works, but serve it over http for
an accurate check: `file://` changes how relative paths and the map iframe
resolve.

## Sections

Hero slider · Services · About + why-choose-us + stats · Gallery (masonry,
with lightbox) · Pricing (full 160-service tariff, tabs + search) ·
Testimonials · Booking form · Instagram wall · Contact + map · Footer

## Contact details, in case they change

The phone number appears in **four** places. Search for `7200105777`:

| Where | What |
|---|---|
| `index.html` contact block | `tel:` link and the visible text |
| `index.html` contact block | `wa.me` WhatsApp link |
| `index.html` JSON-LD | `"telephone"` |
| `js/main.js` | two "call us instead" booking-failure messages |

Opening hours appear in **three** places — search for `22:00`:

| Where | What |
|---|---|
| `index.html` `<meta name="description">` | search-result snippet |
| `index.html` contact block | the visible Hours line |
| `index.html` JSON-LD | `openingHoursSpecification` |

Current values: **Tue–Sun 10:00–22:00, Monday 10:00–20:00.**

## Still to wire

**1. Booking form destination.** `sendBooking()` in `js/main.js` is a stub — it
resolves after a short delay and the success card shows, but nothing is sent
anywhere. The comment block directly above it documents the exact JSON payload
shape to hand a backend or billing vendor. Three options:

- WhatsApp hand-off — build a `wa.me/917200105777?text=...` URL from the form
  values and open it. Zero backend.
- Formspree / Basin — swap the stub for a `fetch()` POST to the form endpoint.
- Custom API — the payload contract is already written out in the comment;
  the endpoint needs to answer the CORS preflight, which is also documented.

**2. Domain.** `index.html` has absolute URLs on the canonical link, the Open
Graph tags and the JSON-LD, all pointing at `https://studieo7.com/`. Update
them if the site lands on a different domain — otherwise social previews and
search results will point at the wrong host.

## Instagram feed

The Instagram wall is **live**. Six of its fourteen tiles pull the latest posts
from [@studieo7hopes](https://www.instagram.com/studieo7hopes/) automatically;
the rest stay curated. Nothing here needs a re-deploy when a new post goes up —
new posts flow in on their own.

### Where the posts come from

Instagram blocks other sites from hot-linking its images (the URLs are signed
and expire), so we don't talk to Instagram directly. A service called
**[Behold.so](https://behold.so)** connects to the account, caches the posts on
its own CDN, and serves them back as a stable JSON feed. Our site fetches that
JSON on each page load.

```
Instagram (@studieo7hopes)
      │   Behold polls the account on a schedule
      ▼
Behold.so  ──  caches images on behold.pictures CDN, exposes JSON
      │   the site fetches this URL in the browser on every page load
      ▼
js/main.js  ──  drops the images + permalinks into the wall tiles
```

- **Feed URL:** `https://feeds.behold.so/Q4r6C0Yztql7o4tpx2MC`
  (set as `IG_FEED_URL` near the top of the Instagram block in `js/main.js`)
- **Behold account:** the `karthikn1629@gmail.com` login, Free plan.
- **Source:** a *basic* source connected to @studieo7hopes (a professional /
  business Instagram account — Behold rejects personal accounts).
- **Feed type:** JSON (not the drop-in Widget — we render into our own layout).

### Which tiles are live

The wall is four vertically-drifting columns, 14 tiles total. The feed returns
**6 posts**, mapped onto these tile positions (1-based):

```
Column 1 (up):    [1]  [2]  [3]  [4]         ← all curated
Column 2 (down):  [5*] [6*] [7]              ← 5, 6 live
Column 3 (up):    [8]  [9*] [10*] [11]       ← 9, 10 live
Column 4 (down):  [12*] [13*] [14]           ← 12, 13 live
                   * = live Instagram post
```

That split is controlled by one line in `js/main.js` — the `LIVE_TILES` array
inside the Instagram block:

```js
// Tiles (1-based) 5, 6, 9, 10, 12, 13 → 0-based indices:
var LIVE_TILES = [4, 5, 8, 9, 11, 12];
```

To change which tiles go live, edit that array (0-based). To go back to a fully
curated wall, blank out `IG_FEED_URL` (set it to `''`) — every tile then falls
back to its baked-in `images/ig-*.jpg`.

### Post order and media types

Posts fill `LIVE_TILES` in feed order — newest post → first tile in the list,
and so on. Each live tile's image is the Behold-cached still from the feed's
`sizes.medium` field, and its link points at the post's `permalink`. Reels and
videos work too: for those, `sizes` holds the thumbnail frame, so a video post
shows its cover image and links through to the reel.

### Good to know / gotchas

- **Not instant.** Behold polls Instagram on a schedule (slower on the Free
  plan), so a brand-new post appears on the site after Behold's next sync —
  minutes to hours, not immediately.
- **6 is the plan cap.** Behold's default is 6 posts per feed; the Free plan
  doesn't raise it. A paid tier could return more if you ever want additional
  live tiles.
- **Free view limit.** Behold counts one "view" per feed request (≈ per page
  load). The Free plan caps monthly views (~1.2k). If the site exceeds it, the
  feed pauses until the 1st of next month.
- **It fails safe.** If the feed is paused, rate-limited, or unreachable, the
  `.catch()` in `js/main.js` leaves every tile on its curated `ig-*.jpg`. The
  wall never breaks or shows gaps — it just stops updating until the feed is
  back.
- **Reconnecting.** If Behold ever shows the source as "disconnected" (e.g.
  after an Instagram password change), log into Behold and reauthorize the
  source — the feed URL stays the same, no site change needed.

### Testing the feed

Serve over http(s), not `file://` — the fetch needs a real web origin.
On the live site (GitHub Pages / any host), open DevTools → Network, reload,
and confirm the `feeds.behold.so` request returns **200** with 6 posts and the
`behold.pictures` images load. If the wall still shows old images after an
update, hard-refresh (Ctrl/Cmd+Shift+R) to clear cache.
