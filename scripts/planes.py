#!/usr/bin/env python3
"""Genera plan/<ocasión>/<slug>/index.html para cada plan publicado.

Lo mismo que scripts/lugares.py, pero para los planes como ruta que comparte la app
(PlanShare, docs/planes/ruta.md §7 del repo de la app): cada página lleva el título, la
ruta y la portada del plan en las etiquetas og:* para la vista previa de WhatsApp.

Cada página es una copia de plan/ruta/index.html con el <head> del plan; las paradas las
pinta assets/ruta.js en el navegador. Lo corre la acción .github/workflows/lugares.yml
junto con lugares.py; en local: python3 scripts/planes.py
"""
import html
import json
import re
import shutil
import sys
import urllib.request
from pathlib import Path

from lugares import MARK as PLACE_MARK, SITE, clip, config, og_image

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / 'plan' / 'ruta' / 'index.html'
SLUG = re.compile(r'^[a-z0-9-]{1,80}$')
# Copia de PLANS en assets/app.js: solo hay carpeta para estas ocasiones.
OCCASIONS = {'cita', 'amigos', 'fin-de-semana', 'trabajar', 'con-mi-perro'}
MARK = PLACE_MARK.replace('lugares.py', 'planes.py')


def plans():
    url, key = config()
    if not key:
        sys.exit('Sin anon key en assets/config.js: nada que generar (modo demo).')
    # get_plans es público (anon), igual que en la web y en la app.
    req = urllib.request.Request(
        f'{url}/rest/v1/rpc/get_plans', data=b'{}', method='POST',
        headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def head_for(plan):
    e = lambda s: html.escape(s, quote=True)
    title = plan['title'].strip()
    route = ' → '.join(s['place']['name'].strip() for s in plan.get('stops') or [])
    description = clip(plan.get('summary')) or (f'{route}. Míralo en Itervia.' if route else 'Míralo en Itervia.')
    page = f"{SITE}/plan/{plan['occasion']}/{plan['slug']}/"
    stops = plan.get('stops') or []
    first = stops[0]['place'].get('photos') or [] if stops else []
    photo = plan.get('cover_photo') or next((p for p in first if p), None)
    image = og_image(photo) if photo else f'{SITE}/assets/icon-512.png'
    tags = [
        f'<title>{e(title)} · Itervia</title>',
        f'<meta name="description" content="{e(description)}">',
        f'<link rel="canonical" href="{e(page)}">',
        f'<meta name="apple-itunes-app" content="app-id=6758466804, app-argument={e(page)}">',
        '<meta name="theme-color" content="#966B9D">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="Itervia">',
        f'<meta property="og:url" content="{e(page)}">',
        f'<meta property="og:title" content="{e("¿Vamos? " + title)}">',
        f'<meta property="og:description" content="{e(route or description)}">',
        f'<meta property="og:image" content="{e(image)}">',
        f'<meta property="og:image:alt" content="{e(title)}">',
        '<meta property="og:locale" content="es_MX">',
        f'<meta name="twitter:card" content="{"summary_large_image" if photo else "summary"}">',
    ]
    return '\n  '.join(tags)


def main():
    template = TEMPLATE.read_text()
    block = re.compile(r'<title>.*?<meta property="og:locale"[^>]*>', re.S)
    if not block.search(template):
        sys.exit('plan/ruta/index.html cambió: no encontré el bloque <title> … og:locale.')

    wanted = set()
    for plan in plans():
        occasion, slug = str(plan.get('occasion', '')), str(plan.get('slug', ''))
        if occasion not in OCCASIONS or not SLUG.match(slug) or slug == 'ruta' or not plan.get('title'):
            continue
        wanted.add((occasion, slug))
        page = block.sub(lambda _: head_for(plan), template, count=1)
        page = page.replace('<!doctype html>', f'<!doctype html>\n{MARK}', 1)
        out = ROOT / 'plan' / occasion / slug / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        if not out.exists() or out.read_text() != page:
            out.write_text(page)

    # Planes que ya no están publicados: solo se borran carpetas que generó este script.
    for occasion in OCCASIONS:
        for folder in (ROOT / 'plan' / occasion).iterdir():
            index = folder / 'index.html'
            if folder.is_dir() and (occasion, folder.name) not in wanted and index.exists() and MARK in index.read_text():
                shutil.rmtree(folder)

    print(f'{len(wanted)} planes')


if __name__ == '__main__':
    main()
