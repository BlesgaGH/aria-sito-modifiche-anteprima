# Sitemap.xml + script di generazione + link in robots.txt

**Data:** 2026-06-20 19:02
**Stato:** ✅ COMPLETATO (2026-06-20)
**Tipo:** Nuova funzionalità (SEO)

## 1. Obiettivo

Creare un file `sitemap.xml` per il sito ARIA, uno script per rigenerarlo automaticamente
quando si aggiungono/rimuovono pagine, e collegarlo nel `robots.txt`. Da applicare sia alla
**copia** (`SITO INTERNET - MODIFICHE`) sia all'**originale** (`SITO INTERNET`).

**Serve davvero?** Sì. Anche per un sito statico la sitemap è utile: aiuta Google/Bing a
scoprire tutte le pagine, segnala quando sono state aggiornate e migliora l'indicizzazione.
È una best practice SEO standard, a basso costo e senza controindicazioni.

## 2. Cosa verrà creato/modificato

| File | Azione | Dove |
|------|--------|------|
| `sitemap.xml` | **creato** (alla radice del sito) | copia + originale |
| `tools/generate_sitemap.py` | **creato** (script Python) | copia + originale |
| `robots.txt` | **modificato** (aggiunta riga `Sitemap:`) | copia + originale |

## 3. Contenuto della `sitemap.xml`

- **URL incluse**: tutte le pagine pubbliche indicizzabili, IT (root) + EN (`en/`):
  home, servizi, chi-siamo, progetti, pubblicazioni, contatti, le 7 pagine-servizio,
  privacy, cookie-policy — e le equivalenti inglesi. **Totale ~30 URL.**
- **URL escluse**: `brochure/` (marcate `noindex`), la cartella `tools/`, eventuali 404.
- **Dominio**: gli URL puntano al dominio di **produzione** `https://www.aria.srl/`
  (coerente con i tag `canonical` già presenti nelle pagine). `index.html` → `/`,
  `en/index.html` → `/en/`, le altre → `/nomefile.html`.
- **Campi per ogni URL**: `<loc>`, `<lastmod>` (data di ultima modifica del file),
  `<changefreq>` e `<priority>` (valori indicativi: home 1.0, sezioni principali 0.8,
  pagine-servizio 0.7, legali 0.3).
- **Lingue IT/EN**: l'hreflang è **già gestito** dai tag `<link rel="alternate" hreflang>`
  nell'`<head>` di ogni pagina (Google li legge da lì), quindi la sitemap resta una lista
  di URL semplice e pulita, senza duplicare quella logica.

## 4. Lo script `tools/generate_sitemap.py`

- **Linguaggio**: Python 3 (solo libreria standard, nessuna dipendenza da installare).
  Python è già usato per il server di anteprima locale.
- **Cosa fa**:
  1. Scansiona la cartella del sito per tutti i file `.html` (root + `en/`).
  2. Esclude `brochure/` e una lista di esclusioni configurabile in cima allo script.
  3. Per ogni pagina calcola l'URL di produzione e la data di modifica del file.
  4. Scrive/sovrascrive `sitemap.xml` alla radice.
- **Come si usa**: dalla cartella del sito, `python tools/generate_sitemap.py`.
  Va eseguito ogni volta che si aggiungono o rimuovono pagine; le nuove pagine vengono
  rilevate automaticamente (non serve elencarle a mano).
- **Configurazione** (variabili in cima allo script): dominio base, lista esclusioni,
  priorità per tipo di pagina.

## 5. Modifica al `robots.txt`

Aggiunta in fondo (preservando il contenuto esistente) della riga:

```
Sitemap: https://www.aria.srl/sitemap.xml
```

## 6. Automazione (opzionale, da decidere)

Lo script è **manuale** per impostazione predefinita (semplice e prevedibile).
Se in futuro vuoi l'aggiornamento **totalmente automatico**, si può aggiungere una
**GitHub Action** che a ogni push rigenera la sitemap e la committa. Lo lascio come
possibile estensione futura, non incluso in questa implementazione salvo tua richiesta.

## 7. Pubblicazione

- **Copia**: dopo la generazione faccio commit + push → la sitemap diventa subito attiva
  sull'anteprima online (e raggiungibile a `.../sitemap.xml`).
- **Originale**: aggiungo i file nella cartella. ⚠️ **Da decidere**: faccio anche commit +
  push sul repo privato originale (`aria-sito-anteprima`), oppure lascio solo i file in
  locale e deciderai tu quando pubblicarli? (In una risposta precedente avevi detto che
  l'originale "non va toccato" come repo.)

## 8. Punti che richiedono una tua conferma

1. **OK sull'approccio generale** descritto sopra?
2. **Script in Python** va bene? (alternative: PowerShell, Node.js)
3. **Repo originale**: committo+pusho anche lì, o solo file in locale?
4. **GitHub Action** di auto-aggiornamento: la vuoi ora o la lasciamo per dopo?

---

## Implementazione realizzata

**Decisioni approvate:** approccio OK · script in Python · aggiornato anche l'originale (solo stavolta) · GitHub Action inclusa subito. Per il `robots.txt` si è scelto di **mantenere `Disallow: /`** (l'anteprima resta non indicizzata) aggiungendo solo la riga `Sitemap:`.

**File creati/modificati (copia + originale):**
- `tools/generate_sitemap.py` — script che scansiona le `.html`, esclude `brochure/`, `tools/`, `assets/`, `docs/` e cartelle nascoste, e genera la sitemap.
- `sitemap.xml` — 30 URL (15 IT + 15 EN), dominio `https://www.aria.srl`, con `lastmod`/`changefreq`/`priority`. `index.html` → `/`, `en/index.html` → `/en/`.
- `robots.txt` — aggiunta `Sitemap: https://www.aria.srl/sitemap.xml`.
- `.github/workflows/sitemap.yml` — rigenera e committa la sitemap a ogni push di file `.html` (trigger su `**.html` → nessun loop).

**Pubblicazione:**
- Copia → commit `5571e27`, push su `aria-sito-modifiche-anteprima`. Verificato live: `sitemap.xml` HTTP 200 con 30 URL, `robots.txt` corretto.
- Originale → commit `8da19a3`, push su `aria-sito-anteprima` (commit selettivo: le modifiche preesistenti non correlate sono rimaste non committate).

**Nota per la produzione (Aruba / aria.srl):** al go-live ricordarsi di togliere `Disallow: /` dal `robots.txt`, altrimenti il sito resta invisibile a Google nonostante la sitemap.
