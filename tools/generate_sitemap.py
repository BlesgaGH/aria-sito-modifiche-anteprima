#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera sitemap.xml per il sito statico ARIA.

Scansiona automaticamente tutte le pagine .html del sito (escluse le cartelle
non pubbliche) e scrive sitemap.xml nella radice del sito. Le pagine nuove
vengono rilevate da sole: non serve elencarle a mano.

Uso (dalla cartella del sito o da qualunque punto):
    python tools/generate_sitemap.py
"""
import os
from datetime import datetime, timezone

# ----------------------- Configurazione -----------------------
# Dominio di produzione (senza slash finale). Gli URL della sitemap puntano qui,
# coerentemente con i tag <link rel="canonical"> presenti nelle pagine.
BASE_URL = "https://www.aria.srl"

# Cartelle da NON includere (oltre a tutte quelle che iniziano con ".").
EXCLUDE_DIRS = {"brochure", "tools", "assets", "docs", "node_modules"}

# Singoli file .html da escludere (es. pagine di errore).
EXCLUDE_FILES = {"404.html"}

# Pagine legali: priorità bassa, aggiornamento raro.
LEGAL_FILES = {"privacy.html", "cookie-policy.html"}

# La radice del sito è la cartella che contiene questo script (tools/..).
SITE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def page_settings(filename):
    """Restituisce (priority, changefreq) in base al tipo di pagina."""
    name = filename.lower()
    if name == "index.html":
        return ("1.0", "weekly")
    if name in LEGAL_FILES:
        return ("0.3", "yearly")
    return ("0.7", "monthly")


def to_url(relpath):
    """Converte un percorso relativo (separatori '/') nell'URL di produzione."""
    parts = relpath.split("/")
    if parts[-1].lower() == "index.html":
        directory = "/".join(parts[:-1])
        return f"{BASE_URL}/{directory}/" if directory else f"{BASE_URL}/"
    return f"{BASE_URL}/{relpath}"


def collect_pages():
    """Elenca i percorsi relativi di tutte le pagine .html da indicizzare."""
    pages = []
    for root, dirs, files in os.walk(SITE_ROOT):
        # Non scendere nelle cartelle escluse o nascoste.
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for f in files:
            if not f.lower().endswith(".html") or f in EXCLUDE_FILES:
                continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, SITE_ROOT).replace(os.sep, "/")
            pages.append(rel)
    return sorted(pages)


def build_sitemap(pages):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for rel in pages:
        filename = rel.split("/")[-1]
        loc = to_url(rel)
        mtime = os.path.getmtime(os.path.join(SITE_ROOT, rel))
        lastmod = datetime.fromtimestamp(mtime, tz=timezone.utc).strftime("%Y-%m-%d")
        priority, changefreq = page_settings(filename)
        lines += [
            "  <url>",
            f"    <loc>{loc}</loc>",
            f"    <lastmod>{lastmod}</lastmod>",
            f"    <changefreq>{changefreq}</changefreq>",
            f"    <priority>{priority}</priority>",
            "  </url>",
        ]
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main():
    pages = collect_pages()
    xml = build_sitemap(pages)
    out_path = os.path.join(SITE_ROOT, "sitemap.xml")
    with open(out_path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(xml)
    print(f"sitemap.xml generata: {len(pages)} pagine -> {out_path}")


if __name__ == "__main__":
    main()
