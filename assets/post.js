// Publicación de un lugar, como en Instagram: autor arriba, fotos en carrusel,
// acciones abajo y el texto. Se ve, pero toda acción lleva a la app.
import { CONFIG } from './config.js';
import {
  el, chip, avatar, iconButton, openInstallSheet, perfectFor, prefixFor, placeTags, placeCategory,
  photoURLs, zoneLine, profileById, CATEGORIES, TAGS,
} from './app.js';

// En la web se ven hasta 3 fotos; la siguiente slide invita a la app.
const MAX_WEB_PHOTOS = 3;

function socialProof(place) {
  const saves = place.saves_count ?? 0;
  const likes = place.likes ?? 0;
  if (saves >= CONFIG.minSocialProof) return `Guardado por ${saves.toLocaleString('es-MX')} personas`;
  if (likes >= CONFIG.minSocialProof) return `A ${likes.toLocaleString('es-MX')} personas les gusta`;
  return 'Nuevo en Itervia';
}

function authorRow(profile, compact) {
  const handle = profile?.username;
  const isGuide = profile?.role === 'guia';
  const name = handle
    ? el('a', { href: `/perfil/?u=${encodeURIComponent(handle)}` }, `@${handle}`)
    : el('b', {}, 'Itervia');
  return el('div', { class: 'post-head' },
    avatar(profile, 38),
    el('div', { class: 'who' }, name, isGuide ? el('span', { class: 'badge' }, 'GUÍA') : null,
      el('small', {}, isGuide ? 'Recomienda en Itervia' : 'Lugar aprobado por Itervia')),
    compact ? null : el('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => openInstallSheet('follow') }, 'Seguir'));
}

function media(place) {
  const photos = photoURLs(place);
  const shown = photos.slice(0, MAX_WEB_PHOTOS);
  const hidden = photos.length - shown.length;
  const slides = el('div', { class: 'slides', tabindex: '0', 'aria-label': `Fotos de ${place.name}` },
    shown.map((src, i) => el('img', { src, alt: i === 0 ? place.name : '', loading: i === 0 ? 'eager' : 'lazy' })),
    hidden > 0 || photos.length === 0
      ? el('button', { class: 'more', type: 'button', onclick: () => openInstallSheet('photos') },
          el('div', {}, '📷', el('b', {}, hidden > 0 ? `+${hidden} fotos` : 'Fotos en la app'), 'Ábrelas en Itervia'))
      : null);
  const count = slides.children.length;
  const dots = el('div', { class: 'dots', 'aria-hidden': 'true' }, Array.from({ length: count }, (_, i) => el('i', { class: i === 0 ? 'on' : '' })));
  slides.addEventListener('scroll', () => {
    const i = Math.round(slides.scrollLeft / slides.clientWidth);
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
  }, { passive: true });
  return el('div', { class: 'media' }, slides, count > 1 ? dots : null);
}

export async function renderPost(place, { compact = false } = {}) {
  let author = null;
  try { author = await profileById(place.created_by); } catch { /* sin autor: se muestra Itervia */ }

  const category = placeCategory(place);
  const tags = placeTags(place);
  const titleTag = compact ? 'h2' : 'h1';
  const name = el(titleTag, {}, compact ? el('a', { href: `/lugar/?id=${place.id}`, style: 'text-decoration:none' }, place.name) : place.name);
  if (compact) name.style.fontSize = '24px';

  return el('article', { class: 'post' },
    authorRow(author, compact),
    media(place),
    el('div', { class: 'actions' },
      iconButton('heart', 'Me gusta', () => openInstallSheet('like')),
      iconButton('route', 'Cómo llegar', () => openInstallSheet('route')),
      el('span', { class: 'spacer' }),
      iconButton('bookmark', 'Guardar', () => openInstallSheet('save'))),
    el('p', { class: 'social-proof' }, socialProof(place)),
    el('div', { class: 'post-body' },
      name,
      el('div', { class: 'row' },
        category ? chip(category, CATEGORIES[category]) : null,
        place.price_range ? el('span', { class: 'chip price' }, place.price_range) : null),
      el('p', { class: 'perfect' }, `${prefixFor(place.id)} `, el('b', {}, perfectFor(place))),
      !compact && place.description ? el('p', { class: 'desc' }, place.description) : null,
      !compact && tags.length ? el('div', { class: 'row' }, tags.map(t => chip(t, TAGS[t]))) : null,
      zoneLine(place) ? el('p', { class: 'zone' }, `📍 ${zoneLine(place)}`) : null,
      compact ? null : el('button', { class: 'locked', type: 'button', onclick: () => openInstallSheet('route') },
        '🔒', el('span', {}, 'Dirección exacta, mapa, horarios y estacionamiento en la app'))));
}
