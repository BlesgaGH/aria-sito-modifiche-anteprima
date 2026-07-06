# Attivazione HSTS + CSP nel `.htaccess` di produzione

**Data:** 2026-07-06
**Autore:** Claude Code (su richiesta di Gianfranco Camuncoli)
**Stato:** ✅ Completato (2026-07-06). Rollout eseguito: HSTS attivo (senza `includeSubDomains`); CSP prima in Report-Only, console verificata pulita in produzione → ora **CSP bloccante attiva**; aggiunto anche header **Permissions-Policy** (hardening). Riga Report-Only conservata commentata come rollback. Resta solo: ricaricare il `.htaccess` finale su Aruba via FTP.

## Panoramica

Nel `.htaccess` di produzione (`docs/aruba-deploy-files/.htaccess`) ci sono due
header di sicurezza avanzati **già scritti ma commentati**, tenuti spenti al primo deploy:

- **HSTS** (`Strict-Transport-Security`) — forza il browser a usare solo HTTPS sul dominio.
- **CSP** (`Content-Security-Policy`) — limita da quali origini la pagina può caricare
  risorse (script, stili, immagini, iframe…), mitigando XSS e injection.

Obiettivo: **attivarli in modo sicuro e graduale**, senza rompere mappa, form, loghi,
hover icone o lo sfondo animato della hero.

> ⚠️ Entrambi sono modifiche delicate:
> - **HSTS è difficile da revocare**: una volta che il browser lo riceve, per la durata
>   `max-age` rifiuterà l'HTTP anche se lo ridisattivi sul server.
> - **CSP troppo stretta rompe la pagina** in modo silenzioso (le risorse bloccate
>   semplicemente non caricano). Per questo si testa prima in modalità "solo report".

## Audit svolto (base delle scelte)

Ho verificato cosa carica realmente il sito, direttiva per direttiva:

| Risorsa reale | Direttiva | Copre? |
|---|---|---|
| CSS esterno + attributi `style="…"` inline | `style-src 'self' 'unsafe-inline'` | ✅ |
| `main.js` (nessun `fetch`/XHR, tutto same-origin) | `script-src 'self'` | ✅ |
| Font `.woff2` self-hosted | `font-src 'self'` | ✅ |
| Loghi clienti + immagini (tutte locali) + `data:` | `img-src 'self' data:` | ✅ |
| Mappa Google: `iframe` con `src=https://www.google.com/maps?...&output=embed` | `frame-src https://www.google.com` | ✅ combacia |
| JSON-LD `<script type="application/ld+json">` | data block, non eseguibile → non soggetto a `script-src` | ✅ |
| Link esterni (`doi.org`, siti clienti, Google privacy) | sono `<a href>` di navigazione → la CSP non li governa | ✅ |
| Form contatti (`mailto:` via `window.location`) | non è un submit HTTP; `form-action 'self' mailto:` innocuo | ✅ |

**Conclusione:** la CSP pre-scritta è corretta. **Unico attrito:** gli handler inline
`onerror="this.remove()"` sui loghi clienti in `index.html` e `en/index.html`. Con una
`script-src` senza `'unsafe-inline'` gli handler inline sono bloccati. Poiché tutti i loghi
esistono, l'`onerror` in pratica non scatta mai → **impatto reale trascurabile**; resta però
un'incoerenza. Vedi "Decisione B".

## Approccio tecnico

### HSTS
Attivare l'header, ma con due accortezze rispetto alla riga pre-scritta:
1. **Rimuovere `includeSubDomains`** (almeno all'inizio): applicherebbe l'obbligo HTTPS a
   *tutti* i sottodomini (es. eventuale `webmail.aria.srl`, `ftp.aria.srl`). Se anche uno solo
   non gestisse bene l'HTTPS, si romperebbe ed è difficile da revocare. Si potrà aggiungere
   dopo, verificati i sottodomini.
2. Il sito è su HTTPS+www stabile da ~1 settimana, quindi `max-age` di 1 anno è accettabile.
   In alternativa prudente: partire con `max-age=86400` (1 giorno), verificare, poi alzare.

Riga proposta (senza `includeSubDomains`):
```apache
Header always set Strict-Transport-Security "max-age=31536000"
```

### CSP — rollout in 2 tempi (consigliato)
1. **Fase test — `Content-Security-Policy-Report-Only`:** stessa policy ma in modalità
   *report*: il browser **non blocca**, segnala solo in console le eventuali violazioni.
   Si carica, si visitano tutte le pagine (mappa, form, hover icone, hero animata, caroselli
   loghi, IT+EN) e si controlla la console. Zero violazioni = policy sicura.
2. **Fase attiva — `Content-Security-Policy`:** confermato che non ci sono violazioni, si
   passa alla versione che blocca davvero.

Policy (identica alla pre-scritta, già validata dall'audit):
```
default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src https://www.google.com; connect-src 'self'; base-uri 'self'; form-action 'self' mailto:; object-src 'none'
```

## Decisioni da prendere

- **Decisione A — HSTS `includeSubDomains`:** consiglio **NO** all'inizio (più sicuro).
  Confermi?
- **Decisione B — handler `onerror` sui loghi:** tre opzioni.
  - **B1 (consigliata, minima):** lasciarli come sono e attivare comunque la CSP. Non rompono
    nulla (i loghi caricano); l'unica conseguenza è che, *se* un domani un file logo mancasse,
    l'immagine rotta non verrebbe auto-nascosta. Nessuna modifica extra.
  - **B2 (pulita ma invasiva):** spostare la logica di fallback dentro `main.js` (rimuovere gli
    `onerror` dall'HTML). Mantiene CSP severa *e* il fallback, ma richiede di editare
    `index.html` + `en/index.html` + `main.js` e **aggiornare il `?v=` di `main.js` su tutte
    le ~30 pagine** (convenzione cache-busting).
  - **B3:** rimuovere gli `onerror` senza sostituirli (i loghi esistono tutti). Edita solo 2
    file, niente cache-bump, ma si perde il fallback difensivo.
- **Decisione C — rollout CSP:** consiglio la **fase test Report-Only** prima di quella attiva
  (un giro FTP in più, ma azzera il rischio di rompere in produzione). In alternativa, visto
  l'audit, si può andare diretti alla CSP attiva. Preferenza?

## File che verranno modificati

| File | Azione |
|---|---|
| `docs/aruba-deploy-files/.htaccess` | Decommentare/riscrivere le righe HSTS e CSP secondo le decisioni |
| `index.html`, `en/index.html`, `assets/js/main.js` | **Solo se si sceglie B2/B3** (gestione `onerror`) |
| Tutte le ~30 pagine (`?v=` di `main.js`) | **Solo se si sceglie B2** (cache-busting) |

Nessuna modifica a contenuti, layout, sitemap o robots.

## Passi di implementazione

1. (Se B2/B3) Gestire gli `onerror` come deciso.
2. Modificare `.htaccess`: attivare HSTS (senza `includeSubDomains` se Decisione A = NO) e la
   CSP (in Report-Only se Decisione C = test).
3. Commit su `main` + push (ricordando `git pull --rebase` per il commit-bot sitemap).
4. **Deploy manuale FTP:** caricare il nuovo `.htaccess` nella webroot di Aruba (sovrascrive).
5. **Verifica in incognito** su tutte le pagine (vedi checklist sotto), console aperta.
6. (Se rollout in 2 tempi) Confermato zero violazioni in Report-Only → cambiare l'header in
   `Content-Security-Policy` attivo, ricaricare, riverificare.

## Checklist di verifica (dopo l'upload)

- [ ] Home IT + EN: hero animata, contatori, carosello loghi scorrono, hover icone card ok.
- [ ] Contatti: la **mappa** compare dopo il click sul consenso (frame-src Google ok).
- [ ] Form contatti: apre il client `mailto:` senza errori.
- [ ] Pagine servizio, brochure, privacy/cookie: stili e font caricati (niente pagina "nuda").
- [ ] **Console del browser:** nessun errore `Refused to load/execute … Content Security Policy`.
- [ ] Header HTTP presenti: verificabile con DevTools → Network → risposta pagina, oppure
      con un checker online (securityheaders.com).
- [ ] HTTPS forzato ancora ok su tutto il dominio (nessun avviso misto).

## Rollback

- **CSP:** se qualcosa si rompe, ricommentare il blocco CSP nel `.htaccess`, ricaricare via FTP.
  Effetto immediato (la CSP non è "persistente" lato browser).
- **HSTS:** più delicato. Per annullarlo in fretta si può reimpostare l'header a
  `max-age=0` e ricaricarlo: i browser che ripassano lo azzerano. Chi non ripassa resta
  vincolato fino alla scadenza. (Motivo per cui partiamo prudenti, senza `includeSubDomains`.)

## Note

- Aggiornare, a operazione conclusa e stabile, il promemoria in cima a `CLAUDE.md`
  (punto "A sito stabile: attivare HSTS e CSP") segnando che sono attivi.
