# File pronti per il deploy su Aruba

Questi file vanno caricati **nella radice del sito (webroot)** su Aruba, via FTP.
Sono tenuti qui (in `docs/`, che NON va pubblicato) per non alterare il repo/anteprima.

| File | Dove va | Note |
|------|---------|------|
| `robots.txt` | webroot (sovrascrive quello del sito) | versione PRODUZIONE con `Allow: /` — **diverso** da quello nel repo, che resta `Disallow: /` per tenere l'anteprima GitHub Pages fuori da Google |
| `.htaccess`  | webroot | redirect HTTPS+www, security header. CSP e HSTS sono **commentati**: attivarli dopo il primo deploy verificato (vedi commenti nel file) |

> ⚠️ Durante l'upload FTP: caricare prima il sito, poi **per ultimi** questi due file
> nella radice. Verificare che `https://www.aria.srl/robots.txt` mostri `Allow: /`.

Procedura completa: vedi `docs/2026-06-29-deploy-aruba.md`.
