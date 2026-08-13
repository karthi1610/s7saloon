/* ═══════════════════════════════════════════════════════════════════
   Studie'o7 Salon — site behaviour
   No dependencies. Every ambient animation is disabled when the visitor
   has asked for reduced motion.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ── Image slots ───────────────────────────────────────────────────
     Photos are referenced at their real paths (images/hero-1.jpg etc).
     Until a file exists there, the slot shows a branded placeholder
     with its label. Drop the file in and it takes over — no code edit.
     ───────────────────────────────────────────────────────────────── */
  function markEmpty(img) {
    var slot = img.closest('.img-slot');
    if (slot) slot.classList.add('is-empty');
  }
  $$('.img-slot img').forEach(function (img) {
    img.addEventListener('error', function () { markEmpty(img); });
    // Catch images that already failed before this script ran.
    if (img.complete && img.naturalWidth === 0) markEmpty(img);
  });

  /* ── Mobile navigation ─────────────────────────────────────────── */
  (function () {
    var toggle = $('.nav__toggle');
    var menu   = $('.nav__menu');
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('is-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after tapping a link, and on Escape.
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  })();

  /* ── Hero slider ───────────────────────────────────────────────── */
  (function () {
    var hero   = $('.hero');
    var slides = $$('.hero__slide');
    var dots   = $$('.hero__dots button');
    if (!hero || slides.length < 2) return;

    var idx = 0;
    var timer = null;

    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === idx); });
      dots.forEach(function (d, n) { d.setAttribute('aria-selected', String(n === idx)); });
    }

    function start() {
      if (reduceMotion) return;
      stop();
      timer = setInterval(function () { show(idx + 1); }, 6000);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach(function (dot, n) {
      dot.addEventListener('click', function () { show(n); start(); });
    });

    // Don't burn cycles (or data) while the tab is hidden.
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    show(0);

    // Hold on a blank background with just the logo/copy for a beat, then
    // bring the photo in. Timer runs regardless of image load state — on a
    // slow connection this reads as an intentional reveal, not a stall.
    if (reduceMotion) {
      hero.classList.add('is-loaded');
    } else {
      setTimeout(function () { hero.classList.add('is-loaded'); }, 1000);
    }
    start();
  })();

  /* ── Scroll reveals + stat counters ────────────────────────────── */
  (function () {
    var targets = $$('[data-rv]');
    if (!targets.length) return;

    function countUp(el) {
      if (el._counted) return;
      el._counted = true;
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      if (reduceMotion) { el.textContent = String(target); return; }

      var t0 = performance.now(), dur = 1400;
      (function tick(now) {
        var p = Math.min(1, (now - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }

    function reveal(el) {
      var delay = parseInt(el.getAttribute('data-rv-delay') || '0', 10);
      setTimeout(function () {
        el.classList.add('is-revealed');
        $$('[data-count]', el).forEach(countUp);
      }, reduceMotion ? 0 : delay);
    }

    if (!('IntersectionObserver' in window)) {
      targets.forEach(reveal);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

    targets.forEach(function (el) { io.observe(el); });
  })();

  /* ── Testimonials ──────────────────────────────────────────────── */
  (function () {
    var section = $('.quotes');
    var textEl  = $('#q-text');
    var nameEl  = $('#q-name');
    var dots    = $$('.quotes__dots button');
    if (!section || !textEl || !nameEl) return;

    var items = [
      { q: 'I walked in for a trim and walked out feeling like a magazine cover. The attention to detail here is unreal.', n: 'Ananya R · regular since 2021' },
      { q: 'Best beard sculpt in the city, hands down. They actually listen before they touch the scissors.',              n: 'Karthik M · groom, 2025' },
      { q: 'My bridal trial felt like a spa day. Calm, unhurried, and the result lasted 14 hours of wedding chaos.',       n: 'Shreya & Dev · wedding party' }
    ];

    var idx = 0, timer = null;

    function paint(i) {
      idx = (i + items.length) % items.length;
      textEl.textContent = items[idx].q;
      nameEl.textContent = items[idx].n;
      dots.forEach(function (d, n) { d.classList.toggle('is-active', n === idx); });
    }

    function go(i) {
      if (reduceMotion) { paint(i); return; }
      section.classList.add('is-fading');
      setTimeout(function () {
        paint(i);
        section.classList.remove('is-fading');
      }, 450);
    }

    function start() {
      if (reduceMotion) return;
      stop();
      timer = setInterval(function () { go(idx + 1); }, 5500);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach(function (dot, n) {
      dot.addEventListener('click', function () { go(n); start(); });
    });
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    paint(0);
    start();
  })();

  /* ── Booking form: who's-this-for filter + services dropdown ─────── */
  (function () {
    var forGroup  = $('#f-for');
    var wrap      = $('#f-services');
    var btn       = $('#f-services-btn');
    var btnText   = $('#f-services-btn-text');
    var panel     = $('#f-services-panel');
    var hiddenVal = $('#f-services-value');
    if (!forGroup || !wrap || !btn || !panel) return;

    var forInputs = $$('input[type="radio"]', forGroup);

    // Category names match the tariff's own section headings.
    var CATEGORIES = {
      women: [
        'Cut & Styling', 'Head Massage & Spa', 'Hair Colouring',
        'Hair Texture Service', 'Hair Premium Treatment', 'Body Polishing',
        'Detan / Bleach', 'Threading', 'Waxing', 'Manicure', 'Pedicure',
        'Reflexology', 'Bridal', 'Facial'
      ],
      men: [
        'Cut & Styling', 'Head Massage & Spa', 'Hair Colouring',
        'Beard & Moustache Colouring', 'Facial'
      ],
      kids: [
        'Kids Hair Cut'
      ]
    };

    var selected = [];

    function currentFor() {
      var checked = forInputs.filter(function (r) { return r.checked; })[0];
      return checked ? checked.value.toLowerCase() : 'women';
    }

    function checkSvg() {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
    }

    function updateButtonText() {
      if (!selected.length) {
        btnText.textContent = 'Select services';
        btnText.classList.add('is-placeholder');
      } else {
        btnText.textContent = selected.join(', ');
        btnText.classList.remove('is-placeholder');
      }
      hiddenVal.value = selected.join(', ');
    }

    function renderPanel() {
      var who = currentFor();
      var list = CATEGORIES[who];
      selected = selected.filter(function (s) { return list.indexOf(s) > -1; });

      panel.innerHTML = '';
      list.forEach(function (cat) {
        var opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'msel__opt';
        opt.setAttribute('role', 'option');
        var isSel = selected.indexOf(cat) > -1;
        opt.setAttribute('aria-selected', String(isSel));
        opt.innerHTML = '<span class="msel__opt-check">' + checkSvg() + '</span><span>' + cat + '</span>';
        opt.addEventListener('click', function () {
          var idx = selected.indexOf(cat);
          if (idx > -1) { selected.splice(idx, 1); } else { selected.push(cat); }
          opt.setAttribute('aria-selected', String(idx === -1));
          updateButtonText();
        });
        panel.appendChild(opt);
      });
      updateButtonText();
    }

    function openPanel() {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    }
    function closePanel() {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function () {
      if (panel.hidden) { openPanel(); } else { closePanel(); }
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) closePanel();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { closePanel(); btn.focus(); }
    });

    forInputs.forEach(function (r) { r.addEventListener('change', renderPanel); });
    renderPanel();

    // Exposed so the "Book another" reset can clear selections.
    wrap._reset = function () { selected = []; closePanel(); renderPanel(); };
  })();

  /* ── Booking form ──────────────────────────────────────────────────
     ⚠ STUB — the form is not wired to anything yet. It validates,
     shows the success state, and logs the payload. Pick a destination
     and replace the body of sendBooking() below:

       A) WhatsApp — no backend, opens a prefilled chat:
          var msg = 'Booking request%0A' +
                    'Name: ' + data.name + '%0A' +
                    'Phone: ' + data.phone + '%0A' +
                    'For: ' + data.bookingFor + '%0A' +
                    'Services: ' + data.services + '%0A' +
                    'When: ' + data.date + ' ' + data.time + '%0A' +
                    'Notes: ' + data.notes;
          window.open('https://wa.me/919876543210?text=' + msg, '_blank');
          return { ok: true };

       B) Email via a form service (Formspree, Web3Forms, Netlify Forms):
          var res = await fetch('https://formspree.io/f/XXXXXXX', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(data)
          });
          return { ok: res.ok };

       C) Your own endpoint — same shape as B, pointed at your API.

     Whichever you pick, note that phone numbers are personal data:
     use HTTPS, and don't log the payload in production.
     ───────────────────────────────────────────────────────────────── */
  (function () {
    var form     = $('#booking-form');
    var card     = $('#booked');
    var errorEl  = $('#form-error');
    var nameOut  = $('#booked-name');
    var servOut  = $('#booked-service');
    var again    = $('#book-again');
    if (!form || !card) return;

    function sendBooking(data) {
      console.log('[booking] not wired to a backend yet — payload:', data);
      return Promise.resolve({ ok: true });
    }

    function fail(message, field) {
      errorEl.textContent = message;
      $$('.field', form).forEach(function (f) { f.classList.remove('has-error'); });
      if (field) {
        field.closest('.field').classList.add('has-error');
        field.focus();
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nameEl  = $('#f-name');
      var phoneEl = $('#f-phone');
      var name    = nameEl.value.trim();
      var phone   = phoneEl.value.trim();

      if (!name)  { fail('Please add your name and phone number.', nameEl);  return; }
      if (!phone) { fail('Please add your name and phone number.', phoneEl); return; }
      // Indian mobile numbers are 10 digits; allow +91, spaces and dashes.
      if (phone.replace(/[^0-9]/g, '').length < 10) {
        fail('That phone number looks incomplete — please check it.', phoneEl);
        return;
      }

      var bookingFor = ($('input[name="bookingFor"]:checked', form) || {}).value || '';
      var services   = $('#f-services-value').value;
      if (!services) {
        fail('Please select at least one service.');
        return;
      }

      var data = {
        name:       name,
        phone:      phone,
        bookingFor: bookingFor,
        services:   services,
        date:       $('#f-date').value,
        time:       $('#f-time').value,
        notes:      $('#f-notes').value.trim()
      };

      var button = $('button[type="submit"]', form);
      button.disabled = true;
      errorEl.textContent = '';

      Promise.resolve(sendBooking(data)).then(function (res) {
        button.disabled = false;
        if (!res || !res.ok) {
          fail('That didn\u2019t go through. Please call us on +91 98765 43210 instead.');
          return;
        }
        nameOut.textContent = data.name.split(' ')[0];
        servOut.textContent = data.services;
        form.hidden = true;
        card.hidden = false;
        card.setAttribute('tabindex', '-1');
        card.focus();
      }).catch(function () {
        button.disabled = false;
        fail('That didn\u2019t go through. Please call us on +91 98765 43210 instead.');
      });
    });

    if (again) {
      again.addEventListener('click', function () {
        card.hidden = true;
        form.hidden = false;
        errorEl.textContent = '';
        form.reset();
        var svc = $('#f-services');
        if (svc && svc._reset) svc._reset();
        var firstFor = $('input[name="bookingFor"]', form);
        if (firstFor) firstFor.dispatchEvent(new Event('change'));
        $('#f-name').focus();
      });
    }
  })();

  /* ── Instagram wall ────────────────────────────────────────────────
     Drift animation is pure CSS (igDriftUp/igDriftDown), disabled by
     the reduced-motion media query.

     REAL POST IMAGES — 5-minute setup:
     Instagram doesn't allow other sites to hotlink its images (the
     URLs are signed and expire), so the wall loads them through a
     feed service that caches your posts:

       1. Go to https://behold.so and sign in
       2. Connect the @studieo7hopes Instagram account
       3. Create a feed (type: JSON) and copy the feed URL
       4. Paste it into IG_FEED_URL below

     Every tile then shows a real post thumbnail and links to that
     exact post, refreshing automatically as you post. Until the URL
     is set, tiles show images/ig-1..6.jpg with the links in the HTML.
     ───────────────────────────────────────────────────────────────── */
  (function () {
    var IG_FEED_URL = ''; // ← paste your Behold JSON feed URL here

    if (!IG_FEED_URL) return;
    var tiles = $$('.ig-wall__tile');
    if (!tiles.length) return;

    fetch(IG_FEED_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var posts = (data && data.posts) || (Array.isArray(data) ? data : []);
        if (!posts.length) return;

        tiles.forEach(function (tile, i) {
          var p = posts[i % posts.length];
          // Prefer a mid-size still; videos/reels expose thumbnailUrl.
          var src =
            (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) ||
            p.thumbnailUrl || p.mediaUrl;
          if (p.mediaType === 'VIDEO' && p.thumbnailUrl) src = p.thumbnailUrl;

          var img = $('img', tile);
          if (img && src) img.src = src;
          if (p.permalink) tile.href = p.permalink;
          if (p.prunedCaption || p.caption) {
            tile.setAttribute('aria-label', 'View on Instagram: ' + String(p.prunedCaption || p.caption).slice(0, 60));
          }
        });
      })
      .catch(function () { /* feed unreachable — local images stay */ });
  })();

  /* ── Hero parallax ─────────────────────────────────────────────── */
  (function () {
    var inner = $('#hero-inner');
    if (!inner || reduceMotion) return;

    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY;
      var vh = window.innerHeight;
      if (y >= vh) return;
      inner.style.transform = 'translateY(' + (y * 0.28) + 'px)';
      inner.style.opacity = String(Math.max(0, 1 - y / (vh * 0.75)));
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    update();
  })();

  /* ── Pricing tariff — group tabs, category rail, search ──────────── */
  (function () {
    var elGroups = $('#tariff-groups');
    var elRail   = $('#tariff-rail');
    var elList   = $('#tariff-list');
    var elKicker = $('#tariff-kicker');
    var elTitle  = $('#tariff-title');
    var elDesc   = $('#tariff-desc');
    var elSearch = $('#tariff-search');
    if (!elGroups || !elRail || !elList) return;

    var GROUPS = ['Women', 'Men', 'Kids', 'Facials (Unisex)'];
    var LABEL  = { 'Women': 'Women', 'Men': 'Men', 'Kids': 'Kids', 'Facials (Unisex)': 'Facials' };

    var DATA = {
      "Men": {
        "Cut & Styling": {
          desc: "Precision cuts, shaves and grooming essentials for men.",
          items: [
            {n:"Hair Cut & Wash", d:"Haircut with a refreshing hair wash that cleanses the scalp and adds volume.", m:350, nm:450},
            {n:"Hair Cut – Change of Style", d:"Personalized style transformation with expert cut, wash and deep conditioning.", m:600, nm:800},
            {n:"Clean Shave", d:"Smooth, close razor-blade shave for a fresh, polished look.", m:150, nm:200},
            {n:"Beard Zero Trim", d:"Neat, zero-level precision trimming, irritation-free without razor blade.", m:150, nm:200},
            {n:"Beard Styling", d:"Shape and style your beard to suit your look.", m:250, nm:350},
            {n:"Head Shave", d:"Complete head shave, clean and smooth finish.", m:400, nm:500},
          ]
        },
        "Head Massage & Spa": {
          desc: "Stress-relief head massages and restorative hair spas.",
          items: [
            {n:"Head Massage – Coconut Oil", d:"Deep relaxation and scalp health.", m:350, nm:450},
            {n:"Head Massage – Almond Oil", d:"Deep relaxation and scalp health.", m:450, nm:550},
            {n:"Head Massage – Olive Oil", d:"Deep relaxation and scalp health.", m:600, nm:750},
            {n:"Moisturizing Hair Spa", d:"Intense moisture for dry or rough hair.", m:1400, nm:1600},
            {n:"Colour Save Hair Spa", d:"Fiber Clinix boosters lock in colour and add shine.", m:1600, nm:1900},
            {n:"Frizz Control Hair Spa", d:"Smooth, manageable, salon-fresh hair.", m:1600, nm:1900},
            {n:"Repair & Rejuvenate Hair Spa", d:"Repairs breakage, brings back softness and shine.", m:1600, nm:1900},
            {n:"Anti-Hair Fall Hair Spa", d:"Controls hair fall, boosts stronger growth.", m:1700, nm:2000},
            {n:"Anti-Dandruff Hair Spa", d:"Clears flakes, reduces itching, keeps scalp healthy.", m:1800, nm:2200},
          ]
        },
        "Hair Colouring": {
          desc: "Global colour, ammonia-free options and fashion tones for men.",
          items: [
            {n:"Global Hair Colour", d:"Complete coverage, ammonia-based formula.", m:820, nm:1000},
            {n:"Premium Hair Colour", d:"Gentle, ammonia-free colour, damage-free finish.", m:1000, nm:1200},
            {n:"Fashion Hair Colouring", d:"Stunning fashion tones from our exclusive shade card.", m:1400, nm:1700},
            {n:"Highlight (Per Streak)", d:"Customized streak highlights for a stylish accent.", m:600, nm:750},
          ]
        },
        "Beard & Moustache Colouring": {
          desc: "Colour touch-ups for beard and moustache.",
          items: [
            {n:"Moustache Colouring", d:"Customized shade for a stylish accent.", m:300, nm:400},
            {n:"Beard Colouring", d:"Customized shade for a stylish accent.", m:600, nm:750},
            {n:"Beard + Moustache Colouring", d:"Combined beard and moustache colouring.", m:700, nm:850},
          ]
        }
      },
      "Women": {
        "Cut & Styling": {
          desc: "Haircuts, blow dry, ironing, crimping and tong styling for women.",
          items: [
            {n:"Basic Hair Cut", d:"Simple, elegant styles that maintain length with a neat shape.", m:600, nm:750},
            {n:"Advance Hair Cut", d:"Layered cuts that add volume and dynamic style.", m:1000, nm:1200},
            {n:"Creative Hair Cut", d:"Customized cuts for a fresh, trendy, confident look.", m:1500, nm:1800},
            {n:"Fringe Hair Cut", d:"Stylish fringes that frame your face beautifully.", m:350, nm:450},
            {n:"Shampoo, Conditioning & Blow Dry (Medium)", d:"Professional-grade shampoo, deep conditioner and blow dry.", m:450, nm:550},
            {n:"Shampoo, Conditioning & Blow Dry (Long)", d:"Professional-grade shampoo, deep conditioner and blow dry.", m:550, nm:650},
            {n:"Ironing or Crimping (Medium)", d:"Expert ironing/crimping for polish, shine and lasting perfection.", m:1000, nm:1200},
            {n:"Ironing or Crimping (Long)", d:"Expert ironing/crimping for polish, shine and lasting perfection.", m:1150, nm:1400},
            {n:"Tongs Hair Styling (Medium)", d:"Expert tong styling for polish, shine and lasting perfection.", m:1150, nm:1400},
            {n:"Tongs Hair Styling (Long)", d:"Expert tong styling for polish, shine and lasting perfection.", m:1250, nm:1500},
          ]
        },
        "Head Massage & Spa": {
          desc: "Nourishing head massages and results-driven hair spas for women.",
          items: [
            {n:"Head Massage – Coconut Oil", d:"Deep relaxation and scalp health.", m:800, nm:950},
            {n:"Head Massage – Almond Oil", d:"Deep relaxation and scalp health.", m:950, nm:1150},
            {n:"Head Massage – Olive Oil", d:"Deep relaxation and scalp health.", m:1050, nm:1250},
            {n:"Moisturizing Hair Spa (Medium)", d:"Intense moisture for dry or rough hair.", m:1400, nm:1700},
            {n:"Moisturizing Hair Spa (Long)", d:"Intense moisture for dry or rough hair.", m:1600, nm:1900},
            {n:"Colour Save Hair Spa (Medium)", d:"Fiber Clinix boosters lock in colour and add shine.", m:1700, nm:2000},
            {n:"Colour Save Hair Spa (Long)", d:"Fiber Clinix boosters lock in colour and add shine.", m:1800, nm:2200},
            {n:"Frizz Control Hair Spa (Medium)", d:"Smooth, manageable, salon-fresh hair.", m:1700, nm:2000},
            {n:"Frizz Control Hair Spa (Long)", d:"Smooth, manageable, salon-fresh hair.", m:1800, nm:2200},
            {n:"Repair & Rejuvenate Hair Spa (Medium)", d:"Repairs breakage, brings back softness and shine.", m:1700, nm:2000},
            {n:"Repair & Rejuvenate Hair Spa (Long)", d:"Repairs breakage, brings back softness and shine.", m:1800, nm:2200},
            {n:"Anti-Hair Fall Hair Spa (Medium)", d:"Controls hair fall, boosts stronger growth.", m:1700, nm:2000},
            {n:"Anti-Hair Fall Hair Spa (Long)", d:"Controls hair fall, boosts stronger growth.", m:1800, nm:2200},
            {n:"Anti-Dandruff Hair Spa (Medium)", d:"Clears flakes, reduces itching, keeps scalp healthy.", m:1700, nm:2000},
            {n:"Anti-Dandruff Hair Spa (Long)", d:"Clears flakes, reduces itching, keeps scalp healthy.", m:1800, nm:2200},
          ]
        },
        "Hair Colouring": {
          desc: "Root touch-ups, global colour, highlights and balayage.",
          items: [
            {n:"Root Touch-up", d:"Covers new growth, blends roots seamlessly, ammonia-based.", m:1400, nm:1600},
            {n:"Premium Root Touch-up", d:"Ammonia-free formula, refreshes root colour, keeps hair healthy.", m:2100, nm:2500},
            {n:"Global Hair Colouring (Medium)", d:"Complete coverage, rich long-lasting base colour and shine.", m:3700, nm:4400},
            {n:"Global Hair Colouring (Long)", d:"Complete coverage, rich long-lasting base colour and shine.", m:4400, nm:5300},
            {n:"Premium Hair Colour (Medium)", d:"Gentle, ammonia-free colour, rich base tones, damage-free.", m:4400, nm:4400},
            {n:"Premium Hair Colour (Long)", d:"Gentle, ammonia-free colour, rich base tones, damage-free.", m:4800, nm:5300},
            {n:"Fashion Hair Colouring (Medium)", d:"Stunning fashion tones from our exclusive shade card.", m:5500, nm:6600},
            {n:"Fashion Hair Colouring (Long)", d:"Stunning fashion tones from our exclusive shade card.", m:6000, nm:7200},
            {n:"Global Highlights", d:"Customized streak highlights across the whole head.", m:8500, nm:10000},
            {n:"Highlights (Per Streak, min. 5)", d:"Customized shades for a stylish accent.", m:700, nm:850},
            {n:"Balayage Hair Colouring", d:"Natural, sunlit look with soft, low-maintenance highlights.", m:7000, nm:8000},
          ]
        },
        "Hair Texture Service": {
          desc: "Straightening, smoothening and bond-repair texture treatments.",
          items: [
            {n:"Hair Straightening", d:"Permanently straightens and smoothens hair for a sleek finish.", m:9500, nm:11500},
            {n:"Hair Smoothening", d:"Softens frizz and smoothens cuticles for a shiny, natural flow.", m:9500, nm:11500},
            {n:"Botox Treatment", d:"Deeply repairs and rejuvenates damaged hair fibers.", m:10000, nm:12000},
            {n:"Keratin Treatment", d:"Infuses natural keratin to eliminate frizz and add shine.", m:10000, nm:12000},
          ]
        },
        "Hair Premium Treatment": {
          desc: "L'Oréal molecular repair and luxury infusion spa rituals.",
          items: [
            {n:"Absolute Repair Molecular Treatment (Medium)", d:"L'Oréal treatment rebuilds broken hair bonds.", m:3500, nm:4200},
            {n:"Absolute Repair Molecular Treatment (Long)", d:"L'Oréal treatment rebuilds broken hair bonds.", m:3800, nm:4500},
            {n:"Infusion Luxury Spa (Medium)", d:"Caviar, Collagen and Macadamia oil blend, youth-reviving ritual.", m:4000, nm:4500},
            {n:"Infusion Luxury Spa (Long)", d:"Caviar, Collagen and Macadamia oil blend, youth-reviving ritual.", m:5000, nm:5500},
          ]
        },
        "Body Polishing": {
          desc: "Full-body exfoliation and detox rituals.",
          items: [
            {n:"Milk Turmeric Body Polishing", d:"Deep cleansing, gentle exfoliation, nourishing body mask.", m:5800, nm:7000},
            {n:"Coco-Butter Body Polishing", d:"Deep cleansing, gentle exfoliation, nourishing body mask.", m:5800, nm:7000},
            {n:"Whole Body Polishing", d:"Detoxify and reveal silky, glowing skin.", m:4000, nm:5000},
            {n:"Full Arms Polishing", d:"Detoxify and reveal silky, glowing skin.", m:2800, nm:3500},
            {n:"Full Legs Polishing", d:"Detoxify and reveal silky, glowing skin.", m:2800, nm:3500},
          ]
        },
        "Detan / Bleach": {
          desc: "Tan removal and brightening for face, arms, legs and body.",
          items: [
            {n:"Upperlip", d:"Removes tan and surface pigmentation.", m:140, nm:170},
            {n:"Underarms", d:"Removes tan and surface pigmentation.", m:350, nm:450},
            {n:"Feet", d:"Removes tan and surface pigmentation.", m:450, nm:550},
            {n:"Half Arms", d:"Removes tan and surface pigmentation.", m:600, nm:750},
            {n:"Face & Neck", d:"Removes tan and surface pigmentation.", m:800, nm:1000},
            {n:"Half Legs", d:"Removes tan and surface pigmentation.", m:900, nm:1100},
            {n:"Half Back", d:"Removes tan and surface pigmentation.", m:900, nm:1100},
            {n:"Midriff", d:"Removes tan and surface pigmentation.", m:900, nm:1100},
            {n:"Face & Neck + Blouseline", d:"Removes tan and surface pigmentation.", m:950, nm:1100},
            {n:"Full Arms", d:"Removes tan and surface pigmentation.", m:1000, nm:1200},
            {n:"Full Legs", d:"Removes tan and surface pigmentation.", m:1200, nm:1500},
            {n:"Full Body", d:"Removes tan and surface pigmentation.", m:3500, nm:4200},
          ]
        },
        "Threading": {
          desc: "Precise, gentle facial hair removal and eyebrow shaping.",
          items: [
            {n:"Upperlip Threading", d:"Clean, defined, polished look.", m:60, nm:75},
            {n:"Lowerlip Threading", d:"Clean, defined, polished look.", m:60, nm:75},
            {n:"Chin Threading", d:"Clean, defined, polished look.", m:60, nm:75},
            {n:"Forehead Threading", d:"Clean, defined, polished look.", m:60, nm:75},
            {n:"Eyebrow Threading", d:"Clean, defined, polished look.", m:60, nm:75},
            {n:"Face Sides Threading", d:"Clean, defined, polished look.", m:120, nm:150},
            {n:"Full Face Threading", d:"Clean, defined, polished look.", m:175, nm:200},
          ]
        },
        "Waxing": {
          desc: "Root-level hair removal, available in normal, Rica and chocolate wax.",
          items: [
            {n:"Underarms Waxing", d:"Smooth, clean skin for weeks.", m:300, nm:350},
            {n:"Half Arms Waxing", d:"Smooth, clean skin for weeks.", m:600, nm:750},
            {n:"Half Legs Waxing", d:"Smooth, clean skin for weeks.", m:800, nm:1000},
            {n:"Full Arms Waxing", d:"Smooth, clean skin for weeks.", m:800, nm:1000},
            {n:"Full Legs Waxing", d:"Smooth, clean skin for weeks.", m:1000, nm:1200},
            {n:"Full Back Waxing", d:"Smooth, clean skin for weeks.", m:1500, nm:1800},
            {n:"Midriff Waxing", d:"Smooth, clean skin for weeks.", m:1600, nm:2000},
            {n:"Full Waxing (FA+FL+UA)", d:"Full arms, full legs and underarms combined.", m:1800, nm:2200},
            {n:"Full Body Waxing", d:"Smooth, clean skin for weeks.", m:3000, nm:3600},
          ]
        },
        "Manicure": {
          desc: "Hand care rituals, from everyday spa manicure to exclusive treatments.",
          items: [
            {n:"Organic Spa Manicure", d:"Cleanses, exfoliates and nourishes hands.", m:700, nm:850},
            {n:"Korean Glass Shine Manicure", d:"Cleanses, exfoliates and nourishes hands.", m:1000, nm:1200},
            {n:"Coco Mint Spa Manicure", d:"Cleanses, exfoliates and nourishes hands.", m:1500, nm:1800},
            {n:"Mango Shine Spa Manicure", d:"Cleanses, exfoliates and nourishes hands.", m:1500, nm:1800},
            {n:"Exquisite Spa Manicure (Exclusive)", d:"Premium hand-care ritual.", m:2000, nm:2400},
            {n:"Candle Spa Manicure (Exclusive)", d:"Premium hand-care ritual.", m:2000, nm:2400},
            {n:"Bombshell Spa Manicure (Exclusive)", d:"Premium hand-care ritual.", m:2300, nm:2800},
          ]
        },
        "Pedicure": {
          desc: "Foot care rituals, from everyday spa pedicure to exclusive treatments.",
          items: [
            {n:"Organic Spa Pedicure", d:"Cleanses, exfoliates and softens tired feet.", m:900, nm:1000},
            {n:"Korean Glass Shine Pedicure", d:"Cleanses, exfoliates and softens tired feet.", m:1200, nm:1500},
            {n:"Coco Mint Spa Pedicure", d:"Cleanses, exfoliates and softens tired feet.", m:1600, nm:2000},
            {n:"Mango Shine Spa Pedicure", d:"Cleanses, exfoliates and softens tired feet.", m:1600, nm:2000},
            {n:"Exquisite Spa Pedicure (Exclusive)", d:"Premium foot-care ritual.", m:2300, nm:2700},
            {n:"Candle Spa Pedicure (Exclusive)", d:"Premium foot-care ritual.", m:2300, nm:2700},
            {n:"Bombshell Spa Pedicure (Exclusive)", d:"Premium foot-care ritual.", m:2500, nm:3000},
            {n:"Heel Peel Treatment", d:"Deep exfoliation for smooth, crack-free heels.", m:3000, nm:3500},
          ]
        },
        "Reflexology": {
          desc: "Therapeutic pressure-point massages to relieve stress.",
          items: [
            {n:"Neck & Shoulder (15 mins)", d:"Relieves stress, improves circulation.", m:850, nm:1000},
            {n:"Hands Reflexology (15 mins)", d:"Relieves stress, improves circulation.", m:500, nm:700},
            {n:"Feet Reflexology (15 mins)", d:"Relieves stress, improves circulation.", m:700, nm:900},
          ]
        },
        "Bridal": {
          desc: "Curated bridal services for a radiant, picture-perfect look.",
          items: [
            {n:"Saree Box Folding", d:"Neat, elegant saree box-pleat draping.", m:1000, nm:1200},
            {n:"Saree Draping", d:"Classic saree draping for any occasion.", m:900, nm:1000},
            {n:"Bridal Saree Draping", d:"Elaborate bridal-style saree draping.", m:1600, nm:2000},
            {n:"Hair Do – Advance", d:"Elegant bridal/party hairstyling.", m:2800, nm:3200},
            {n:"Mehandi", d:"Intricate mehandi application.", m:3500, nm:4200},
            {n:"Friend of Bride", d:"Styling support for bridesmaids.", m:5200, nm:6000},
            {n:"Party Makeover", d:"Complete party-ready makeover.", m:5500, nm:6200},
          ]
        }
      },
      "Kids": {
        "Kids Hair Cut": {
          desc: "Gentle, fun haircuts for little champs and princesses.",
          items: [
            {n:"Boy Hair Cut", d:"Soft handling, quick styling, tidy look for little champs.", m:250, nm:300},
            {n:"Girl Hair Cut", d:"Neat, stylish, easy-to-maintain cut with a happy salon vibe.", m:400, nm:500},
          ]
        }
      },
      "Facials (Unisex)": {
        "Express Facials": {
          desc: "Cleanse, rejuvenate and brighten dull skin in under 25 minutes.",
          items: [
            {n:"Classic Express Facial", d:"Quick refresh for everyday radiance.", m:950, nm:1100},
            {n:"De-tan Express Facial", d:"Targets tan for an even tone.", m:950, nm:1100},
            {n:"Organic Express Facial", d:"Gentle, organic-actives refresh.", m:950, nm:1100},
            {n:"Skin Lightening Express Facial", d:"Advanced brightening actives, reduces pigmentation.", m:1200, nm:1400},
            {n:"Skin Whitening Express Facial", d:"Advanced brightening actives, enhances radiance.", m:1300, nm:1500},
          ]
        },
        "Korean Range of Facials": {
          desc: "Korean skincare rituals for a glass-like, glowing finish.",
          items: [
            {n:"Korean Glow Facial", d:"Korean Ginseng and Vitamin C — removes tan, brightens skin.", m:3300, nm:4000},
            {n:"Rice Water Facial", d:"Purifies, hydrates and refines texture for a luminous glow.", m:3500, nm:4200},
            {n:"Brown Seaweed Facial", d:"Marine minerals and antioxidants restore balance and radiance.", m:3500, nm:4200},
            {n:"Jeju-Cherry Facial", d:"Enhances luminosity, boosts moisture, petal-soft finish.", m:3500, nm:4200},
            {n:"Purple Ginseng Facial", d:"Refreshes, tightens, bright healthy glow for tired/aging skin.", m:3500, nm:4200},
            {n:"Artichoke Facial", d:"Clears, firms and smooths dull or congested skin.", m:3500, nm:4200},
          ]
        },
        "Exclusive Facial": {
          desc: "Signature facials for special occasions and everyday glow.",
          items: [
            {n:"Fruit Facial", d:"Fruit-rich facial that cleans and brightens instantly.", m:1400, nm:1700},
            {n:"Diamond Facial", d:"Brightens, tightens, sparkling glow — perfect for occasions.", m:1800, nm:2200},
            {n:"Red Wine Facial", d:"Refreshes, firms, natural healthy glow.", m:1800, nm:2200},
            {n:"Platinum Facial", d:"Tightens, brightens, radiant youthful look.", m:1800, nm:2200},
            {n:"Oxygen Facial", d:"Deep hydration, instant fresh look.", m:1800, nm:2200},
            {n:"Vitamin C Facial", d:"Lightens, brightens, instant healthy glow.", m:1800, nm:2200},
          ]
        },
        "Premium Facial": {
          desc: "Deeper treatments for specific skin concerns.",
          items: [
            {n:"Pore Pure Facial", d:"For oily/acne-prone skin — clear, smooth, fresh.", m:2800, nm:3300},
            {n:"Dead Sea Mineral Facial", d:"Deep cleanse, refresh, healthy glow.", m:3100, nm:3720},
            {n:"Chocolate Facial", d:"Hydrates, glowing velvety finish.", m:3100, nm:3720},
            {n:"Skin Brightening Facial", d:"Instant brightening, clear glowing look.", m:3100, nm:3720},
            {n:"Age Reversal Facial", d:"Tightens, smooths, fresh youthful glow.", m:3100, nm:3720},
            {n:"Perfect Look Facial", d:"Cleans, brightens, smooth flawless finish.", m:3500, nm:4200},
            {n:"Gold Glow Facial", d:"Brightens, firms, rich glowing finish.", m:3500, nm:4200},
          ]
        },
        "Luxury Facial": {
          desc: "The most advanced hydration, glow and anti-aging treatments.",
          items: [
            {n:"Korean Glass Skin Facial", d:"Hyaluronic Acid, Niacinamide and botanicals for glass-like skin.", m:4000, nm:4800},
            {n:"Luxury Gold Facial", d:"24K gold-infused, boosts collagen and elasticity.", m:4000, nm:4800},
            {n:"Bride & Groom Facial", d:"Pre-wedding facial for a flawless wedding-day glow.", m:4500, nm:5500},
            {n:"Hydra Facial", d:"Deep cleansing, hydration and antioxidant infusion.", m:5500, nm:6500},
            {n:"Absolute Hydra Facial", d:"Advanced hydration therapy with active serums.", m:8000, nm:9500},
          ]
        },
        "Facial Add-On Mask": {
          desc: "Peel-off mask add-ons to complete any facial.",
          items: [
            {n:"Vitamin C Peel Off Mask", d:"Brightens instantly, fresh healthy glow.", m:1600, nm:2000},
            {n:"Dead Sea Mud Peel Off Mask", d:"Clears pores, removes tan, glowing look.", m:1600, nm:2000},
            {n:"Hydra Peel Off Mask", d:"Cools, hydrates, instant fresh glow.", m:1800, nm:2200},
            {n:"Whitening Peel Off Mask", d:"Brightens, smooths, instant fair glowing look.", m:1800, nm:2200},
            {n:"Gold Peel Off Mask", d:"Brightens, tightens, rich golden glow.", m:1800, nm:2200},
          ]
        }
      }
    };

    var pstate = { group: 'Women', cat: 'Cut & Styling', q: '' };

    function money(n) { return '₹' + n.toLocaleString('en-IN'); }
    function slug(s)  { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    function splitTag(name) {
      var mm = name.match(/^(.*?)\s*\((Exclusive)\)\s*$/i);
      return mm ? { name: mm[1], tag: mm[2] } : { name: name, tag: '' };
    }

    function buildGroups() {
      GROUPS.forEach(function (g) {
        var b = document.createElement('button');
        b.className = 'grp';
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', String(g === pstate.group));
        b.dataset.group = g;
        b.dataset.testid = 'pricing-group-' + slug(g);
        b.textContent = LABEL[g];
        b.addEventListener('click', function () {
          pstate.group = g;
          pstate.cat = Object.keys(DATA[g])[0];
          pstate.q = '';
          elSearch.value = '';
          syncGroups();
          buildRail();
          renderPricing();
        });
        elGroups.appendChild(b);
      });
    }

    function syncGroups() {
      Array.prototype.forEach.call(elGroups.children, function (b) {
        b.setAttribute('aria-selected', String(b.dataset.group === pstate.group));
      });
    }

    function buildRail() {
      Array.prototype.slice.call(elRail.querySelectorAll('.cat')).forEach(function (n) { n.remove(); });
      Object.keys(DATA[pstate.group]).forEach(function (cat) {
        var b = document.createElement('button');
        b.className = 'cat';
        b.type = 'button';
        b.dataset.cat = cat;
        b.dataset.testid = 'pricing-cat-' + slug(cat);
        b.setAttribute('aria-current', String(cat === pstate.cat));
        b.innerHTML = '<span>' + cat + '</span><span class="cat__n">' + DATA[pstate.group][cat].items.length + '</span>';
        b.addEventListener('click', function () {
          pstate.cat = cat;
          pstate.q = '';
          elSearch.value = '';
          syncRail();
          renderPricing();
        });
        elRail.appendChild(b);
      });
    }

    function syncRail() {
      Array.prototype.forEach.call(elRail.querySelectorAll('.cat'), function (b) {
        b.setAttribute('aria-current', String(b.dataset.cat === pstate.cat && !pstate.q));
      });
    }

    function row(it, where) {
      var parts = splitTag(it.n);
      var li = document.createElement('li');
      li.className = 'svc';
      li.dataset.testid = 'pricing-item';
      li.innerHTML =
        '<div class="svc__row">' +
          '<div>' +
            (where ? '<p class="svc__where">' + where + '</p>' : '') +
            '<p class="svc__name">' + parts.name +
              (parts.tag ? '<span class="svc__tag">' + parts.tag + '</span>' : '') +
            '</p>' +
            '<p class="svc__desc">' + it.d + '</p>' +
          '</div>' +
          '<div class="svc__price">' +
            '<p class="svc__m">' + money(it.m) + '</p>' +
            '<p class="svc__nm">' + money(it.nm) + '</p>' +
          '</div>' +
        '</div>';
      return li;
    }

    function renderPricing() {
      elList.innerHTML = '';

      if (pstate.q) {
        var q = pstate.q.toLowerCase(), hits = [];
        GROUPS.forEach(function (g) {
          Object.keys(DATA[g]).forEach(function (c) {
            DATA[g][c].items.forEach(function (it) {
              if ((it.n + ' ' + it.d + ' ' + c).toLowerCase().indexOf(q) > -1) {
                hits.push({ it: it, where: LABEL[g] + ' · ' + c });
              }
            });
          });
        });

        elKicker.textContent = 'Search';
        elTitle.textContent = hits.length + (hits.length === 1 ? ' service found' : ' services found');
        elDesc.textContent = 'Matching “' + pstate.q + '” across the whole tariff.';
        syncRail();

        if (!hits.length) {
          elList.innerHTML = '<li class="tariff__empty"><b>Nothing under that name</b>Try “colour”, “facial”, “beard” or “spa”.</li>';
          return;
        }
        hits.slice(0, 60).forEach(function (h) { elList.appendChild(row(h.it, h.where)); });
        return;
      }

      var data = DATA[pstate.group][pstate.cat];
      elKicker.textContent = LABEL[pstate.group];
      elTitle.textContent = pstate.cat;
      elDesc.textContent = data.desc;
      data.items.forEach(function (it) { elList.appendChild(row(it, '')); });
    }

    if (elSearch) {
      elSearch.addEventListener('input', function () {
        pstate.q = elSearch.value.trim();
        renderPricing();
      });
    }

    buildGroups();
    buildRail();
    renderPricing();
  })();

})();
