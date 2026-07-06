/* ===== ARIA Srl — interazioni ===== */
(function () {
  'use strict';

  /* Anno corrente nel footer */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* Header sticky: cambia stile dopo lo scroll */
  var header = document.getElementById('header');
  function onScroll() {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menu mobile */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Mappa Google: caricamento solo al click (consenso GDPR / ePrivacy) */
  var loadMapBtn = document.getElementById('loadMapBtn');
  if (loadMapBtn) {
    loadMapBtn.addEventListener('click', function () {
      var consent = document.getElementById('mapConsent');
      var frame = document.getElementById('mapFrame');
      var src = frame.getAttribute('data-src');
      var title = frame.getAttribute('data-title') || 'Mappa sede ARIA Srl';
      var ifr = document.createElement('iframe');
      ifr.title = title;
      ifr.loading = 'lazy';
      ifr.referrerPolicy = 'strict-origin-when-cross-origin';
      ifr.src = src;
      frame.appendChild(ifr);
      consent.style.display = 'none';
      frame.hidden = false;
    });
  }

  /* Scroll reveal */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (e.isIntersecting) {
          var el = e.target;
          setTimeout(function () { el.classList.add('in'); }, (i % 6) * 70);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Contatori animati */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var raw = el.getAttribute('data-raw') === 'true'; // numero "fisso" (es. anno)
    if (raw) { el.textContent = target; return; }
    var dur = 1500, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.floor(eased * target);
      /* Costruzione DOM (niente innerHTML con stringhe concatenate) */
      el.textContent = String(val);
      if (suffix) {
        var suf = document.createElement('span');
        suf.className = 'suf';
        suf.textContent = suffix;
        el.appendChild(suf);
      }
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('.stat-num');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* Carosello clienti: duplica i loghi per uno scorrimento infinito senza stacchi.
     Fallback loghi mancanti: gestito qui (listener in cattura: l'evento "error"
     delle immagini non risale) perché gli onerror inline sono vietati dalla CSP
     (script-src 'self'). Rimuove l'intera tile, non solo l'immagine. */
  var track = document.getElementById('clientsTrack');
  if (track) {
    track.addEventListener('error', function (e) {
      var img = e.target;
      if (img && img.tagName === 'IMG') {
        var tile = img.closest ? img.closest('.client-tile') : null;
        (tile || img).remove();
      }
    }, true);
    var originals = Array.prototype.slice.call(track.children);
    originals.forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      track.appendChild(clone);
    });
  }

  /* Form contatti: validazione + feedback.
     NB: l'invio reale va collegato a un backend (es. send.php su Aruba o un servizio
     come Formspree). Per ora mostra conferma a video e prepara un fallback mailto. */
  var form = document.getElementById('contactForm');
  if (form) {
    var msg = document.getElementById('formMsg');
    var isEN = (document.documentElement.lang || 'it').toLowerCase().indexOf('en') === 0;
    var T = isEN ? {
      err: 'Please fill in the required fields (name, email, message and consent).',
      subject: 'Enquiry from the website — ',
      ok: 'Thank you! Your email client will open to send the request. Alternatively, write to segreteria@aria.srl.'
    } : {
      err: 'Compila i campi obbligatori (nome, email, messaggio e consenso).',
      subject: 'Richiesta dal sito — ',
      ok: 'Grazie! Si aprirà il tuo programma di posta per inviare la richiesta. In alternativa scrivi a segreteria@aria.srl.'
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.className = 'form-msg';
      if (!form.checkValidity()) {
        msg.textContent = T.err;
        msg.classList.add('err');
        form.reportValidity && form.reportValidity();
        return;
      }
      var servizio = encodeURIComponent(form.servizio.value || '—');
      var testo = encodeURIComponent(form.messaggio.value + '\n\n— ' + form.nome.value + ' (' + form.email.value + ')');
      // Fallback: opens the mail client with prefilled data
      window.location.href = 'mailto:segreteria@aria.srl?subject=' +
        encodeURIComponent(T.subject + decodeURIComponent(servizio)) + '&body=' + testo;
      msg.textContent = T.ok;
      msg.classList.add('ok');
      form.reset();
    });
  }

  /* Sfondo interattivo "mesh" della hero: una griglia che si deforma al passaggio
     del mouse (repulsione + ritorno elastico + attrito). Circoscritta alla hero,
     colori del brand, nitida su schermi Retina, in pausa se non visibile. */
  var canvas = document.getElementById('net');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, cols = 0, rows = 0, pts = [], raf = null, running = false;
    var mouse = { x: -9999, y: -9999, r: 170 }; // raggio d'azione della deformazione

    function initGrid() {
      pts.length = 0;
      var cellW = W / (cols - 1), cellH = H / (rows - 1);
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var ox = c * cellW, oy = r * cellH;
          pts.push({ x: ox, y: oy, ox: ox, oy: oy, vx: 0, vy: 0 });
        }
      }
    }

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(14, Math.round(W / 60)); // densità adattiva (~celle da 60px)
      rows = Math.max(9, Math.round(H / 60));
      initGrid();
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      // Fisica di ogni nodo
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var dx = mouse.x - p.x, dy = mouse.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.r && dist > 0) {                 // repulsione dal mouse
          var force = (mouse.r - dist) / mouse.r;
          var ang = Math.atan2(dy, dx);
          p.vx -= Math.cos(ang) * force * 6;
          p.vy -= Math.sin(ang) * force * 6;
        }
        p.vx += (p.ox - p.x) * 0.07;                      // ritorno elastico
        p.vy += (p.oy - p.y) * 0.07;
        p.vx *= 0.86; p.vy *= 0.86;                       // attrito
        p.x += p.vx; p.y += p.vy;
      }
      // Linee della griglia (acciaio del brand) in un unico path = efficiente
      ctx.strokeStyle = 'rgba(181,196,219,0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var rr = 0; rr < rows; rr++) {
        for (var cc = 0; cc < cols; cc++) {
          var idx = rr * cols + cc;
          if (cc < cols - 1) { ctx.moveTo(pts[idx].x, pts[idx].y); ctx.lineTo(pts[idx + 1].x, pts[idx + 1].y); }
          if (rr < rows - 1) { ctx.moveTo(pts[idx].x, pts[idx].y); ctx.lineTo(pts[idx + cols].x, pts[idx + cols].y); }
        }
      }
      ctx.stroke();
      // Nodi che si illuminano avvicinando il mouse (blu brand)
      for (var k = 0; k < pts.length; k++) {
        var q = pts[k];
        var qx = mouse.x - q.x, qy = mouse.y - q.y;
        var d2 = Math.sqrt(qx * qx + qy * qy);
        if (d2 < mouse.r) {
          ctx.fillStyle = 'rgba(99,179,237,' + (0.9 * (1 - d2 / mouse.r)) + ')';
          ctx.beginPath();
          ctx.arc(q.x, q.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    window.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });
    document.addEventListener('mouseleave', function () { mouse.x = -9999; mouse.y = -9999; });
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    // Anima solo quando la hero è visibile
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { en.isIntersecting ? start() : stop(); });
      }, { threshold: 0 }).observe(canvas);
    }

    size();
    start();
  }
})();
