# Guida passo-passo — Pubblicare il sito ARIA su Aruba (FileZilla / FTP)

**Data:** 2026-06-29
**A chi serve:** guida operativa concreta per eseguire il deploy. Per il contesto e le decisioni vedi `2026-06-29-deploy-aruba.md`.
**Tempo stimato:** 45–90 minuti (la maggior parte è backup + upload).

> 🔴 **Regola d'oro:** prima di sovrascrivere qualunque cosa, fai il **backup** del sito attuale (FASE 3). È la tua rete di sicurezza.

---

## Cosa ti serve prima di iniziare

- [ ] **Credenziali FTP** di Aruba: *host*, *username*, *password* (vedi FASE 1).
- [ ] **FileZilla** installato sul PC → scaricalo da <https://filezilla-project.org> (versione "Client", gratuita). Durante l'installazione, se propone software extra, deseleziona le offerte facoltative.
- [ ] La cartella del sito sul tuo PC: `C:\Users\Blesga\OneDrive\Desktop\CLAUDE\SITO INTERNET - MODIFICHE`
- [ ] I 2 file di produzione già pronti in: `…\SITO INTERNET - MODIFICHE\docs\aruba-deploy-files\` (`.htaccess` e `robots.txt`).

---

## FASE 1 — Recuperare le credenziali FTP da Aruba

1. Vai su <https://admin.aruba.it> e accedi con l'account Aruba di ARIA.
2. Apri la sezione **Hosting** (o "Hosting Linux" / "Gestione Hosting") relativa al dominio `aria.srl`.
3. Cerca la voce **FTP** / **Accessi FTP** / **Gestione FTP**.
4. Annota:
   - **Host FTP** (es. `ftp.aria.srl` oppure un indirizzo tipo `62.149.x.x`)
   - **Username** (spesso è il dominio o un codice tipo `arubaXXXXX`)
   - **Password** (se non la ricordi, da qui puoi reimpostarla)
5. Verifica se è disponibile **FTP su TLS/FTPS** (consigliato, connessione cifrata).

> 💡 Se non trovi la sezione FTP o l'hosting non c'è, fermati e segnalamelo: potrebbe essere un piano diverso (es. solo email) e va verificato col supporto Aruba.

---

## FASE 2 — Connettersi con FileZilla

1. Apri **FileZilla**.
2. In alto compila la barra di **Connessione rapida**:
   - **Host:** l'host FTP della FASE 1 (se usi FTPS esplicito puoi scrivere `ftpes://ftp.aria.srl`)
   - **Nome utente:** lo username
   - **Password:** la password
   - **Porta:** lasciala vuota (21 di default) salvo diversa indicazione di Aruba
3. Clicca **Connessione rapida**.
4. Se appare un avviso sul **certificato** (con FTPS), accettalo e spunta "fidati sempre".
5. A connessione riuscita vedrai due pannelli:
   - **Sinistra = il tuo PC** (Sito locale)
   - **Destra = il server Aruba** (Sito remoto)

### Trovare la "webroot" (cartella pubblica del sito)
Nel pannello destro, dopo il login, potresti trovarti in `/` oppure dentro una cartella. La cartella pubblica su Aruba si chiama tipicamente **`/www`** o **`htdocs`** (a volte è già la radice).
- ✅ **Come riconoscerla con certezza:** è la cartella che contiene gli attuali file del sito live (vedrai `index.html` e/o le pagine attuali di aria.srl). Quella è la webroot. Tutto ciò che segue va fatto **dentro** questa cartella.

---

## FASE 3 — BACKUP del sito attuale (obbligatorio)

1. Sul **tuo PC** (pannello sinistro), crea una cartella nuova, es.
   `Desktop\backup-aria-srl-2026-06-29`.
2. Nel pannello destro, entra nella **webroot** e seleziona **tutto** il contenuto
   (Ctrl+A).
3. Trascinalo nella cartella di backup locale (o tasto destro → **Scarica**).
4. Attendi il completamento (controlla che la coda di trasferimento in basso sia vuota e senza errori in rosso).
5. **Verifica** che il backup contenga davvero i file (apri la cartella, controlla che `index.html` ci sia e si apra).

> 🟦 Se il pannello Aruba offre anche un "Backup/Snapshot" del sito, attivalo come **seconda** copia di sicurezza.

---

## FASE 4 — Caricare il nuovo sito

> Ordine consigliato per ridurre il tempo in cui il sito è "a metà".

### 4a. File e cartelle DA caricare (dal tuo PC → webroot)
Dalla cartella `SITO INTERNET - MODIFICHE`, carica nella webroot:
- tutte le pagine `.html` della radice (es. `index.html`, `servizi.html`, …)
- la cartella **`en/`**
- la cartella **`assets/`** (css, js, fonts, img, docs/PDF)
- la cartella **`brochure/`**
- **`sitemap.xml`**
- **`404.html`** (se presente)
- eventuali favicon nella radice

Trascina le cartelle dal pannello sinistro a quello destro. Quando chiede se **sovrascrivere**, scegli **"Sovrascrivi"** e spunta *"Applica a tutti"* / *"Usa sempre questa azione"*.

### 4b. File e cartelle da NON caricare (interni di sviluppo)
NON trascinare questi (non servono al sito e non devono finire pubblici):
- `.git/`  · `.github/`  · `.gitignore`  · `.nojekyll`
- `.claude/`  · `CLAUDE.md`
- `docs/`  · `tools/`
- `.git_corrotto_bak/`
- eventuali file con nomi tipo `*-MacBook Pro di Gianfranco.*`

> Suggerimento: se preferisci, copia prima i file "buoni" in una cartella pulita sul PC ed effettua l'upload da lì, così non rischi di trascinare le cartelle sbagliate.

### 4c. Caricare PER ULTIMI i 2 file di produzione
Dalla cartella `docs\aruba-deploy-files\` carica **nella webroot** (radice del sito):
1. **`robots.txt`** → sovrascrive quello del sito (questa è la versione `Allow: /`).
2. **`.htaccess`** → file nuovo (abilita HTTPS+www e gli header di sicurezza).

> ⚠️ Su FileZilla i file che iniziano con punto (`.htaccess`) a volte sono nascosti: menu **Server → Forza visualizzazione file nascosti** per vederli.

---

## FASE 5 — Verifiche dopo il caricamento

Apri il browser in **finestra anonima/incognito** (per evitare la cache) e controlla:

- [ ] `https://www.aria.srl/` mostra il **nuovo** sito.
- [ ] Vai su `https://www.aria.srl/sicurezza-di-prodotto.html` → in fondo alla sezione c'è la card **"Partnership ICIM Group: SCIP e imballaggi"**.
- [ ] Digita `http://aria.srl` → deve **reindirizzare** a `https://www.aria.srl` (prova anche `http://www.aria.srl` e `https://aria.srl`).
- [ ] `https://www.aria.srl/robots.txt` → deve mostrare **`Allow: /`** (NON `Disallow: /`).
- [ ] `https://www.aria.srl/sitemap.xml` → si apre e mostra l'elenco URL.
- [ ] Le pagine **inglesi** (`/en/…`) e lo switch lingua IT/EN funzionano.
- [ ] Nessuna immagine rotta; il menu, le animazioni e il carosello loghi funzionano.
- [ ] **Contatti** → la **mappa** compare solo dopo aver cliccato il consenso.
- [ ] Il **form contatti** apre il programma di posta (invio via `mailto:`).
- [ ] I **PDF brochure** si scaricano (`/assets/docs/Aria-Srl_Brochure_ITA.pdf`).
- [ ] Lucchetto **HTTPS** verde, nessun avviso "contenuto non sicuro".

> Se qualcosa è rotto: vedi FASE 7 (Rollback).

---

## FASE 6 — Far indicizzare il sito da Google

1. Vai su **Google Search Console** → <https://search.google.com/search-console>.
2. Seleziona (o aggiungi) la proprietà di `aria.srl`.
3. Menu **Sitemap** → inserisci `sitemap.xml` → **Invia**.
4. Menu **Controllo URL** → incolla `https://www.aria.srl/` → **Richiedi indicizzazione**. Ripeti per le pagine chiave (servizi, sicurezza-di-prodotto, contatti).
5. Sempre in "Controllo URL", verifica che risulti **"URL disponibile per Google"** (cioè non bloccato da robots).

> L'indicizzazione completa richiede giorni/settimane: è normale.

---

## FASE 7 — Se qualcosa va storto (Rollback)

1. In FileZilla, vai nella cartella **backup** locale (FASE 3).
2. Ricarica tutto il suo contenuto nella **webroot**, sovrascrivendo.
3. In particolare ripristina `robots.txt` e `.htaccess` originali (se nel backup c'erano).
4. Ricontrolla che torni il sito precedente.
> Per un sito statico il ripristino dura quanto un upload: pochi minuti.

---

## FASE 8 — Dopo il deploy (a sito stabile)

- [ ] **HSTS** (opzionale): dopo qualche giorno di HTTPS verificato, in `.htaccess` decommenta la riga `Strict-Transport-Security`, ricarica il file, verifica. (Vedi spiegazione nel piano.)
- [ ] **CSP** (opzionale): decommenta il blocco Content-Security-Policy in `.htaccess`, ricarica, e **ritesta ogni pagina** (mappa, hover icone, form). Se qualcosa si rompe, ricommenta e segnalamelo.
- [ ] Aggiornare il promemoria in cima a `CLAUDE.md` annotando che il sito è live su Aruba.

---

### Riassunto in una riga
**Credenziali FTP → FileZilla → BACKUP → carica il sito (no file dev) → carica per ultimi robots.txt + .htaccess → verifica in incognito → Search Console.**
