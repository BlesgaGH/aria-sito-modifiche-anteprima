# Rifiniture post-audit: sicurezza + SEO (pacchetto completo P1+P2+P3)

**Data:** 2026-07-06
**Autore:** Claude Code (su richiesta di Gianfranco Camuncoli)
**Stato:** ✅ Completato (2026-07-06). Decisioni: niente `sameAs` (nessun profilo social attivo); `geo` omesso (il PostalAddress completo è già geocodificato in modo affidabile da Google); in P3.3 `email` + `image`. Verifiche: conteggi esatti (31 bump, 40 onerror rimossi, 12 og:image, 30 twitter:card, 28 BreadcrumbList), 46/46 JSON-LD validi, fallback loghi testato (tile rimossa al dispatch error), mappa ok col nuovo referrerPolicy, console pulita. Nota: i contatori animati non sono attivabili nel pannello anteprima (IntersectionObserver inerte lì, 0/36 reveal anche preesistenti) — verificata l'equivalenza di rendering del nuovo codice (markup identico). Resta: deploy FTP completo.

## Panoramica

Il doppio audit del 2026-07-06 (sicurezza + SEO, agenti dedicati) non ha trovato problemi
gravi ma una serie di rifiniture. Questo intervento le implementa **tutte** (P1+P2+P3),
in un unico giro di commit + un deploy FTP.

---

## P1 — Fallback loghi clienti compatibile con la CSP (sicurezza, media)

**Problema:** la CSP bloccante (`script-src 'self'`) blocca gli handler inline
`onerror="this.remove()"` presenti sui ~20 loghi clienti di `index.html` e `en/index.html`.
Il fallback "nascondi il logo se il file manca" non funziona più in produzione.

**Fix:**
1. Rimuovere tutti gli attributi `onerror="this.remove()"` da `index.html` e `en/index.html`.
2. In `main.js`, nel blocco del carosello (`#clientsTrack`), aggiungere PRIMA della clonazione
   un listener in fase di cattura (l'evento `error` delle immagini non fa bubbling):
   ```js
   track.addEventListener('error', function (e) {
     var img = e.target;
     if (img && img.tagName === 'IMG') {
       var tile = img.closest('.client-tile');
       (tile || img).remove();
     }
   }, true);
   ```
   Nota: rimuovo l'intera `.client-tile` (migliorativo rispetto a `this.remove()` che toglieva
   solo l'`<img>` lasciando un riquadro vuoto o il solo testo).
   Caso limite (immagini fallite prima dell'esecuzione dello script): trascurabile, lo script
   è a fine pagina e i loghi sono `loading="lazy"`.
3. **Cache-busting:** aggiornare `main.js?v=` a `20260706-1` su **tutte le 31 pagine** che lo
   caricano (30 pagine sito + 404.html; le brochure non caricano main.js).

## P2 — Interventi a medio impatto

### P2.1 — `og:image` sulle 12 pagine che ne sono prive (SEO)
Aggiungere nel blocco Open Graph:
```html
<meta property="og:image" content="https://www.aria.srl/assets/img/og-cover.jpg" />
```
su: `chi-siamo.html`, `progetti.html`, `pubblicazioni.html`, `contatti.html`, `privacy.html`,
`cookie-policy.html` + le 6 controparti EN (`en/about.html`, `en/projects.html`,
`en/publications.html`, `en/contact.html`, `en/privacy.html`, `en/cookie-policy.html`).
Il file `assets/img/og-cover.jpg` esiste già.

### P2.2 — JSON-LD `BreadcrumbList` (SEO)
Aggiungere un blocco `<script type="application/ld+json">` con `BreadcrumbList` (2 livelli:
Home → pagina corrente; 3 livelli per le pagine-servizio: Home → Servizi → pagina) sulle
**28 pagine** che hanno il breadcrumb visibile (tutte le interne IT+EN; home e 404 escluse).
URL assoluti su `https://www.aria.srl`, nomi coerenti con il breadcrumb visibile, in lingua.

### P2.3 — Oscurare il nome DB Aruba nel repo pubblico (sicurezza)
In `docs/2026-06-29-guida-deploy-aruba-passo-passo.md` (e in ogni altro doc in `docs/` che lo
citi): sostituire il nome esplicito del DB con formule generiche ("il DB WordPress,
riconoscibile dal prefisso tabelle `ar_`"). La guida resta usabile: il DB si identifica dal
prefisso. (In `CLAUDE.md` è citato ma il file è gitignored → lo sistemo comunque, in locale.)

### P2.4 — Hardening `.htaccess` (3 aggiunte, sicurezza)
Nel `docs/aruba-deploy-files/.htaccess`:
1. `Options -Indexes` (blocca il listing delle directory senza index).
2. Deny sui file di lavoro caricati per errore:
   ```apache
   <FilesMatch "\.(md|bak|sql|log|ini)$">
     Require all denied
   </FilesMatch>
   ```
   (i dotfile `.ht*` sono già protetti da Apache; regola limitata alle estensioni per
   evitare falsi positivi).
3. Aggiungere `frame-ancestors 'self'` alla CSP bloccante (equivalente moderno di
   X-Frame-Options, che resta per i browser datati).

## P3 — Cosmetica e rifiniture

### P3.1 — Title troppo lunghi (4) e description troppo lunghe (5) (SEO)
- Title >60 char da accorciare: `affidabilita-e-manutenibilita.html`,
  `en/reliability-maintainability.html`, `fattori-umani.html`, `en/human-factors.html`.
- Description >160 char da limare: `contatti.html`, `en/contact.html`,
  `en/product-safety.html`, `en/projects.html`, `ambienti-di-lavoro.html`.
- Bonus: allungare leggermente i title corti di `contatti.html` / `en/contact.html`
  con una keyword ("Consulenza analisi rischi").
Riscritture proposte una a una in fase di implementazione, mantenendo keyword e tono.

### P3.2 — Open Graph uniforme + Twitter Card (SEO)
Su tutte le 30 pagine indicizzabili: `og:locale` (it_IT / en_GB), `og:site_name`,
e `<meta name="twitter:card" content="summary_large_image" />`.
(og:title/og:description/og:url già presenti ovunque; og:image coperto da P2.1.)

### P3.3 — JSON-LD home arricchito (SEO)
In `index.html` e `en/index.html` (ProfessionalService): aggiungere `email`
(segreteria@aria.srl), `image` (og-cover) e `geo` (coordinate sede: Via Luigi Colli 24,
Torino ≈ lat 45.0570, lon 7.6720 — da confermare).
`sameAs`: **solo se esiste un profilo social ufficiale** (es. LinkedIn) — vedi
"Domanda aperta" sotto.

### P3.4 — `lastmod` per-file nella sitemap (SEO)
In `tools/generate_sitemap.py`: usare la data dell'ultimo commit git che tocca il file
(`git log -1 --format=%cs -- <file>`), con fallback all'mtime se git non disponibile.
Così i `lastmod` tornano informativi invece di essere tutti identici.
Nota: la GitHub Action fa il checkout del repo, quindi git è disponibile anche lì
(serve `fetch-depth: 0` nel workflow se attualmente è shallow — da verificare).

### P3.5 — Difesa in profondità in `main.js` (sicurezza)
- `animateCount`: sostituire `el.innerHTML = val + '<span>…'` con costruzione DOM
  (`textContent` + `createElement`) — stesso rendering, niente HTML string.
- Iframe mappa: `referrerPolicy` da `no-referrer-when-downgrade` a
  `strict-origin-when-cross-origin` (coerente con l'header globale del sito).

---

## File coinvolti (riepilogo)

| Gruppo | File | Modifica |
|---|---|---|
| P1 | `index.html`, `en/index.html` | rimozione ~40 `onerror` |
| P1 | `assets/js/main.js` | listener error carosello |
| P1 | 31 pagine | bump `main.js?v=20260706-1` |
| P2.1 | 12 pagine | + `og:image` |
| P2.2 | 28 pagine | + JSON-LD BreadcrumbList |
| P2.3 | `docs/2026-06-29-guida-deploy-aruba-passo-passo.md` (+ altri docs se citano il DB) | oscurato nome DB |
| P2.4 | `docs/aruba-deploy-files/.htaccess` | 3 aggiunte hardening |
| P3.1 | 9-11 pagine | title/description ritoccati |
| P3.2 | 30 pagine | OG uniforme + twitter:card |
| P3.3 | `index.html`, `en/index.html` | JSON-LD arricchito |
| P3.4 | `tools/generate_sitemap.py` (+ ev. `.github/workflows/sitemap.yml`) | lastmod per-file |
| P3.5 | `assets/js/main.js` | innerHTML→DOM, referrerPolicy |

Molte pagine ricevono più modifiche insieme (es. una pagina-servizio: breadcrumb JSON-LD +
OG uniforme + bump `?v=`). Nessuna modifica a contenuti visibili salvo P3.1 (title/description,
solo nel `<head>`/SERP).

## Ordine di implementazione

1. P1 (main.js + onerror + bump `?v=`) — poi verifica in anteprima locale.
2. P2.4 + P2.3 (htaccess + docs) — non toccano le pagine.
3. P2.1, P2.2, P3.1, P3.2, P3.3 (passata unica per pagina, così ogni file si tocca una volta).
4. P3.4 (script sitemap) + rigenerazione `sitemap.xml` locale per test.
5. P3.5 (main.js, già bumpato in P1).
6. Verifica completa in anteprima (console pulita, carosello ok, mappa ok, form ok).
7. Commit su `main` (uno o due commit logici) + `git pull --rebase` + push.
8. **Deploy FTP:** upload di tutte le pagine modificate + `assets/js/main.js` + `.htaccess`
   + `sitemap.xml` (passaggio manuale utente, come sempre).
9. Verifica in produzione (incognito + console; ricontrollo securityheaders.com).

## Domanda aperta (non blocca l'approvazione)

- **ARIA ha un profilo LinkedIn (o altro social) ufficiale?** Se sì, passami l'URL e lo
  inserisco in `sameAs` nel JSON-LD (P3.3). Se no, ometto `sameAs`.
- **Coordinate sede:** uso lat 45.0570 / lon 7.6720 per Via Luigi Colli 24, Torino
  (verificate su mappa); se preferisci ometto `geo`.

## Rischi e mitigazioni

- **Tante pagine toccate** → modifiche meccaniche e ripetitive, verificate con grep di
  controllo (conteggi attesi: 31 bump, 12 og:image, 28 breadcrumb, 30 twitter:card).
- **JSON-LD nuovo** → validazione sintattica (parse JSON) su ogni blocco generato.
- **`.htaccess`** → FilesMatch limitato a estensioni non usate dal sito pubblico;
  rollback = rimozione delle 3 righe.
- **Sitemap con git** → fallback a mtime se git assente; test locale prima del push.
