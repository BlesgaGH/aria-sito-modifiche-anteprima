# Pagina 404 personalizzata

**Data:** 2026-07-06
**Autore:** Claude Code (su richiesta di Gianfranco Camuncoli)
**Stato:** ✅ Completato (2026-07-06) — verificato in anteprima locale: nessun errore console/rete, stili e loghi ok con percorsi assoluti. Resta il deploy FTP su Aruba.

## Panoramica

Il `.htaccess` di produzione contiene `ErrorDocument 404 /404.html`, ma il file
`404.html` **non esiste**. Di conseguenza, quando un utente apre un URL inesistente
(es. un vecchio link WordPress non mappato), Apache ripiega sulla pagina di errore
**generica di Aruba** — spoglia, senza header/footer ARIA e senza modo di tornare al sito.

Obiettivo: creare una pagina `404.html` **brandizzata**, coerente con il resto del sito,
che accolga il visitatore smarrito e lo riporti verso la home o le pagine principali.

> Nota SEO: non cambia nulla lato indicizzazione. Gli URL inesistenti già restituiscono
> il codice HTTP `404` corretto; questa modifica migliora solo l'esperienza utente e l'immagine.

## Approccio tecnico

Pagina statica singola che riusa header, footer e `styles.css` esistenti.

### Punto tecnico chiave: percorsi ASSOLUTI
La pagina 404 viene servita da Apache **mantenendo nella barra l'URL sbagliato** richiesto
dall'utente (es. `www.aria.srl/vecchia/pagina/inesistente`). Se usassi percorsi *relativi*
per CSS/immagini/link, il browser li risolverebbe rispetto a quell'URL rotto → stile e loghi
non caricherebbero. Per questo la 404 userà **percorsi assoluti** (`/assets/css/styles.css`,
`/assets/img/...`, link a `/`, `/servizi.html`, ecc.), a differenza delle altre pagine del sito
che usano percorsi relativi.

### Contenuto
- `<meta name="robots" content="noindex, follow">` — la pagina d'errore non va indicizzata.
- Header identico al sito (logo + nav + lang-switch + bottone Contattaci).
- Sezione centrale: grande "404", titolo **"Pagina non trovata"**, breve testo, e una
  riga di cortesia in inglese ("*Page not found*") — così la stessa pagina serve sia gli
  errori IT sia quelli EN (Apache ha un solo `ErrorDocument` globale).
- Pulsanti/collegamenti di ritorno: **Home**, **Servizi**, **Contatti**.
- Footer identico al sito.
- Versioni cache correnti: `styles.css?v=20260620-3`, `main.js?v=20260616-2` (con percorso assoluto).

### Perché una sola pagina (non anche `en/404.html`)
`ErrorDocument 404 /404.html` è **globale** per tutto il dominio: Apache serve sempre e solo
`/404.html`. Una `en/404.html` non verrebbe mai usata dal server. Rendo quindi la singola
pagina **bilingue-friendly** (IT primario + riga EN).

## File che verranno creati / modificati

| File | Azione |
|---|---|
| `404.html` (root) | **Creato** — la pagina d'errore brandizzata |
| `.htaccess` (produzione) | Nessuna modifica: la riga `ErrorDocument 404 /404.html` già la richiama correttamente |
| `sitemap.xml` | Nessuna modifica: la 404 è `noindex`, non va in sitemap (e il generatore esclude comunque le pagine non di contenuto) |
| `robots.txt` | Nessuna modifica |

Nessuna modifica a `styles.css` o `main.js` → **niente cache-busting da aggiornare** altrove.

## Passi di implementazione

1. Creare `404.html` nella root, copiando header/footer da `index.html` ma con **percorsi assoluti**.
2. Aggiungere la sezione centrale d'errore (404 + testo IT + riga EN + pulsanti di ritorno).
3. Verifica locale con server statico: aprire un URL inesistente e controllare che
   la 404 carichi con stile, loghi e link funzionanti.
4. Commit. In produzione la pagina sarà attiva al prossimo upload FTP su Aruba
   (bonus: funziona anche sull'anteprima GitHub Pages, che usa `404.html` di root in automatico).

## Note

- Bug preesistente noto (menu che si sovrappone al logo a ~768px): la 404 eredita header/footer,
  quindi erediterà anche quel comportamento. Non lo affronto qui (fuori scope).
- Deploy su Aruba via FTP: da fare manualmente dall'utente (come per gli altri file), caricando
  `404.html` nella webroot.
