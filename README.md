# itervia.com.mx — web

Sitio estático (HTML/CSS/JS, sin build) para GitHub Pages. Su trabajo principal es **que instales la app**;
además deja ver un lugar o un perfil compartido, como una publicación de Instagram vista sin sesión:
se ve, pero no se interactúa. Toda acción (like, guardar, cómo llegar, seguir, más fotos, más lugares)
abre una hoja que lleva a la App Store.

Las decisiones de diseño salen de [`docs/investigacion-diseno-2026-10.md`](https://github.com/Aldrichch13/itervia/blob/main/docs/investigacion-diseno-2026-10.md) en el repo de la app
(morado en escala accesible, un solo color de acción, chips con texto AA, popularidad con umbral).

## Páginas

| Ruta | Qué hace |
|---|---|
| `/` | Portada: "¿A dónde vamos?", botones de descarga, una publicación destacada, grid de lo más guardado (8 + "ver todos en la app"), cómo funciona, Guías, promesa de privacidad. **También es el `site_url` de Supabase Auth:** si llega con `code`, `access_token`, `error`… lo pasa a `itervia://auth/callback` antes de pintar. |
| `/lugar/?id=<uuid>` | Publicación de un lugar: autor (con insignia GUÍA), hasta 3 fotos en carrusel, "Perfecto para…", tags, zona, señal de popularidad y 5 lugares más. Dirección exacta, mapa y horarios quedan en la app. |
| `/perfil/?u=<username>` | Perfil público: nombre, @usuario, insignia, lugares que recomienda (hasta 9) y "Seguir en la app". Lee la vista `public_profiles` (sin correo ni teléfono). |
| `/404.html` | Página no encontrada. |
| `/privacidad/` | Aviso de privacidad (LFPDPPP). La app y App Store Connect apuntan aquí. **Falta el nombre y domicilio del responsable** (comentario en el HTML). |
| `/soporte/` | Contacto y preguntas frecuentes. URL de soporte de la app. |
| `/eliminar-cuenta/` | Cómo borrar la cuenta (en la app o por correo) y qué se borra. Google Play exige esta URL. |

## Datos

- Lee `places` y `public_profiles` con la **anon key** (pública; con ella las policies solo dejan leer lugares y perfiles públicos).
- Sin anon key en `assets/config.js` corre en **modo demo** con `assets/demo.json` (lugares públicos de CDMX y fotos de Unsplash) y lo avisa en pantalla.
- La frase "Perfecto para…" se calcula igual que en la app (`assets/app.js`, copia de `docs/perfecto-para.md`). Si cambia la regla, cámbiala aquí también.
- Popularidad: muestra "Guardado por N personas" solo si `saves_count ≥ 10` (o likes ≥ 10); si no, "Nuevo en Itervia". Umbral en `config.js`.
- Sin analítica: el sitio no registra visitas ni clics, no usa cookies ni rastreadores.

## Publicar

1. Pon la anon key en `assets/config.js` (Supabase → Project Settings → API → `anon public`).
2. Cuando exista la ficha de Google Play, pon su URL en `playStoreUrl`.
3. GitHub Pages: el repo debe ser público (Pages gratis no publica privados). Settings → Pages → *Deploy from a branch* → `main` / raíz. El archivo `CNAME` ya fija `itervia.com.mx`; activa *Enforce HTTPS* cuando aparezca el certificado.
4. DNS en Squarespace (PLAN.md §7 del repo de la app). No toques los registros `MX`.
5. Crea el buzón `soporte@itervia.com.mx`: todas las páginas lo dan como contacto.

Probar en local:

```bash
python3 -m http.server 8765
```

Luego abre http://localhost:8765 (las rutas son absolutas, así que hay que servir la raíz del repo).

## Universal Links (siguiente paso)

`/.well-known/apple-app-site-association` ya declara `/lugar/*` y `/perfil/*` para `4MKWG9RSY9.com.mx.Itervia`.
Para que un link abra la app cuando está instalada falta, en la app:

1. Activar *Associated Domains* con `applinks:itervia.com.mx` (entitlement + capability en el App ID).
2. Manejar la URL entrante (`onOpenURL` / `onContinueUserActivity`) y abrir el detalle del lugar o el perfil.
3. Verificar que Pages sirve el archivo sin redirección: `curl -I https://itervia.com.mx/.well-known/apple-app-site-association`
   (`.nojekyll` evita que Jekyll ignore la carpeta `.well-known`).

En Android: `assetlinks.json` con el SHA-256 del certificado de firma de Play, cuando exista.

## Limitaciones conocidas

- Las vistas previas al compartir (Open Graph) son genéricas: un sitio estático no puede poner la foto de cada lugar en
  `og:image`. Si se vuelve importante, la opción barata es una Edge Function de Supabase que sirva solo el `<head>` de `/lugar/`.
- Los links usan `?id=` y `?u=` porque GitHub Pages no tiene rutas dinámicas.
