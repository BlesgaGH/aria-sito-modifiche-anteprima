# Guida passo-passo — Pubblicare il sito ARIA su Aruba (FileZilla / FTP)

**Data:** 2026-06-29
**A chi serve:** guida operativa concreta per eseguire il deploy. Per il contesto e le decisioni vedi `2026-06-29-deploy-aruba.md`.
**Tempo stimato:** 45–90 minuti (la maggior parte è backup + upload).

> 🔴 **Regola d'oro:** prima di sovrascrivere qualunque cosa, fai il **backup** del sito attuale (FASE 3). È la tua rete di sicurezza.

> ⚠️ **IMPORTANTE — il sito attuale su Aruba è in WordPress.** Stiamo sostituendo un sito WordPress (PHP + database) con un sito **statico**. Questo cambia 3 cose rispetto a un normale aggiornamento:
> 1. Il backup deve includere **anche il database** (i file FTP da soli non bastano): vedi **FASE 3B**.
> 2. Prima di caricare il sito nuovo bisogna **rimuovere i file di WordPress** dalla webroot: vedi **FASE 4.0**.
> 3. Vecchi indirizzi tipo `/chi-siamo/` diventeranno `/chi-siamo.html`: valutare i **redirect 301** (nota in fondo).

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

## FASE 3A — Backup dei FILE (via FTP)

1. Sul **tuo PC** (pannello sinistro), crea una cartella nuova, es.
   `Desktop\backup-aria-srl-2026-06-29\files`.
2. Nel pannello destro, entra nella **webroot** e seleziona **tutto** il contenuto
   (Ctrl+A) — vedrai i tipici file WordPress: `index.php`, `wp-admin`, `wp-content`, `wp-includes`, `wp-config.php`, ecc.
3. Trascinalo nella cartella di backup locale (o tasto destro → **Scarica**).
4. Attendi il completamento (controlla che la coda di trasferimento in basso sia vuota e senza errori in rosso). WordPress ha **migliaia di file**: può richiedere parecchi minuti.
5. **Verifica** che il backup contenga davvero i file (apri la cartella, controlla che ci siano `index.php`, `wp-config.php` e la cartella `wp-content`).

## FASE 3B — Backup del DATABASE (obbligatorio per WordPress)

I file da soli **non** contengono i contenuti del sito WordPress (pagine, testi, impostazioni): quelli stanno nel **database MySQL**, che NON si scarica via FTP. Va esportato a parte.

> ℹ️ **Il file `.sql` non esiste ancora: lo crei TU adesso con l'Esporta**, e il browser lo scarica. Non è un file da cercare nel pannello.

1. Nel pannello Aruba apri **phpMyAdmin** (sezione Database / MySQL → "Gestisci" / "Accedi a phpMyAdmin").
2. **Qual è il database di WordPress?** È **`Sql957059_1`** — si riconosce dalle tabelle con prefisso **`ar_`** (`ar_posts`, `ar_options`, `ar_users`…; c'è anche il plugin SEO **Rank Math**). Gli altri (`Sql957059_2…5`) sono slot Aruba di norma vuoti.
   - *(Se servisse: nome DB / utente / password sono dentro `wp-config.php`, che ora hai nel backup file: cerca `DB_NAME`, `DB_USER`, `DB_PASSWORD`.)*
3. **Modo più semplice e completo** — esporta tutti i database in un colpo solo: con phpMyAdmin sulla schermata iniziale (livello server, elenco di tutti i database), clicca la scheda **Esporta** in alto → Metodo **Rapido** → Formato **SQL** → **Esegui**.
   - *In alternativa, solo WordPress:* clicca prima **`Sql957059_1`** nel pannello sinistro, poi **Esporta → Rapido → SQL → Esegui**.
4. Il browser **scarica un file `.sql`** (es. `localhost.sql` o `Sql957059_1.sql`): **quello è il backup**. Salvalo nella cartella di backup, rinominandolo es. `aria-database-2026-06-29.sql`.
5. **Verifica** che il file `.sql` non sia vuoto: deve pesare **almeno qualche centinaio di KB**. Se è minuscolo (poche righe), rifai l'export.

> 🟦 Se il pannello Aruba offre un **"Backup/Snapshot" automatico** del sito, attivalo come **terza** copia di sicurezza (file + DB insieme). Comodo per ripristini rapidi.

> 🔎 **Per i redirect 301 (FASE 8):** il sito usa **Rank Math**, quindi la vecchia sitemap è in `https://www.aria.srl/sitemap_index.xml`. **Prima di rimuovere WordPress** aprila nel browser e salvala (File → Salva pagina) — serve a ricavare i vecchi URL.

> ✅ A fine FASE 3 devi avere: **(a)** i file del sito, **(b)** il file `.sql` del database. Solo allora puoi procedere.

---

## FASE 4 — Caricare il nuovo sito

> Ordine consigliato per ridurre il tempo in cui il sito è "a metà".

### 4.0 Rimuovere WordPress dalla webroot (SOLO dopo che la FASE 3 è completa!)

Il sito nuovo è statico: i file di WordPress vanno tolti, altrimenti restano `wp-admin`, `wp-content`, `index.php` ecc. (la home continuerebbe a mostrare WordPress, e resterebbero pannelli di login pubblici). Nel pannello **destro** di FileZilla, dentro la webroot, **elimina** (tasto destro → Elimina) questi elementi WordPress:

- la cartella **`wp-admin/`**
- la cartella **`wp-includes/`**
- la cartella **`wp-content/`**
- il file **`index.php`**
- **tutti i file che iniziano con `wp-`** (`wp-config.php`, `wp-login.php`, `wp-settings.php`, `wp-load.php`, `wp-blog-header.php`, `wp-cron.php`, `wp-mail.php`, `wp-signup.php`, `wp-activate.php`, `wp-trackback.php`, `wp-comments-post.php`, `wp-links-opml.php`)
- **`xmlrpc.php`**, **`license.txt`**, **`readme.html`**
- il vecchio **`.htaccess`** (lo sostituiremo con il nostro)

> ⚠️ **Non eliminare** eventuali cartelle che NON sono di WordPress né del sito e che sembrano gestite da Aruba (es. `logs`, `stats`, `cgi-bin`): nel dubbio lasciale e chiedimi. Se non sei sicuro di un file, lascialo: lo verifichiamo dopo.

> 🔁 In alternativa più drastica ma pulita: se nella webroot ci sono **solo** file di WordPress e del sito, puoi selezionare tutto ed eliminare, partendo da una cartella vuota. Fallo solo se sei certo del backup (FASE 3).

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
- [ ] **(WordPress)** `https://www.aria.srl/` mostra la home **statica** nuova, NON la vecchia home WordPress (se vedi ancora il vecchio sito → `index.php` non è stato rimosso, torna alla FASE 4.0).
- [ ] **(WordPress)** `https://www.aria.srl/wp-admin/` e `https://www.aria.srl/wp-login.php` danno **404/errore** (= WordPress rimosso correttamente, niente login esposto).

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

1. **Modo più semplice:** se hai attivato il **Backup/Snapshot di Aruba** (FASE 3B), ripristina da lì: rimette file + database insieme. È la via più rapida per tornare a WordPress.
2. **Modo manuale (file):** in FileZilla svuota la webroot e ricarica i file dal backup `…\files` (FASE 3A), incluso il vecchio `index.php`, le cartelle `wp-*` e il vecchio `.htaccess`.
3. **Modo manuale (database):** se nel frattempo il database fosse stato toccato (in questo deploy NON lo tocchiamo, quindi di norma è intatto), reimportalo in phpMyAdmin: scheda **Importa** → scegli `database.sql` → Esegui.
4. Ricontrolla che torni il sito WordPress precedente.
> Nota: in questo deploy il **database non viene modificato** (rimuoviamo solo i file). Quindi per il rollback basta quasi sempre ripristinare i file. Il backup del DB serve come garanzia.

---

## FASE 8 — Dopo il deploy (a sito stabile)

- [ ] **(WordPress → statico) Redirect 301 dei vecchi URL.** Con WordPress gli indirizzi erano probabilmente del tipo `https://www.aria.srl/chi-siamo/` (con slash finale); ora sono `…/chi-siamo.html`. I vecchi link già indicizzati da Google darebbero **404**. Per non perdere posizionamento conviene aggiungere regole di redirect nel `.htaccess`. **Mi servono i vecchi URL** per scriverle: li ricaviamo da Google Search Console ("Pagine" / vecchia copertura) o dalla vecchia sitemap WordPress (`/sitemap_index.xml` o `/sitemap.xml` salvati prima di rimuovere WP). Mandameli e preparo io il blocco di redirect. In Search Console, tieni d'occhio il report **Pagine → 404** nelle settimane dopo il deploy.
- [ ] **HSTS** (opzionale): dopo qualche giorno di HTTPS verificato, in `.htaccess` decommenta la riga `Strict-Transport-Security`, ricarica il file, verifica. (Vedi spiegazione nel piano.)
- [ ] **CSP** (opzionale): decommenta il blocco Content-Security-Policy in `.htaccess`, ricarica, e **ritesta ogni pagina** (mappa, hover icone, form). Se qualcosa si rompe, ricommenta e segnalamelo.
- [ ] Aggiornare il promemoria in cima a `CLAUDE.md` annotando che il sito è live su Aruba.

---

### Riassunto in una riga
**Credenziali FTP → FileZilla → BACKUP → carica il sito (no file dev) → carica per ultimi robots.txt + .htaccess → verifica in incognito → Search Console.**
