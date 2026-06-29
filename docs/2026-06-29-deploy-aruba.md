# Deploy del sito ARIA su Aruba (produzione — sostituzione di aria.srl)

**Data:** 2026-06-29 14:58
**Stato:** 🟢 PREPARAZIONE COMPLETATA — pronto per l'esecuzione manuale del deploy
**Tipo:** Messa in produzione / deploy
**Origine:** repo `BlesgaGH/aria-sito-modifiche-anteprima` (cartella `SITO INTERNET - MODIFICHE`)
**Destinazione:** hosting Aruba di `aria.srl`, via **FTP/FTPS**, **sostituzione diretta** del sito attuale (previo backup)

### Decisioni prese (2026-06-29) e stato preparazione
- ✅ **Quick win SEO applicati al repo**: arricchimento keyword (SCIP/imballaggi-packaging) nelle meta description + JSON-LD delle pagine prodotto; `og:image` aggiunto a tutte le pagine della sezione Servizi (8 IT + 8 EN). *Saltata* la differenziazione del title cookie-policy EN (impatto nullo, l'unica forma "(EN)" sarebbe peggiorativa).
- ✅ **File di produzione pronti** in `docs/aruba-deploy-files/`: `.htaccess` e `robots.txt` (versione `Allow: /`) + `LEGGIMI.md`. Da caricare in webroot via FTP.
- ✅ **CSP**: inclusa nel `.htaccess` ma **commentata** ("livello 2") — attivare dopo il primo deploy verificato.
- ✅ **robots.txt del repo**: lasciato `Disallow: /` (l'anteprima GitHub Pages resta fuori da Google); la versione `Allow: /` è solo nel file in `docs/aruba-deploy-files/` da caricare su Aruba.
- ⏳ **HSTS**: lasciato commentato nel `.htaccess`, in attesa di decisione dell'utente (vedi §11.4).

---

## 1. Obiettivo

Pubblicare in produzione su Aruba la versione aggiornata del sito (modifiche estetiche + SEO + nuovi contenuti ATEX e ICIM Group), sostituendo l'attuale `aria.srl`, senza downtime significativo e con possibilità di rollback.

## 2. Scenario e assunzioni

- **Hosting:** Aruba Linux condiviso (Apache) → supporta `.htaccess`.
- **Upload:** client FTP/FTPS (es. FileZilla). Nessun git/SSH lato server.
- **Dominio:** `aria.srl` è **già attivo** e puntato all'hosting; HTTPS già presente (il sito attuale è online). Quindi DNS e certificato **non** vanno creati da zero — solo verificati.
- **Dominio canonico:** le pagine usano `canonical`/`hreflang` su `https://www.aria.srl` (**con www**). Il deploy deve garantire che `www` + `https` siano la forma servita (redirect dalle altre varianti).
- **Sito 100% statico:** nessun build, nessun runtime server. Si caricano i file così come sono.

## 3. Informazioni da reperire prima di iniziare

| Cosa | Dove trovarla |
|------|---------------|
| Host FTP, utente, password, porta | Pannello Aruba → sezione Hosting/FTP (o email di attivazione) |
| FTPS sì/no (consigliato) | Pannello Aruba; preferire FTP **esplicito su TLS** se disponibile |
| Percorso della webroot | Tipicamente `/` della home FTP, oppure cartella `htdocs/` o `www/` — **da verificare** caricando un file di test |
| Stato certificato HTTPS | Pannello Aruba → SSL/TLS (verificare validità e copertura `www` + dominio nudo) |

> ⚠️ **Non procedere finché la webroot non è identificata con certezza** (vedi §6, passo "file di test").

## 4. Modifiche ai file DA FARE PRIMA dell'upload (nel repo)

Queste sono le uniche modifiche di contenuto/configurazione necessarie per la produzione. **Vanno fatte e committate prima** di scaricare i file da caricare.

### 4.1 🔴 OBBLIGATORIO — `robots.txt` (sblocco indicizzazione)
Attualmente (volutamente, per l'anteprima):
```
User-agent: *
Disallow: /

Sitemap: https://www.aria.srl/sitemap.xml
```
Versione di **produzione**:
```
User-agent: *
Allow: /

Sitemap: https://www.aria.srl/sitemap.xml
```
> Senza questa modifica Google **non indicizza** il sito. È l'unico vero blocco (confermato da audit SEO e security review).

### 4.2 🟠 CONSIGLIATO — creare `.htaccess` nella webroot
Apache su Aruba lo supporta; GitHub Pages no (quindi va creato ex-novo per la produzione). Contenuto proposto in due livelli:

**Livello 1 — sicuro, da attivare subito** (redirect canonico + header base):
```apache
# --- HTTPS + www (forma canonica del sito) ---
RewriteEngine On
# forza HTTPS
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://www.aria.srl%{REQUEST_URI} [L,R=301]
# forza www
RewriteCond %{HTTP_HOST} !^www\. [NC]
RewriteRule ^ https://www.aria.srl%{REQUEST_URI} [L,R=301]

# --- Security header (sicuri, nessun rischio di rottura) ---
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  # HSTS: attivare SOLO dopo aver verificato HTTPS stabile su tutto il dominio
  # Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# --- Pagina 404 (se presente 404.html) ---
ErrorDocument 404 /404.html
```

**Livello 2 — Content-Security-Policy (da attivare DOPO verifica)**: il sito è self-hosted, quindi una CSP è fattibile. Bozza:
```apache
# Header always set Content-Security-Policy "default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src https://www.google.com; connect-src 'self'; base-uri 'self'; form-action 'self' mailto:; object-src 'none'"
```
> Note CSP: `frame-src https://www.google.com` serve alla mappa post-consenso; `style-src` include `'unsafe-inline'` perché alcuni SVG/attributi possono usare stili inline (da confermare). **Tenerla commentata al primo deploy**, attivarla in un secondo momento testando ogni pagina (mappa, hover icone, form). I blocchi JSON-LD non sono script eseguibili, quindi non serve `'unsafe-inline'` su `script-src`.

### 4.3 🟡 OPZIONALE — quick win SEO (consigliati ma non bloccanti)
Se vogliamo sfruttare le nuove keyword introdotte dalla card ICIM:
- `sicurezza-di-prodotto.html` ed `en/product-safety.html`: arricchire meta `description` (e `description` del JSON-LD, per coerenza) con **SCIP** e **imballaggi/packaging**. Es. IT: "…RoHS, REACH e SCIP, direttiva ATEX, normativa imballaggi e fascicolo tecnico."
- Aggiungere `og:image` (usa `assets/img/og-cover.jpg`, già esistente) alle pagine-servizio.
- Differenziare il `<title>` della cookie-policy EN (impatto trascurabile).

> Decisione richiesta: includere i quick win SEO in questo deploy o rimandarli? (Vedi §11.)

## 5. Backup del sito attuale (PRIMA di sovrascrivere)

Sostituzione diretta in produzione ⇒ **backup obbligatorio**.
1. Connettersi via FTP alla webroot di `aria.srl`.
2. Scaricare **l'intera** webroot attuale in una cartella locale datata, es. `backup-aria-srl-2026-06-29/`.
3. (Se disponibile) usare anche il backup/snapshot del pannello Aruba come seconda copia.
4. Verificare che il backup sia completo e apribile prima di toccare il server.

## 6. Procedura di upload FTP

### 6.1 File/cartelle DA caricare (contenuto del sito)
- Tutte le pagine `.html` della root (IT) + cartella `en/` (EN)
- `assets/` (css, js, fonts, img, docs/PDF)
- `brochure/` (HTML brochure, `noindex` — innocue)
- `sitemap.xml`
- `robots.txt` (**versione produzione**, §4.1)
- `.htaccess` (§4.2)
- `404.html` (se presente)
- eventuali favicon/manifest nella root

### 6.2 File/cartelle DA NON caricare (interni di sviluppo)
- `.git/` ⛔ (mai pubblicare la cartella git)
- `.github/` (workflow CI)
- `.claude/`, `CLAUDE.md` (config e note interne)
- `docs/` (documenti di progetto interni — **diverso** da `assets/docs/`, che invece va caricato)
- `tools/` (script generazione sitemap)
- `.gitignore`, `.nojekyll` (`.nojekyll` è specifico di GitHub Pages, inutile su Aruba — innocuo ma superfluo)
- `.git_corrotto_bak/` (backup repo corrotto — **mai** pubblicare)
- eventuali file `*-MacBook Pro di Gianfranco.*` (già rimossi; ricontrollare che non rispuntino via OneDrive)

### 6.3 Modalità di upload (riduzione downtime)
- Caricare prima le cartelle nuove (`assets/`, `en/`, `brochure/`), poi sovrascrivere le pagine root e infine `robots.txt` + `.htaccess`.
- Trasferire HTML/CSS/JS/XML in modalità **ASCII/auto**, PDF/font/img in **binario** (FileZilla in "Auto" gestisce da sé).
- In alternativa, per evitare stati intermedi: caricare in una cartella temporanea e poi rinominare — opzionale, più complesso su Aruba condiviso.

## 7. Verifiche POST-deploy (checklist)

Da fare subito dopo l'upload, in incognito (cache pulita):
- [ ] `https://www.aria.srl/` carica la **nuova** home (verificare un elemento nuovo, es. card ICIM su `…/sicurezza-di-prodotto.html`).
- [ ] `http://aria.srl` e `http://www.aria.srl` → **redirect 301** a `https://www.aria.srl` (testare le 4 combinazioni www/non-www, http/https).
- [ ] `https://www.aria.srl/robots.txt` mostra `Allow: /` (NON `Disallow: /`).
- [ ] `https://www.aria.srl/sitemap.xml` è raggiungibile e ben formata.
- [ ] Pagine EN (`/en/…`) e switch lingua funzionanti; `hreflang` coerenti.
- [ ] CSS/JS caricati (no 404 in console DevTools); hover icone, scroll-reveal, contatori, carosello loghi OK.
- [ ] Form contatti: validazione + apertura client mail via `mailto:`.
- [ ] Pagina Contatti: mappa Google compare **solo dopo** click di consenso.
- [ ] PDF brochure scaricabili (`assets/docs/Aria-Srl_Brochure_ITA.pdf` / `_ENG.pdf`).
- [ ] Pagina 404 personalizzata (se presente).
- [ ] Header HTTP presenti (DevTools → Network → Response Headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- [ ] Certificato HTTPS valido (lucchetto, nessun mixed-content).

## 8. SEO post-deploy

- [ ] **Google Search Console** (proprietà `aria.srl`): verificare che il robots non blocchi più, **inviare la sitemap** `https://www.aria.srl/sitemap.xml`, usare "Controllo URL" → "Richiedi indicizzazione" sulle pagine chiave.
- [ ] Test "robots.txt Tester" / "Controllo URL" per confermare che le pagine siano *Indicizzabili*.
- [ ] (Opzionale) Bing Webmaster Tools: stessa sitemap.
- [ ] Verificare che eventuali vecchi URL indicizzati ancora validi non diano 404 (la struttura non è cambiata, rischio basso).

## 9. Rollback

Se qualcosa va storto:
1. Ricaricare via FTP il contenuto del backup `backup-aria-srl-2026-06-29/` nella webroot (sovrascrivendo).
2. In particolare ripristinare `robots.txt` e `.htaccess` originali.
3. Verificare il ritorno del sito precedente.
> Tempo di rollback stimato: pari al tempo di upload del backup (pochi minuti per un sito statico).

## 10. Aggiornamenti al repo dopo il deploy

- Aggiornare il **promemoria in cima a `CLAUDE.md`**: una volta che la produzione ha `Allow: /`, annotare che il sito è live su Aruba.
- ⚠️ **Decisione**: il `robots.txt` del repo va lasciato con `Disallow: /` (per non re-indicizzare l'anteprima GitHub Pages) **oppure** allineato alla produzione? → Proposta: **lasciare `Disallow: /` nel repo** (l'anteprima resta fuori da Google) e modificare la riga **solo nella copia caricata su Aruba**. Da decidere insieme.

## 11. Decisioni (risolte il 2026-06-29)

1. ✅ **Quick win SEO**: applicati subito al repo.
2. ✅ **CSP**: inclusa ma commentata, da attivare dopo il primo deploy verificato.
3. ✅ **robots.txt nel repo**: resta `Disallow: /`; versione `Allow: /` solo nel file da caricare su Aruba.
4. ⏳ **HSTS**: ancora da decidere (vedi nota esplicativa qui sotto), per ora commentato nel `.htaccess`.

> **Cos'è HSTS (per la decisione 4).** *HTTP Strict Transport Security* è un header che dice al browser: «per questo dominio usa **sempre e solo HTTPS** per i prossimi N mesi, anche se qualcuno digita `http://`». Vantaggio: protegge da attacchi che declassano la connessione a HTTP. Rischio: una volta che il browser l'ha memorizzato, **non puoi tornare a HTTP** finché non scade (qui 1 anno) — quindi va attivato **solo** quando si è certi che HTTPS funzioni perfettamente su tutto il dominio (incluso `www` e ogni sottodominio). Raccomandazione: lasciarlo commentato al primo deploy, verificare HTTPS per qualche giorno, poi decommentare la riga nel `.htaccess`.

---

## Riepilogo operativo (ordine di esecuzione)

1. (Repo) Modificare `robots.txt` → `Allow: /`; creare `.htaccess`; (opz.) quick win SEO. Commit.
2. Reperire credenziali FTP + identificare webroot (file di test).
3. **Backup** completo del sito attuale via FTP.
4. Upload dei file del sito (escludendo gli interni di sviluppo, §6.2).
5. Verifiche post-deploy (§7).
6. Search Console: invio sitemap + richiesta indicizzazione (§8).
7. Aggiornare `CLAUDE.md` (§10).
