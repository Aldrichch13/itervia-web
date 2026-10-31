#!/usr/bin/env python3
"""Genera lugar/<uuid>/index.html para cada lugar público.

WhatsApp, iMessage, Instagram y compañía arman la vista previa de un enlace leyendo las
etiquetas og:* del HTML sin ejecutar JavaScript. Con una sola página /lugar/?id=… todos
los enlaces mostraban el logo; con una página por lugar cada uno lleva su foto y su nombre.

Cada página es una copia de lugar/index.html con el <head> del lugar; el resto (fotos,
carrusel, "más lugares") lo sigue pintando el mismo script en el navegador.

Sin dependencias (solo la biblioteca estándar). Lo corre la acción .github/workflows/lugares.yml
cada hora; en local: python3 scripts/lugares.py
"""
import html
import json
import re
import shutil
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / 'lugar' / 'index.html'
SITE = 'https://itervia.com.mx'
UUID = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
MARK = '<!-- Generado por scripts/lugares.py: no lo edites a mano. -->'


def config():
    text = (ROOT / 'assets' / 'config.js').read_text()
    url = re.search(r"supabaseUrl:\s*'([^']+)'", text).group(1)
    key = re.search(r"supabaseAnonKey:\s*'([^']*)'", text).group(1)
    return url, key


def places():
    url, key = config()
    if not key:
        sys.exit('Sin anon key en assets/config.js: nada que generar (modo demo).')
    # La anon key solo deja leer lugares públicos, igual que en la web y en la app.
    req = urllib.request.Request(
        f'{url}/rest/v1/places?select=id,name,description,photos,municipality,city&order=id',
        headers={'apikey': key, 'Authorization': f'Bearer {key}'})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def og_image(photo):
    """La foto en un tamaño que WhatsApp sí muestra (descarta las que pesan más de ~600 KB)."""
    photo = re.sub(r'/1280px-', '/960px-', photo) if 'wikimedia.org' in photo else photo
    return re.sub(r'=w\d+$', '=w960', photo) if 'googleusercontent.com' in photo else photo


def clip(text, limit=160):
    text = ' '.join((text or '').split())
    return text if len(text) <= limit else text[:limit - 1].rsplit(' ', 1)[0] + '…'


def head_for(place):
    e = lambda s: html.escape(s, quote=True)
    name = place['name'].strip()
    zone = place.get('municipality') or place.get('city') or ''
    description = clip(place.get('description')) or f'{name}{" en " + zone if zone else ""}. Míralo en Itervia.'
    page = f"{SITE}/lugar/{place['id']}/"
    photo = next((p for p in place.get('photos') or [] if p), None)
    image = og_image(photo) if photo else f'{SITE}/assets/icon-512.png'
    tags = [
        f'<title>{e(name)} · Itervia</title>',
        f'<meta name="description" content="{e(description)}">',
        f'<link rel="canonical" href="{e(page)}">',
        f'<meta name="apple-itunes-app" content="app-id=6758466804, app-argument={e(page)}">',
        '<meta name="theme-color" content="#966B9D">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="Itervia">',
        f'<meta property="og:url" content="{e(page)}">',
        f'<meta property="og:title" content="{e(name)}">',
        f'<meta property="og:description" content="{e(description)}">',
        f'<meta property="og:image" content="{e(image)}">',
        f'<meta property="og:image:alt" content="{e(name)}">',
        '<meta property="og:locale" content="es_MX">',
        f'<meta name="twitter:card" content="{"summary_large_image" if photo else "summary"}">',
    ]
    return '\n  '.join(tags)


def main():
    template = TEMPLATE.read_text()
    # Del <title> a og:locale: el bloque que cambia por lugar.
    block = re.compile(r'<title>.*?<meta property="og:locale"[^>]*>', re.S)
    if not block.search(template):
        sys.exit('lugar/index.html cambió: no encontré el bloque <title> … og:locale.')

    rows = [p for p in places() if UUID.match(str(p.get('id', '')).lower()) and p.get('name')]
    wanted = set()
    for place in rows:
        place['id'] = place['id'].lower()
        wanted.add(place['id'])
        page = block.sub(lambda _: head_for(place), template, count=1)
        page = page.replace('<!doctype html>', f'<!doctype html>\n{MARK}', 1)
        out = ROOT / 'lugar' / place['id'] / 'index.html'
        out.parent.mkdir(exist_ok=True)
        if not out.exists() or out.read_text() != page:
            out.write_text(page)

    # Lugares que ya no son públicos: su enlace cae en /lugar/?id=… (vía 404.html), que dice "no encontrado".
    for folder in (ROOT / 'lugar').iterdir():
        if folder.is_dir() and UUID.match(folder.name) and folder.name not in wanted:
            shutil.rmtree(folder)

    print(f'{len(wanted)} lugares')


if __name__ == '__main__':
    main()
