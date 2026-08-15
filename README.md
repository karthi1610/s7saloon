# Studie'o7 — Signature Lounge, Hopes

Single-page marketing site. Plain HTML / CSS / JS — no build step, no
dependencies to install. Upload the folder and it runs.

## Deploy

Upload the whole folder so `index.html` sits at the web root:

    index.html
    css/styles.css
    js/main.js
    images/
    assets/

Works as-is on Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any
cPanel / shared host (drop into `public_html`). Serve over HTTPS — the
booking form collects phone numbers.

To preview locally:

    cd studio7-salon
    python3 -m http.server 8000     # then open http://localhost:8000

Opening index.html by double-clicking mostly works, but a local server
matches production behaviour.

## Before you go live — 3 things to finish

### 1. Booking form  (js/main.js — `sendBooking`, approx. line 333)

The form validates, animates and shows the success message, but does NOT
send anywhere yet. It logs the payload to the console. Pick one:

  A. WhatsApp — no backend, opens a prefilled chat
  B. Formspree / Web3Forms / Netlify Forms — email, no backend
  C. Your own API endpoint

Ready-made snippets for all three are in the comment directly above the
function. Remove the `console.log` once wired — phone numbers are
personal data and shouldn't sit in browser logs.

### 2. Instagram feed  (js/main.js — `IG_FEED_URL`, approx. line 450)

The Instagram wall currently shows the six images in `images/ig-*.jpg`.
To make it live and self-updating:

  1. Sign up at behold.so and connect @studieo7hopes
  2. Copy the JSON feed URL
  3. Paste it into `IG_FEED_URL`

Until then the static images show — nothing breaks.

### 3. Real phone number

Placeholder `+91 98765 43210` appears in FOUR places. Search and replace
all of them:

  - index.html  line ~458  (contact block, twice: tel: link and label)
  - index.html  line ~535  ("telephone" in the structured data)
  - js/main.js  line ~396  (booking error message)
  - js/main.js  line ~411  (booking error message)

## Also worth updating

- **Domain.** `https://studieo7.com/` is assumed in the canonical tag,
  Open Graph tags and structured data (index.html, lines 9-16 and ~534).
  Change if you host elsewhere.
- **Favicon.** Currently `assets/logo.png`. A square, cropped icon would
  render better in browser tabs than the wide wordmark.
- **Photography.** Two gallery tiles (`gallery-7.jpg` styling station,
  `gallery-8.jpg` treatment room) are video stills and are visibly softer
  than the rest. Replace when you have better shots — same filename,
  roughly 1.36:1 landscape.

## Structure

    index.html        all markup, meta tags, JSON-LD structured data
    css/styles.css    design tokens at the top (:root), then sections in
                      page order; responsive + reduced-motion at the end
    js/main.js        nav, hero slider, pricing tabs/search, booking form,
                      Instagram wall — plain JS, no framework
    images/           hero, about, gallery, Instagram, og-cover
    assets/logo.png   wordmark (nav, hero, footer)

## Design tokens  (css/styles.css, `:root`)

    --bg        #14200A   page base, hero, services, gallery, footer
    --bg-alt    #1B2B0D   marquee, about, pricing sections
    --panel     #0D1606   pricing tariff box only (darker, for contrast)
    --card      #1E300F   booking form, dropdowns
    --gold      #C9A468   accent, buttons, hairlines
    --gold-2    #E8D5AE   bright gold, headings

The green is sampled from the salon's own wall, darkened so gold text
clears WCAG AA (gold on `--bg` = 7.2:1).

## Accessibility notes

Keep these if you edit: skip link, focus-visible rings, `aria-*` on the
nav toggle / hero dots / pricing tabs / services dropdown, and the
`prefers-reduced-motion` block at the foot of the stylesheet (it disables
the marquee, drift, hero cue and booking animation).
