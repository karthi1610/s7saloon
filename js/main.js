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
      { q: 'Had a great experience at Studio 7 Signature Lounge! The haircut was really good, and the staff were friendly, professional, and attentive. Loved the overall service and the clean, premium atmosphere. Definitely a place I\u2019d recommend for a quality haircut and grooming experience. Will definitely visit again!', n: 'Ajay B' },
      { q: 'The service was very awesome. I recently visited Studieo7 Signature Lounge Hopes and it was a great experience for me. Thank you Viji for this beautiful hairstyle. It\u2019s very beautiful and I really loved it.', n: 'Archana' },
      { q: 'Had an amazing experience at Studio7! Dass was my hairstylist and he was so patient, friendly, and really understood exactly what I wanted. The service was top-notch and the whole vibe was welcoming. Highly recommend Studio7!', n: 'Nandhini Murugesan' },
      { q: 'Service was awesome, I got a haircut by Das \u2014 very humble and good approach. Totally love it.', n: 'Shaki Pico Pritty' }
    ];

    var idx = 0, timer = null;

    // Reserve height for the TALLEST review so rotating between a 2-line and a
    // 5-line quote never changes the section height (which would shove the
    // booking form below it up and down — the "jerk"). Measured from the live
    // element so it's correct at any viewport width, and re-run on resize.
    function lockHeight() {
      textEl.style.minHeight = '0px';
      var prev = textEl.textContent;
      var tallest = 0;
      items.forEach(function (it) {
        textEl.textContent = it.q;
        if (textEl.offsetHeight > tallest) tallest = textEl.offsetHeight;
      });
      textEl.textContent = prev;
      textEl.style.minHeight = tallest + 'px';
    }

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

    lockHeight();
    paint(0);
    start();

    var rzTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(rzTimer);
      rzTimer = setTimeout(lockHeight, 200);
    });
  })();

  /* ── Booking form: who's-this-for filter + services dropdown ─────── */
  (function () {
    var forGroup  = $('#f-for');
    var wrap      = $('#f-services');
    var btn       = $('#f-services-btn');
    var btnText   = $('#f-services-btn-text');
    var panel     = $('#f-services-panel');
    var list      = $('#f-services-list');
    var applyBtn  = $('#f-services-apply');
    var hiddenVal = $('#f-services-value');
    if (!forGroup || !wrap || !btn || !panel || !list) return;

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
        // Cap the visible chips so picking many services can't grow the button
        // onto multiple lines. Show the first two, then "+N".
        var MAX = 2;
        if (selected.length <= MAX) {
          btnText.textContent = selected.join(', ');
        } else {
          btnText.textContent = selected.slice(0, MAX).join(', ') +
            ' +' + (selected.length - MAX);
        }
        btnText.classList.remove('is-placeholder');
      }
      hiddenVal.value = selected.join(', ');
    }

    function renderPanel() {
      var who = currentFor();
      var catNames = CATEGORIES[who];
      selected = selected.filter(function (s) { return catNames.indexOf(s) > -1; });

      list.innerHTML = '';
      catNames.forEach(function (cat) {
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
        list.appendChild(opt);
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
    // Apply is an explicit "done" — selections already applied live, so it
    // just closes the panel and returns focus to the trigger.
    if (applyBtn) {
      applyBtn.addEventListener('click', function () { closePanel(); btn.focus(); });
    }
    // pointerdown fires for both mouse and touch, and before the synthetic
    // click — so a tap anywhere outside the widget reliably closes the panel
    // on real phones (plain 'click' can miss or be intercepted on touch).
    document.addEventListener('pointerdown', function (e) {
      if (panel.hidden) return;
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

  /* ══ BOOKING API ═══════════════════════════════════════════════════
     The form POSTs a JSON booking to BOOKING_API_URL on submit.

     ┌─ SET THIS ────────────────────────────────────────────────────┐
     │  BOOKING_API_URL — the endpoint that receives the booking.    │
     │  Must be https. Leave '' to keep the form in dry-run mode     │
     │  (validates + animates, logs the payload, sends nothing).     │
     └───────────────────────────────────────────────────────────────┘

     ⚠ DO NOT put an API key in this file. Everything here is public —
     "view source" on any phone shows it. If the receiving endpoint
     needs a secret, it must sit behind your own relay (a Cloudflare
     Worker) that holds the key server-side and forwards the call.

     The endpoint must also send CORS headers, or the browser will
     block the request before it leaves the page:
       Access-Control-Allow-Origin: https://studieo7.com
       Access-Control-Allow-Methods: POST, OPTIONS
       Access-Control-Allow-Headers: Content-Type
     and answer the OPTIONS preflight with 204.

     Payload shape sent on every submission — this is the contract to
     hand the billing vendor:

       {
         "requestId":   "uuid",              // idempotency key, unique per submit
         "source":      "website",
         "submittedAt": "2026-08-18T09:14:00.000Z",   // ISO 8601, UTC
         "customer": {
           "name":  "Ravi Kumar",
           "phone": "+919876543210"          // E.164, normalised
         },
         "booking": {
           "segment":     "women",           // women | men | kids
           "services":    ["Cut & Styling", "Facial"],   // array, not a string
           "preferredAt": "2026-08-20T10:30:00+05:30",   // null if not given
           "preferredDate": "2026-08-20",    // raw fallback, null if not given
           "preferredTime": "10:30",         // raw fallback, null if not given
           "notes":       "First visit"      // "" when blank
         }
       }

     Expected response: any 2xx = accepted. Anything else, or a network
     failure/timeout, shows the customer the "please call us" message.
     ═════════════════════════════════════════════════════════════════ */
  (function () {
    var form     = $('#booking-form');
    var card     = $('#booked');
    var errorEl  = $('#form-error');
    var nameOut  = $('#booked-name');
    var servOut  = $('#booked-service');
    var again    = $('#book-again');
    if (!form || !card) return;

    var BOOKING_API_URL = '';   // ← your endpoint goes here
    var BOOKING_TIMEOUT = 12000; // ms before we give up and tell the customer

    // "Now" in the salon's timezone (IST, +05:30), independent of the visitor's
    // device clock/timezone, so the date floor and past-time check stay correct
    // for a customer booking from another zone.
    function istNow() {
      return new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
    }
    function localDateStr() {
      var d = istNow();
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }
    function localTimeStr() {
      var d = istNow();
      return String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0');
    }

    // 10 local digits -> +91XXXXXXXXXX. Already-prefixed numbers pass through.
    function toE164(raw) {
      var d = String(raw).replace(/[^0-9]/g, '');
      if (d.length === 10) return '+91' + d;
      if (d.length === 12 && d.indexOf('91') === 0) return '+' + d;
      if (d.length === 11 && d.charAt(0) === '0') return '+91' + d.slice(1);
      return '+' + d;
    }

    // date + time -> ISO with the salon's real offset. IST is fixed at +05:30,
    // so this is safe to hardcode; don't reuse it for other timezones.
    function toIso(date, time) {
      if (!date) return null;
      return date + 'T' + (time || '00:00') + ':00+05:30';
    }

    function newId() {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
      return 'bk-' + Date.now() + '-' + Math.random().toString(16).slice(2, 10);
    }

    function buildPayload(data) {
      return {
        requestId:   newId(),
        source:      'website',
        submittedAt: new Date().toISOString(),
        customer: {
          name:  data.name,
          phone: toE164(data.phone)
        },
        booking: {
          segment:       (data.bookingFor || '').toLowerCase(),
          services:      data.services ? data.services.split(', ') : [],
          preferredAt:   toIso(data.date, data.time),
          preferredDate: data.date || null,
          preferredTime: data.time || null,
          notes:         data.notes || ''
        }
      };
    }

    function sendBooking(data) {
      var payload = buildPayload(data);

      if (!BOOKING_API_URL) {
        console.log('[booking] dry run — set BOOKING_API_URL to send. Payload:', payload);
        return Promise.resolve({ ok: true, dryRun: true });
      }

      // AbortController so a hanging endpoint doesn't leave the customer
      // staring at a "Sending" button forever.
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, BOOKING_TIMEOUT) : null;

      return fetch(BOOKING_API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  ctrl ? ctrl.signal : undefined
      }).then(function (res) {
        if (timer) clearTimeout(timer);
        // Deliberately not logging the payload here — it holds a phone number.
        if (!res.ok) console.error('[booking] endpoint returned', res.status);
        return { ok: res.ok, status: res.status };
      }).catch(function (err) {
        if (timer) clearTimeout(timer);
        console.error('[booking] request failed:', err && err.name);
        return { ok: false, status: 0 };
      });
    }

    // "2026-08-24" + "14:30" -> "Sun, 24 Aug · 2:30 PM"
    function formatWhen(dateStr, timeStr) {
      if (!dateStr) return '—';
      var parts = dateStr.split('-');
      var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      var days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      var mons  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var out = days[d.getDay()] + ', ' + d.getDate() + ' ' + mons[d.getMonth()];
      if (timeStr) {
        var hm = timeStr.split(':');
        var h = +hm[0], m = hm[1];
        var ap = h >= 12 ? 'PM' : 'AM';
        var h12 = h % 12; if (h12 === 0) h12 = 12;
        out += ' · ' + h12 + ':' + m + ' ' + ap;
      }
      return out;
    }

    // Confetti burst from behind the stamp. Colours pull from the palette
    // (gold + green) so it stays on-brand rather than rainbow.
    function firePoppers() {
      var host = $('#ticket-poppers');
      if (!host) return;
      host.innerHTML = '';
      if (reduceMotion) return;
      var colours = ['#C79A24', '#E2C45C', '#365B32', '#8A670F', '#B0D183'];
      var N = 40;
      for (var i = 0; i < N; i++) {
        var s = document.createElement('span');
        var ang = (Math.PI * 2 * i) / N + (Math.random() * 0.5 - 0.25);
        var dist = 80 + Math.random() * 90;
        var size = 5 + Math.random() * 6;
        s.style.width  = size + 'px';
        s.style.height = (size * (0.5 + Math.random())) + 'px';
        s.style.background = colours[i % colours.length];
        s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
        s.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(1) + 'px');
        s.style.setProperty('--dr', (Math.random() * 720 - 360).toFixed(0) + 'deg');
        s.style.animation = 'tkPop ' + (0.7 + Math.random() * 0.5).toFixed(2) +
          's ease-out ' + (0.6 + Math.random() * 0.15).toFixed(2) + 's both';
        host.appendChild(s);
      }
    }

    function showSuccess(data) {
      nameOut.textContent = data.name.split(' ')[0];
      servOut.textContent = data.services;
      var whenEl = $('#booked-when');
      if (whenEl) whenEl.textContent = formatWhen(data.date, data.time);
      form.hidden = true;
      card.hidden = false;
      card.setAttribute('tabindex', '-1');
      // Reflow between unhide and class add, so the keyframes restart every
      // time rather than only on the first booking of the session.
      void card.offsetWidth;
      card.classList.add('is-in');
      firePoppers();
      card.focus();
    }

    function clearErrors() {
      $$('.field', form).forEach(function (f) { f.classList.remove('has-error'); });
      $$('.field__error', form).forEach(function (s) { s.textContent = ''; });
      errorEl.textContent = '';
    }

    // Field-scoped failure: message goes in the slot under `field`, and that
    // field gets the error outline + focus. With no field it falls back to the
    // form-level line (used for submit / network failures only).
    function fail(message, field) {
      clearErrors();
      if (field) {
        var wrap = field.closest('.field');
        wrap.classList.add('has-error');
        var slot = $('.field__error', wrap);
        if (slot) slot.textContent = message;
        field.focus();
      } else {
        errorEl.textContent = message;
      }
    }

    // ── Field constraints & live cleanup ─────────────────────────────
    (function setupFields() {
      var phoneEl = $('#f-phone');
      var dateEl  = $('#f-date');

      // Phone: digits only, hard cap at 10. Runs on every keystroke and on
      // paste, so a pasted "+91 98765 43210" collapses to "9876543210".
      if (phoneEl) {
        phoneEl.addEventListener('input', function () {
          var cleaned = phoneEl.value.replace(/[^0-9]/g, '').slice(0, 10);
          if (cleaned !== phoneEl.value) phoneEl.value = cleaned;
        });
      }

      // Date floor = today (IST); the native picker greys out past days.
      if (dateEl) dateEl.min = localDateStr();

      // Clear a field's error the moment the customer starts fixing it.
      $$('#f-name, #f-phone, #f-date, #f-time', form).forEach(function (el) {
        el.addEventListener('input', function () {
          var wrap = el.closest('.field');
          if (wrap && wrap.classList.contains('has-error')) {
            wrap.classList.remove('has-error');
            var slot = $('.field__error', wrap);
            if (slot) slot.textContent = '';
          }
        });
      });
    })();

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nameEl  = $('#f-name');
      var phoneEl = $('#f-phone');
      var dateEl  = $('#f-date');
      var timeEl  = $('#f-time');
      var name    = nameEl.value.trim();
      var phone   = phoneEl.value.trim();

      if (!name) { fail('Please enter your name.', nameEl); return; }

      if (!phone) { fail('Please enter your phone number.', phoneEl); return; }
      // The field only accepts digits (see input filter) and caps at 10.
      // A valid Indian mobile is exactly 10 digits.
      if (!/^[0-9]{10}$/.test(phone)) {
        fail('Please enter a valid 10-digit phone number.', phoneEl);
        return;
      }

      if (!dateEl.value) { fail('Please choose a date.', dateEl); return; }

      // No bookings in the past. Compare date strings (both YYYY-MM-DD, IST).
      var todayStr = localDateStr();
      if (dateEl.value < todayStr) {
        fail('Please choose today or a later date.', dateEl);
        return;
      }

      if (!timeEl.value) { fail('Please choose a time.', timeEl); return; }

      // Opening hours: 10:00–22:00.
      if (timeEl.value < '10:00' || timeEl.value > '22:00') {
        fail('Please pick a time between 10:00 and 22:00.', timeEl);
        return;
      }

      // If they picked today, the slot can't already have passed.
      if (dateEl.value === todayStr && timeEl.value <= localTimeStr()) {
        fail('That time has already passed today. Please pick a later slot.', timeEl);
        return;
      }

      // Honeypot: a real person never sees this field, so a value means a bot.
      // Show the normal success state so the bot learns nothing, but send nothing.
      var trap = $('#f-company');
      if (trap && trap.value) { showSuccess({ name: name, services: '' }); return; }

      var bookingFor = ($('input[name="bookingFor"]:checked', form) || {}).value || '';
      var services   = $('#f-services-value').value;
      if (!services) {
        fail('Please select at least one service.', $('#f-services-btn'));
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
      var label  = button.textContent;
      button.disabled = true;
      button.classList.add('btn--sending');
      button.textContent = 'Sending';
      errorEl.textContent = '';

      function restore() {
        button.disabled = false;
        button.classList.remove('btn--sending');
        button.textContent = label;
      }

      Promise.resolve(sendBooking(data)).then(function (res) {
        restore();
        if (!res || !res.ok) {
          fail('That didn\u2019t go through. Please call us on +91 72001 05777 instead.');
          return;
        }
        showSuccess(data);
      }).catch(function () {
        restore();
        fail('That didn\u2019t go through. Please call us on +91 72001 05777 instead.');
      });
    });

    if (again) {
      again.addEventListener('click', function () {
        card.hidden = true;
        card.classList.remove('is-in');
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

  /* ── Gallery lightbox ──────────────────────────────────────────────
     Grid tiles become buttons; clicking opens a full-screen viewer with
     prev/next, keyboard nav, swipe, and a focus trap. The dialog markup
     lives at the bottom of the document so it isn't trapped inside any
     transformed ancestor.
     ───────────────────────────────────────────────────────────────── */
  (function () {
    var lb = $('#lightbox');
    if (!lb) return;

    var lbImg   = $('#lb-img');
    var lbCount = $('#lb-count');
    var btnPrev = $('#lb-prev');
    var btnNext = $('#lb-next');
    var btnClose = $('#lb-close');

    // Only tiles that actually have a photo. A slot flagged .is-empty is
    // showing the branded placeholder, so there's nothing to enlarge.
    var slots = $$('.gallery__grid .img-slot').filter(function (slot) {
      var img = $('img', slot);
      return img && !slot.classList.contains('is-empty');
    });
    if (!slots.length) return;

    var shots = slots.map(function (slot) {
      var img = $('img', slot);
      return {
        src: img.currentSrc || img.src,
        alt: img.getAttribute('alt') || '',
        label: slot.getAttribute('data-label') || ''
      };
    });

    var current = 0;
    var lastFocused = null;
    var scrollY = 0;

    slots.forEach(function (slot, i) {
      slot.setAttribute('role', 'button');
      slot.setAttribute('tabindex', '0');
      slot.setAttribute('aria-label', 'View ' + (shots[i].label || shots[i].alt || 'photo') + ' larger');
      slot.addEventListener('click', function () { open(i); });
      slot.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          open(i);
        }
      });
    });

    function render(i) {
      var shot = shots[i];
      lbImg.classList.remove('is-ready');
      // Swap src only once the new file has decoded, so we never flash the
      // previous photo stretched into the new one's aspect ratio.
      var pre = new Image();
      pre.onload = pre.onerror = function () {
        lbImg.src = shot.src;
        lbImg.alt = shot.alt;
        lbImg.classList.add('is-ready');
      };
      pre.src = shot.src;

      lbCount.textContent = (i + 1) + ' / ' + shots.length;
      current = i;
    }

    function go(step) {
      // Wrap around — a gallery shouldn't dead-end on the last photo.
      render((current + step + shots.length) % shots.length);
    }

    function open(i) {
      // Return focus to the tile that was opened, not whatever happened to
      // be focused — a mouse click on a div doesn't always move focus.
      lastFocused = slots[i];
      scrollY = window.scrollY;
      render(i);
      lb.hidden = false;
      // Reflow so the opacity transition actually runs on first open.
      void lb.offsetWidth;
      lb.classList.add('is-open');
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollY + 'px';
      document.body.style.width = '100%';
      btnClose.focus();
    }

    function close() {
      lb.classList.remove('is-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
      var done = function () {
        lb.hidden = true;
        lbImg.removeAttribute('src');
        lb.removeEventListener('transitionend', done);
      };
      if (reduceMotion) done();
      else lb.addEventListener('transitionend', done);
      if (lastFocused) lastFocused.focus();
    }

    btnPrev.addEventListener('click', function () { go(-1); });
    btnNext.addEventListener('click', function () { go(1); });
    btnClose.addEventListener('click', close);

    // Click the backdrop (but not the photo or a control) to dismiss.
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb__fig')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowLeft') { go(-1); return; }
      if (e.key === 'ArrowRight') { go(1); return; }
      if (e.key === 'Tab') {
        // Focus trap: three controls, cycled manually.
        var order = [btnClose, btnPrev, btnNext];
        var idx = order.indexOf(document.activeElement);
        e.preventDefault();
        var next = e.shiftKey ? idx - 1 : idx + 1;
        if (idx === -1) next = 0;
        order[(next + order.length) % order.length].focus();
      }
    });

    // Swipe. This is a mobile-heavy site, so it matters more than the arrows.
    var touchX = null, touchY = null;
    lb.addEventListener('touchstart', function (e) {
      touchX = e.changedTouches[0].clientX;
      touchY = e.changedTouches[0].clientY;
    }, { passive: true });

    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      // Ignore mostly-vertical drags so a scroll gesture doesn't page photos.
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      touchX = touchY = null;
    }, { passive: true });
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

     The wall currently holds 14 hand-picked reels — image and permalink
     are baked into the HTML, so it works with no network call and no
     third-party dependency. Setting IG_FEED_URL swaps that for a live
     feed that refreshes itself as new posts go up; leave it blank to
     keep the curated set. Editing a tile by hand is just a matter of
     changing its href and img src in the markup below.
     ───────────────────────────────────────────────────────────────── */
  (function () {
    var IG_FEED_URL = 'https://feeds.behold.so/Q4r6C0Yztql7o4tpx2MC'; // blank = use the curated tiles in the HTML

    if (!IG_FEED_URL) return;
    var tiles = $$('.ig-wall__tile');
    if (!tiles.length) return;

    fetch(IG_FEED_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var posts = (data && data.posts) || (Array.isArray(data) ? data : []);
        if (!posts.length) return;

        // Which tiles get live posts, by their 1-based position in the wall.
        // The feed returns 6 posts; these land on the middle two columns plus
        // the top of the last column, so the live content sits centre-right
        // rather than clustering on the left. Every other tile keeps its
        // existing curated image and permalink baked into the HTML.
        // Tiles (1-based): 5, 6, 9, 10, 12, 13  →  0-based indices below.
        var LIVE_TILES = [4, 5, 8, 9, 11, 12];

        LIVE_TILES.forEach(function (tileIndex, postIndex) {
          var tile = tiles[tileIndex];
          var p = posts[postIndex];
          if (!tile || !p) return;

          // Always use the Behold-cached still (sizes.*). These are stable
          // JPGs — even for VIDEO/reel posts, where sizes holds the thumbnail
          // frame. thumbnailUrl/mediaUrl are raw cdninstagram URLs that expire,
          // so they're last-resort fallbacks only.
          var src =
            (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) ||
            (p.sizes && p.sizes.large && p.sizes.large.mediaUrl) ||
            (p.sizes && p.sizes.small && p.sizes.small.mediaUrl) ||
            p.thumbnailUrl || p.mediaUrl;

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
      inner.style.transform = 'translateY(calc(24vh + ' + (y * 0.28) + 'px))';
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

  /* ── Mobile card-stack scroll ──────────────────────────────────────
     On viewports ≤860px (and only when reduced-motion is OFF), the main
     sections become a horizontally-sliding card stack driven by scroll.
     Built and torn down live via matchMedia so rotating a phone or
     resizing a desktop window stays correct. Desktop is never touched.
     ───────────────────────────────────────────────────────────────── */
  (function () {
    var mq = window.matchMedia('(max-width: 860px)');
    var rm = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Which sections become cards, in order. Marquee stays out (decorative).
    // On mobile, About is intentionally NOT its own card — its "Our story"
    // block is merged into the Services card (see build()), and Why-choose-us
    // / Achievements are dropped entirely. So About is excluded here.
    var SECTION_IDS = ['hero', 'services', 'gallery', 'pricing', 'book', 'contact'];

    var main = $('#main');
    if (!main) return;

    // Extra scroll (px) a card holds fully in place AFTER its content is read
    // and BEFORE the next card starts sliding in. Higher = more delay before
    // the next section arrives. Purely a scroll-runway value; it never changes
    // any card or section height.
    var DWELL = 420;

    var built = false;
    var stack, stage, cards = [], dims = [], dots = [], dotsWrap;
    var cue = $('.hero__cue');
    var rafPending = false;
    var placeholders = [];   // comment nodes marking original positions
    var storyNode = null;    // "Our story" block cloned into the services card
    var igNode = null;       // Instagram grid appended to the contact card
    var reviewsNode = null;  // reviews section moved into the contact card
    var reviewsMark = null;  // placeholder for the reviews' original spot
    var stackTop = 0;        // document offset of the stack's top edge
    var vhCache = 0;
    var starts = [];         // scroll offset (px) where each card's budget begins
    var extras = [];         // per-card internal read distance (px)
    var inners = [];         // per-card scrollable inner element (or null)

    function headerStrip(isHero) {
      var head = document.createElement('div');
      head.className = 'card__head';

      var brand = document.createElement('a');
      brand.className = 'card__brand';
      brand.href = '#hero';
      brand.setAttribute('aria-label', "Studie'o7 home");
      // Two logos: light for the hero gradient, dark for solid strips.
      brand.innerHTML =
        '<img class="card__brand-light" src="assets/logo.png" alt="Studie\'o7" width="440" height="141">' +
        '<img class="card__brand-dark" src="assets/logo-sm.png" alt="Studie\'o7" width="440" height="141">';

      var toggle = document.createElement('button');
      toggle.className = 'card__toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', 'nav-menu');
      toggle.setAttribute('aria-label', 'Open menu');
      toggle.innerHTML = '<span class="nav__bar"></span><span class="nav__bar"></span><span class="nav__bar"></span>';
      toggle.addEventListener('click', function () {
        var menu = $('.nav__menu');
        if (!menu) return;
        var open = menu.classList.toggle('is-open');
        // Keep every card toggle's state in sync.
        $$('.card__toggle').forEach(function (t) {
          t.setAttribute('aria-expanded', String(open));
          t.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        });
      });

      head.appendChild(brand);
      head.appendChild(toggle);
      return head;
    }

    // On mobile, About isn't its own card. Pull the "Our story" copy from
    // the (hidden) About section and append a compact version into the
    // Services card, so scrolling Services reveals the story right after the
    // service tiles. Cloned (not moved) so desktop's About stays intact.
    function mergeStory() {
      var servicesCard = null;
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].classList.contains('card--services')) { servicesCard = cards[i]; break; }
      }
      var about = document.getElementById('about');
      if (!servicesCard || !about) return;
      var copy = about.querySelector('.about__copy');
      if (!copy) return;

      var wrap = document.createElement('div');
      wrap.className = 'services__story';

      // Take eyebrow, heading, the story paragraphs and the CTA — skip the
      // stats grid and the "since 2017" strip to keep the card compact.
      var eyebrow = copy.querySelector('.eyebrow');
      var heading = copy.querySelector('#about-h');
      if (eyebrow) wrap.appendChild(eyebrow.cloneNode(true));
      if (heading) {
        var h = heading.cloneNode(true);
        h.removeAttribute('id');           // avoid duplicate id with desktop About
        h.removeAttribute('data-rv');
        wrap.appendChild(h);
      }
      copy.querySelectorAll(':scope > p').forEach(function (para) {
        if (para.classList.contains('eyebrow')) return;   // already added above
        var c = para.cloneNode(true);
        c.removeAttribute('data-rv'); c.removeAttribute('data-rv-delay');
        wrap.appendChild(c);
      });
      var cta = copy.querySelector('.about__cta');
      if (cta) {
        var cc = cta.cloneNode(true);
        cc.removeAttribute('data-rv'); cc.removeAttribute('data-rv-delay');
        wrap.appendChild(cc);
      }

      var sec = servicesCard.querySelector(':scope > section');
      if (sec) { sec.appendChild(wrap); storyNode = wrap; }
    }

    function unmergeStory() {
      if (storyNode && storyNode.parentNode) storyNode.parentNode.removeChild(storyNode);
      storyNode = null;
    }

    // Move the real reviews (.quotes) section into the Contact card, between
    // the map and the Instagram wall. We MOVE (not clone) so the existing
    // testimonial carousel JS — which targets #q-text/#q-name by id — keeps
    // driving it. A placeholder marks its original spot for teardown.
    function mergeReviews() {
      var contactCard = null;
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].classList.contains('card--contact')) { contactCard = cards[i]; break; }
      }
      var quotes = document.getElementById('reviews');
      if (!contactCard || !quotes) return;
      var sec = contactCard.querySelector(':scope > section');
      if (!sec) return;
      var inner = sec.querySelector(':scope > .card__inner') || sec;

      reviewsMark = document.createComment('reviews-home');
      quotes.parentNode.insertBefore(reviewsMark, quotes);
      quotes.classList.add('quotes--incard');
      inner.appendChild(quotes);         // sits after the map; IG appended next
      reviewsNode = quotes;
    }

    function unmergeReviews() {
      if (reviewsNode && reviewsMark && reviewsMark.parentNode) {
        reviewsNode.classList.remove('quotes--incard');
        reviewsMark.parentNode.insertBefore(reviewsNode, reviewsMark);
        reviewsMark.parentNode.removeChild(reviewsMark);
      }
      reviewsNode = null; reviewsMark = null;
    }

    // Append the real tilted Instagram wall (the 3D drifting plane, scrim and
    // copy — same as web) to the bottom of the Contact card, below the map.
    // We clone the actual .ig-wall so mobile matches the desktop treatment
    // exactly. The original .ig-wall stays hidden on mobile via CSS.
    function mergeInstagram() {
      var contactCard = null;
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].classList.contains('card--contact')) { contactCard = cards[i]; break; }
      }
      var wall = document.querySelector('.ig-wall');
      if (!contactCard || !wall) return;
      var sec = contactCard.querySelector(':scope > section');
      if (!sec) return;

      // Deep-clone the whole IG wall and mark the clone so mobile CSS can
      // size it to sit inside the card.
      var clone = wall.cloneNode(true);
      clone.classList.add('ig-wall--incard');
      clone.removeAttribute('id');
      // Avoid duplicate ids inside the clone (e.g. #ig-h on the handle).
      clone.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });

      var inner = sec.querySelector(':scope > .card__inner') || sec;
      inner.appendChild(clone);
      igNode = clone;
    }

    function unmergeInstagram() {
      if (igNode && igNode.parentNode) igNode.parentNode.removeChild(igNode);
      igNode = null;
    }

    function build() {
      if (built) return;

      stack = document.createElement('div');
      stack.className = 'cardstack';
      stage = document.createElement('div');
      stage.className = 'cardstack__stage';
      stack.appendChild(stage);

      cards = []; dims = []; placeholders = [];

      SECTION_IDS.forEach(function (id, i) {
        var sec = document.getElementById(id);
        if (!sec) return;

        // Leave a placeholder comment so we can restore exact order later.
        var mark = document.createComment('cardstack:' + id);
        sec.parentNode.insertBefore(mark, sec);
        placeholders.push({ mark: mark, sec: sec });

        var card = document.createElement('div');
        card.className = 'card card--' + id;
        if (id === 'hero') card.classList.add('card--hero');

        var head = headerStrip(id === 'hero');
        var dim = document.createElement('div');
        dim.className = 'card__dim';

        card.appendChild(head);
        card.appendChild(sec);   // moves the section out of flow into the card
        card.appendChild(dim);
        stage.appendChild(card);

        cards.push(card);
        dims.push(dim);
      });

      mergeStory();   // append "Our story" into the Services (what-we-do) card

      // Wrap each non-hero section's children in a .card__inner element we
      // can translate for reading. Hero stays unwrapped (full-bleed image).
      cards.forEach(function (card) {
        if (card.classList.contains('card--hero')) return;
        var sec = card.querySelector(':scope > section');
        if (!sec || sec.querySelector(':scope > .card__inner')) return;
        var inner = document.createElement('div');
        inner.className = 'card__inner';
        while (sec.firstChild) inner.appendChild(sec.firstChild);
        sec.appendChild(inner);
      });

      mergeReviews();     // reviews between the map and the Instagram wall
      mergeInstagram();   // Instagram wall at the very bottom of Contact

      // Insert the stack where the hero used to be (first placeholder).
      var firstMark = placeholders[0].mark;
      firstMark.parentNode.insertBefore(stack, firstMark);

      // Turn on card-stack styling FIRST so sections are constrained to
      // 100svh before we measure their overflow — otherwise scrollHeight
      // reflects each section's full natural height and the read budget
      // becomes wildly too large (blank space appears mid-card).
      document.documentElement.classList.add('cardstack-on');

      // Progress dots.
      dotsWrap = document.createElement('div');
      dotsWrap.className = 'cardstack__dots';
      dotsWrap.setAttribute('aria-hidden', 'true');
      dots = cards.map(function () {
        var d = document.createElement('i');
        dotsWrap.appendChild(d);
        return d;
      });
      document.body.appendChild(dotsWrap);

      built = true;

      // measure() computes each card's scroll budget and sets stack height.
      // Run once now, then again on the next frame and on full load so late
      // layout (fonts, lazy images) can't leave the budget stale.
      measure();
      requestAnimationFrame(function () { if (built) { measure(); update(); } });
      window.addEventListener('load', onLoadMeasure);

      window.addEventListener('scroll', onScroll, { passive: true });
      document.addEventListener('click', onAnchorClick, true);
      update();
    }

    function onLoadMeasure() { if (built) { measure(); update(); } }

    function teardown() {
      if (!built) return;

      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('load', onLoadMeasure);
      document.removeEventListener('click', onAnchorClick, true);

      unmergeStory();
      unmergeReviews();
      unmergeInstagram();

      // Move each section back to its original spot, then drop the scaffold.
      placeholders.forEach(function (p) {
        var sec = p.sec;
        // Unwrap .card__inner: move its children back up and remove it.
        var wrap = sec && sec.querySelector(':scope > .card__inner');
        if (wrap) {
          wrap.style.transform = '';
          while (wrap.firstChild) sec.insertBefore(wrap.firstChild, wrap);
          sec.removeChild(wrap);
        }
        p.mark.parentNode.insertBefore(sec, p.mark);
        p.mark.parentNode.removeChild(p.mark);
      });
      if (stack && stack.parentNode) stack.parentNode.removeChild(stack);
      if (dotsWrap && dotsWrap.parentNode) dotsWrap.parentNode.removeChild(dotsWrap);

      document.documentElement.classList.remove('cardstack-on');
      document.documentElement.style.removeProperty('--stage-h');
      cards = []; dims = []; dots = []; placeholders = [];
      starts = []; extras = []; inners = [];
      built = false;
    }

    // Lay out each card's scroll budget. A card occupies:
    //   [start, start+vh]          → slide-in (previous card covers it)
    //   [start+vh, start+vh+extra] → HOLD & READ (section scrolls internally)
    //   next card slides in only AFTER the read completes.
    // Reading is driven by setting the section's native scrollTop (not a
    // transform) so sticky headers, inner scrollers and dynamically-rendered
    // lists all lay out correctly. Guarantees the next section never appears
    // until the current one is fully scrolled — same in reverse. Sets height.
    function measure() {
      // Single source of truth for card height: the sticky stage's actual
      // rendered height. On mobile, window.innerHeight fluctuates with the
      // URL bar while CSS 100svh is the *small* viewport, so the two disagree
      // and leave a gap at the bottom of each card. We instead read the real
      // stage height and pin it as --stage-h so every card, and the scroll
      // budget below, use the exact same pixel value — no gap in any URL-bar
      // state. Temporarily clear the pin so the stage resolves its natural
      // (100svh) height first, then lock it in.
      document.documentElement.style.removeProperty('--stage-h');
      var vh = Math.round(stage.getBoundingClientRect().height) ||
               window.innerHeight || document.documentElement.clientHeight;
      document.documentElement.style.setProperty('--stage-h', vh + 'px');
      vhCache = vh;
      starts = []; extras = []; inners = [];

      var acc = 0;
      for (var i = 0; i < cards.length; i++) {
        var sec = cards[i].querySelector(':scope > section, :scope > .hero');
        var wrap = sec ? sec.querySelector(':scope > .card__inner') : null;
        var extra = 0;
        if (sec) {
          if (wrap) wrap.style.transform = '';   // reset before measuring
          var cs = window.getComputedStyle(sec);
          var padT = parseFloat(cs.paddingTop) || 0;
          var padB = parseFloat(cs.paddingBottom) || 0;
          var avail = vh - padT - padB;
          var contentH = wrap ? wrap.scrollHeight : (sec.scrollHeight - padT - padB);
          extra = Math.max(0, Math.round(contentH - avail));
          if (extra < 24) extra = 0;
          cards[i].classList.toggle('card--scroll', extra > 0);
        }
        inners.push(wrap || null);
        extras.push(extra);
        starts.push(acc);
        // Budget per card = read distance (extra) + a fixed DWELL where the
        // card sits fully in place before the next one begins sliding in.
        // DWELL delays the next section without touching any card/section
        // height — it only lengthens the scroll runway.
        acc += vh + extra + DWELL;
      }
      stack.style.height = (acc + vh) + 'px';
      stackTop = stack.getBoundingClientRect().top + (window.pageYOffset || 0);
    }

    // Sections live inside absolutely-positioned cards, so they have no
    // scrollable document offset — translate the target id to its card's
    // scroll zone (stackTop + index × viewport) and scroll there instead.
    function onAnchorClick(e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (!id) return;

      // #about is merged into Services on mobile — send those links there.
      if (id === 'about') id = 'services';

      var idx = SECTION_IDS.indexOf(id);
      // A link may point at an element nested inside a card (not the card's
      // own id) — resolve by walking up to the nearest .card.
      if (idx === -1) {
        var target = document.getElementById(id);
        var card = target && target.closest && target.closest('.card');
        if (card) idx = cards.indexOf(card);
      }
      if (idx === -1) return;   // not a carded section — let the browser handle it

      e.preventDefault();
      var behavior = rm.matches ? 'auto' : 'smooth';
      // Land at the card's read start (just after slide-in completes).
      window.scrollTo({ top: Math.round(stackTop + (starts[idx] || 0)), behavior: behavior });

      // Close the mobile menu if it was open.
      var menu = $('.nav__menu');
      if (menu && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        $$('.card__toggle').forEach(function (t) {
          t.setAttribute('aria-expanded', 'false');
          t.setAttribute('aria-label', 'Open menu');
        });
      }
    }

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

    // Reveal a card's [data-rv] elements with their staggered delay. Used by
    // the stack because the page's IntersectionObserver can't see elements
    // inside off-screen (translated) cards.
    function revealCard(card) {
      var els = card.querySelectorAll('[data-rv]');
      for (var i = 0; i < els.length; i++) {
        (function (el) {
          if (el.classList.contains('is-revealed')) return;
          var delay = rm.matches ? 0 : (parseInt(el.getAttribute('data-rv-delay') || '0', 10) || 0);
          setTimeout(function () { el.classList.add('is-revealed'); }, delay);
        })(els[i]);
      }
    }

    function update() {
      rafPending = false;
      if (!built) return;

      var vh = vhCache || window.innerHeight;
      var st = (window.pageYOffset || document.documentElement.scrollTop) - stackTop;
      if (st < 0) st = 0;

      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var start = starts[i];
        var extra = extras[i] || 0;
        var local = st - start;   // scroll position within THIS card's budget

        // Slide-in: card i covers card i-1 as st moves through the previous
        // card's final viewport, i.e. from (start - vh) up to start.
        var pIn = clamp((st - (start - vh)) / vh, 0, 1);

        // Read: once fully in (local >= 0), the next `extra` px translate the
        // content up. The stack does NOT advance during this window, so the
        // next card is held back until the read finishes.
        var read = clamp(local, 0, extra);

        // Slide-out: after the read, the card HOLDS in place for DWELL px
        // (nothing moves), THEN card i+1 begins sliding in over the following
        // viewport. So the cover progress starts at (extra + DWELL).
        // The LAST card has nothing sliding over it, so it must not scale or
        // dim away at the end — otherwise it visibly shrinks/fades into blank.
        var isLast = (i === cards.length - 1);
        var pOut = isLast ? 0 : clamp((local - extra - DWELL) / vh, 0, 1);

        card.style.transform =
          'translateX(' + ((1 - pIn) * 102) + '%) scale(' + (1 - 0.07 * pOut) + ')';
        card.style.boxShadow = (pIn > 0 && pIn < 1)
          ? '-30px 0 60px rgba(24, 53, 31, .4)' : 'none';

        // Play each card's staggered data-rv reveal as it slides into view.
        // The global IntersectionObserver can't see these — the cards are
        // translated off-screen, so intersection never fires — so the card
        // stack drives the reveal itself, once, when the card is ~40% in.
        if (pIn > 0.4 && !card._revealed) {
          card._revealed = true;
          revealCard(card);
        }

        var inner = inners[i];
        if (inner) inner.style.transform = read > 0 ? 'translateY(' + (-read) + 'px)' : '';

        dims[i].style.opacity = (pOut * 0.35).toFixed(3);
      }

      // Active dot = card whose budget currently contains st.
      var active = 0;
      for (var k = 0; k < starts.length; k++) {
        var end = (k + 1 < starts.length) ? starts[k + 1] : Infinity;
        if (st >= starts[k] && st < end) { active = k; break; }
        if (st >= starts[k]) active = k;
      }
      for (var j = 0; j < dots.length; j++) {
        dots[j].classList.toggle('is-active', j === active);
      }

      if (cue) cue.classList.toggle('is-hidden', st > 40);
    }

    function onScroll() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(update);
    }

    function sync() {
      if (mq.matches && !rm.matches) build();
      else teardown();
    }

    // matchMedia change listeners (addEventListener where supported).
    if (mq.addEventListener) { mq.addEventListener('change', sync); rm.addEventListener('change', sync); }
    else { mq.addListener(sync); rm.addListener(sync); }
    // Re-measure on genuine layout changes (orientation / width), but ignore
    // the constant height jitter mobile browsers emit as the URL bar shows and
    // hides — re-pinning --stage-h on every one of those would make the cards
    // visibly jump. Width is stable across URL-bar changes, so we key off it.
    var resizeT, lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      if (!built) return;
      var w = window.innerWidth;
      if (w === lastW) return;   // height-only change (URL bar) → ignore
      lastW = w;
      clearTimeout(resizeT);
      resizeT = setTimeout(function () { measure(); update(); }, 120);
    }, { passive: true });

    // Orientation change does need a re-measure even though width may settle
    // asynchronously — handle it explicitly after the viewport stabilises.
    window.addEventListener('orientationchange', function () {
      if (!built) return;
      setTimeout(function () { lastW = window.innerWidth; measure(); update(); }, 250);
    });

    sync();
  })();

})();
