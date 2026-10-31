// Página de un plan (/plan/<slug>/): a donde aterrizan los anuncios por plan cuando la
// persona no tiene la app. Con la app instalada, el enlace universal la abre en ese plan.
import { PLANS, plansFor, planCard, placesForPlan, placeTile, gateTile, skeletonTiles, storeButtons, stickyCTA, demoNotice, el } from '/assets/app.js';

export async function renderPlanPage(slug) {
  const [title, text] = PLANS[slug];
  document.getElementById('plan-title').textContent = title;
  document.getElementById('plan-text').textContent = text;
  document.getElementById('plan-stores').append(...storeButtons());
  const demo = demoNotice();
  if (demo) document.getElementById('demo-slot').append(demo);
  stickyCTA(title.replace(' en la CDMX', ''), 'Más lugares, por zona y cerca de ti, en la app');

  // Arriba, los planes como ruta de esta ocasión (docs/planes/ruta.md §7); si fallan, solo lugares.
  plansFor(slug).then(routes => {
    if (routes.length) document.getElementById('plan-routes').replaceChildren(...routes.map(planCard));
  }).catch(() => {});

  const grid = document.getElementById('plan-grid');
  grid.append(...skeletonTiles(9));
  try {
    const places = await placesForPlan(slug, 9);
    grid.replaceChildren(...places.map(placeTile), gateTile('Ve todos en la app'));
  } catch (e) {
    grid.replaceChildren(gateTile('Ve los lugares en la app'));
  }
  grid.setAttribute('aria-busy', 'false');
}

export function otherPlans(current) {
  return Object.entries(PLANS).filter(([slug]) => slug !== current)
    .map(([slug, [title]]) => el('a', { class: 'btn btn-ghost btn-small', href: `/plan/${slug}/` }, title.replace(' en la CDMX', '')));
}
