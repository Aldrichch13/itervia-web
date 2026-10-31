// Página de un plan como ruta (/plan/<ocasión>/<slug>/): lo que se abre desde WhatsApp
// cuando alguien comparte un plan y no tiene la app (docs/planes/ruta.md §7 del repo de la app).
// Con la app instalada, el enlace universal abre el detalle del plan.
import {
  PLANS, planBySlug, planFacts, planClock, planCover, photoURLs, perfectPhrase, storeButtons,
  stickyCTA, demoNotice, openInstallSheet, el,
} from '/assets/app.js';

function stopItem(stop) {
  const place = stop.place;
  const photo = photoURLs(place)[0];
  return el('li', { class: 'stop' },
    el('span', { class: 'num', 'aria-hidden': 'true' }, String(stop.position)),
    el('div', {},
      el('div', { class: 'when' }, [planClock(stop.suggested_at), stop.role].filter(Boolean).join(' · ')),
      el('a', { class: 'plan-card', href: `/lugar/${String(place.id).toLowerCase()}/` },
        photo ? el('img', { src: photo, alt: '', loading: 'lazy' }) : null,
        el('span', {}, el('b', {}, place.name), el('small', {}, perfectPhrase(place)))),
      stop.note ? el('p', { class: 'note' }, stop.note) : null));
}

export async function renderRoute(slot) {
  const demo = demoNotice();
  if (demo) document.getElementById('demo-slot').append(demo);
  // /plan/<ocasión>/<slug>/ (scripts/planes.py) o /plan/ruta/?p=<slug> (plan nuevo, vía 404.html).
  const parts = location.pathname.split('/').filter(Boolean);
  const slug = new URLSearchParams(location.search).get('p') ?? parts[2];

  let plan;
  try {
    plan = await planBySlug(slug);
  } catch {
    slot.replaceChildren(el('div', { class: 'empty' },
      el('h1', {}, 'No pudimos cargar el plan'),
      el('p', {}, 'Revisa tu conexión e inténtalo de nuevo.'),
      el('button', { class: 'btn btn-primary', type: 'button', onclick: () => location.reload() }, 'Reintentar')));
    return;
  }
  if (!plan) {
    document.title = 'Plan no encontrado · Itervia';
    slot.replaceChildren(el('div', { class: 'empty' },
      el('h1', {}, 'No encontramos este plan'),
      el('p', {}, 'Puede que el enlace esté incompleto o que el plan ya no esté en Itervia.'),
      el('a', { class: 'btn btn-primary', href: '/' }, 'Ver lugares')));
    return;
  }

  document.title = `${plan.title} · Itervia`;
  const cover = planCover(plan);
  const occasion = PLANS[plan.occasion]?.[0]?.replace(' en la CDMX', '');
  const start = planClock(plan.starts_at);
  slot.replaceChildren(
    cover ? el('img', { class: 'plan-cover', src: cover, alt: '' }) : null,
    el('div', { style: 'margin-top:18px' },
      occasion ? el('a', { class: 'kicker', href: `/plan/${plan.occasion}/`, style: 'text-decoration:none' }, `${occasion} →`) : null,
      el('h1', { style: 'margin-top:10px' }, plan.title),
      el('p', { class: 'zone' }, planFacts(plan) + (start ? ` · desde las ${start}` : '')),
      plan.summary ? el('p', { class: 'desc' }, plan.summary) : null),
    el('ol', { class: 'stops' }, plan.stops.map(stopItem)),
    el('button', { class: 'locked', type: 'button', onclick: () => openInstallSheet('plan') },
      '🔒', el('span', {}, 'Mapa con las paradas, horarios de hoy y cómo llegar en la app')),
    el('div', { class: 'store-row', style: 'margin-top:20px' }, storeButtons()));
  stickyCTA(plan.title, 'Guárdalo y ve cómo llegar en la app');
}
