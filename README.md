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
    ├── ig-1..14.jpg    Instagram wall tiles, 540x540
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

**2. Instagram feed.** The wall currently shows 14 curated images with real
permalinks — it works as-is and needs nothing. `IG_FEED_URL` in `js/main.js` is
the hook if you later want the tiles to auto-update from a live feed
(via Behold.so or similar) instead of being hand-picked.

**3. Domain.** `index.html` has absolute URLs on the canonical link, the Open
Graph tags and the JSON-LD, all pointing at `https://studieo7.com/`. Update
them if the site lands on a different domain — otherwise social previews and
search results will point at the wrong host.
