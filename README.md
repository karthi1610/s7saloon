# Studie'o7 Salon — website

Single-page marketing site. Plain HTML, CSS and JavaScript — no build step, no
dependencies, no `npm install`.

## Folder structure

```
studio7-salon/
├── index.html          # the whole page
├── css/styles.css      # all styles (uses CSS custom-property tokens)
├── js/main.js          # nav, hero slider, pricing, booking, IG wall
├── assets/logo.png     # brand wordmark
└── images/             # photos (see images/README.md for the slot list)
```

## How to host

No build step. Any static host works:

- **Local preview:** from this folder run `python3 -m http.server 8000`,
  then open `http://localhost:8000`.
- **Netlify / Cloudflare Pages / Vercel:** drag this folder onto the deploy
  drop zone (or point the project at it) — it publishes as-is.
- **Any web server / cPanel:** upload the whole `studio7-salon` folder and
  serve `index.html`.

Opening `index.html` by double-click mostly works too, but a couple of features
(the Instagram feed fetch) need it served over http/https rather than `file://`.

## Sections

Hero slider · Services (each card links to Pricing) · About + Why-choose-us +
Achievements · Gallery · Pricing (full tariff, 160 services, searchable) ·
Testimonials · Booking form · Instagram wall · Footer.

## Things you'll likely want to set

1. **Photos.** Replace the placeholder image slots — see `images/README.md`
   for the exact filenames. The three `hero-*.jpg` and six `ig-*.jpg` are
   already real; `about.jpg` and `gallery-1..6.jpg` are still placeholders.

2. **Instagram wall — real post images (5-min setup).** Instagram blocks other
   sites from hotlinking its images, so the wall pulls them through a feed
   service that caches your posts:
   - Sign up at https://behold.so -> connect the @studieo7hopes account
   - Create a JSON feed, copy its URL
   - Paste it into IG_FEED_URL near the top of the Instagram-wall block in
     js/main.js (the spot is commented with these same steps)
   Every tile then shows a real post thumbnail and links to that exact post,
   refreshing as you post. Until it's set, tiles use images/ig-1..6.jpg.

3. **Booking form.** It validates and shows a success state but isn't wired to a
   backend yet. js/main.js has a commented sendBooking() stub with three
   ready-to-use options (WhatsApp deep-link, Formspree/Web3Forms email, or your
   own endpoint). Pick one and drop it in.

4. **Contact details.** Address, phone and the @studieo7hopes links live in
   index.html (contact section + footer + JSON-LD schema near the bottom).

## Notes

- Colours, fonts and spacing are CSS custom properties defined in :root at the
  top of css/styles.css — change them there and the whole site follows.
- The design is dark with gold accents; fonts are Cormorant Garamond (display)
  and Jost (body), loaded from Google Fonts in index.html.
- Animations respect prefers-reduced-motion.
