// Lógica compartida de itervia.com.mx. Sin frameworks ni dependencias.
// Todo el texto que viene de la base se pinta con textContent / atributos, nunca como HTML.
import { CONFIG } from './config.js';

// ------------------------------------------------------------------ catálogos (iguales a la app)
// Colores: texto accesible (AA) sobre su tinte, ver docs/investigacion-diseno-2026-10.md §3.3.
export const TAGS = {
  'Romántico': ['#C52741', '❤️'], 'Elegante': ['#7E6749', '✨'], 'Premium': ['#896904', '👑'],
  'Artístico': ['#9345BA', '🎨'], 'Noche': ['#5A58DD', '🌙'], 'Familiar': ['#B24B2B', '👨‍👩‍👧'],
  'Tranquilo': ['#1D7B6A', '🍃'], 'Instagrameable': ['#A734B8', '📷'], 'Amigos': ['#217298', '👥'],
  'Mañana': ['#995F06', '🌅'], 'Solo': ['#0066D6', '👤'], 'Animado': ['#C2342C', '🔥'],
  'Barato': ['#207B37', '💲'], 'Para trabajar': ['#4D66B9', '💻'], 'Pet friendly': ['#8C6038', '🐾'],
};
export const CATEGORIES = {
  'Comida': ['#9E5C00', '🍴'], 'Cafetería': ['#0066D6', '☕'], 'Vida nocturna': ['#4F4CC9', '🍸'],
  'Experiencias': ['#9345BA', '⭐'],
  'Cultura': ['#0066D6', '🏛️'], 'Paseo': ['#207B37', '🚶'], 'Desconexión': ['#217887', '🌿'],
};
const fold = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
const lenient = (table, raw) => Object.keys(table).find(k => fold(k) === fold(raw));

// Copia de PerfectFor (ItervaCore / :core, docs/perfecto-para.md del repo de la app). Si cambia allá, cambia aquí.
// [tags, complemento, solo en estas categorías (opcional; un lugar sin categoría siempre cuenta)]
const DATE_CATEGORIES = ['Comida', 'Cafetería', 'Vida nocturna', 'Experiencias'];
const RULES = [
  [['Romántico'], 'una cita romántica', ['Vida nocturna']],
  [['Romántico', 'Noche'], 'una cena romántica'], [['Para trabajar'], 'trabajar o estudiar'],
  [['Tranquilo'], 'una cita tranquila', DATE_CATEGORIES],
  [['Romántico'], 'una cita romántica'], [['Amigos', 'Noche'], 'una noche con amigos'],
  [['Animado', 'Noche'], 'una noche de fiesta'],
  [['Familiar'], 'un plan en familia'], [['Pet friendly'], 'ir con tu mascota'],
  [['Amigos'], 'salir con amigos'], [['Elegante'], 'una ocasión especial'], [['Premium'], 'una ocasión especial'],
  [['Artístico'], 'inspirarte con arte'], [['Mañana'], 'empezar bien el día'], [['Noche'], 'una salida de noche'],
  [['Solo'], 'un rato a solas'], [['Instagrameable'], 'tomar fotos increíbles'], [['Animado'], 'pasarla bien'],
  [['Barato'], 'un plan económico'], [['Tranquilo'], 'un rato tranquilo'],
];
const FALLBACK = {
  'Comida': 'disfrutar una buena comida', 'Cafetería': 'un buen café', 'Vida nocturna': 'una noche de tragos',
  'Experiencias': 'vivir algo nuevo',
  'Cultura': 'un plan cultural', 'Paseo': 'salir a pasear', 'Desconexión': 'desconectarte',
};
export function placeTags(place) {
  return [...new Set((place.tags ?? []).map(t => lenient(TAGS, t)).filter(Boolean))];
}
export function placeCategory(place) { return lenient(CATEGORIES, place.category); }
// Arranque de la frase: el último byte del id elige uno, así el mismo lugar dice siempre lo mismo.
const PREFIXES = ['Ideal para', 'Perfecto para', 'Buena opción para', 'Va muy bien para'];
export function prefixFor(id) {
  const byte = parseInt(String(id ?? '').slice(-2), 16);
  return Number.isNaN(byte) ? PREFIXES[0] : PREFIXES[byte % PREFIXES.length];
}
export function perfectPhrase(place) { return `${prefixFor(place.id)} ${perfectFor(place)}`; }
export function perfectFor(place) {
  const present = new Set(placeTags(place));
  const category = placeCategory(place);
  const rule = RULES.find(([all, , onlyIn]) =>
    all.every(t => present.has(t)) && (!onlyIn || !category || onlyIn.includes(category)));
  return rule ? rule[1] : (FALLBACK[placeCategory(place)] ?? 'tu próximo plan');
}
// Copia de Plan (ItervaCore, docs/planes/inicio.md del repo de la app). Si cambia allá, cambia aquí.
// slug: [título de la página, texto, etiquetas (cualquiera)]. Cita: Tranquilo cuenta solo en DATE_CATEGORIES.
export const PLANS = {
  'cita': ['Lugares para una cita en la CDMX', 'Restaurantes, cafés y planes románticos o tranquilos para una primera cita o para celebrar algo.', ['Romántico', 'Elegante']],
  'amigos': ['Lugares para salir con amigos en la CDMX', 'Tacos, bares y planes animados para ir en grupo, de día o de noche.', ['Amigos', 'Animado', 'Noche']],
  'fin-de-semana': ['Planes de fin de semana en la CDMX', 'Desayunos, paseos y planes en familia para el sábado o el domingo.', ['Familiar', 'Mañana']],
  'trabajar': ['Cafés para trabajar en la CDMX', 'Lugares para trabajar o estudiar con tu laptop.', ['Para trabajar']],
  'con-mi-perro': ['Lugares pet friendly en la CDMX', 'Lugares donde tu perro también es bienvenido.', ['Pet friendly']],
};
export function planMatches(place, slug) {
  const tags = new Set(placeTags(place));
  if (PLANS[slug][2].some(t => tags.has(t))) return true;
  const category = placeCategory(place);
  return slug === 'cita' && tags.has('Tranquilo') && (!category || DATE_CATEGORIES.includes(category));
}
export function photoURLs(place) { return (place.photos ?? []).filter(Boolean); }
export function zoneLine(place) {
  return [place.municipality || place.city, place.state].map(s => (s ?? '').trim()).filter(Boolean).join(', ');
}

// ------------------------------------------------------------------ datos
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const USERNAME = /^[a-z0-9._]{1,40}$/i;
export const isDemo = !CONFIG.supabaseAnonKey;
const PLACE_COLUMNS = 'id,name,category,description,photos,price_range,tags,state,city,municipality,likes,saves_count,created_by,created_at';

async function rest(path) {
  const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${CONFIG.supabaseAnonKey}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}
let demoCache;
async function demo() {
  demoCache ??= await fetch(new URL('./demo.json', import.meta.url)).then(r => r.json());
  return demoCache;
}

/** Lugares para la portada: los más guardados primero. */
export async function featuredPlaces(limit = 8) {
  if (isDemo) return (await demo()).places.slice(0, limit);
  return rest(`places?select=${PLACE_COLUMNS}&order=saves_count.desc.nullslast,created_at.desc&limit=${limit}`);
}
/** Lugares de un plan (filtro igual que la app), los más guardados primero. */
export async function placesForPlan(slug, limit = 9) {
  const all = isDemo ? (await demo()).places
    : await rest(`places?select=${PLACE_COLUMNS}&order=saves_count.desc.nullslast,created_at.desc&limit=500`);
  return all.filter(p => planMatches(p, slug)).slice(0, limit);
}
export async function placeById(id) {
  if (!UUID.test(id ?? '')) return null;
  if (isDemo) return (await demo()).places.find(p => p.id === id) ?? null;
  const rows = await rest(`places?select=${PLACE_COLUMNS}&id=eq.${id}&limit=1`);
  return rows[0] ?? null;
}
export async function morePlaces(excludeId, limit = 5) {
  const all = await featuredPlaces(limit + 1);
  return all.filter(p => p.id !== excludeId).slice(0, limit);
}
/** Perfil público (vista public_profiles: sin correo ni teléfono). */
export async function profileById(id) {
  if (!id) return null;
  if (isDemo) return (await demo()).profiles.find(p => p.id.toLowerCase() === String(id).toLowerCase()) ?? null;
  // La 1.0 guardó algunos ids en MAYÚSCULAS (PLAN.md §0.1).
  const rows = await rest(`public_profiles?select=id,name,username,photourl,isverified,role,followerscount&or=(id.eq.${id.toLowerCase()},id.eq.${id.toUpperCase()})&limit=1`);
  return rows[0] ?? null;
}
export async function profileByUsername(username) {
  if (!USERNAME.test(username ?? '')) return null;
  if (isDemo) return (await demo()).profiles.find(p => p.username.toLowerCase() === username.toLowerCase()) ?? null;
  const rows = await rest(`public_profiles?select=id,name,username,photourl,isverified,role,followerscount&username=ilike.${encodeURIComponent(username.replace(/_/g, '\\_'))}&limit=1`);
  return rows[0] ?? null;
}
// Planes como ruta (S14, docs/planes/ruta.md §7 del repo de la app). Slugs: minúsculas, números y guiones.
const SLUG = /^[a-z0-9-]{1,80}$/;
async function rpc(name, body) {
  const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${CONFIG.supabaseAnonKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}
/** Un plan publicado con sus paradas (`get_plan`), o null. */
export async function planBySlug(slug) {
  if (!SLUG.test(slug ?? '') || isDemo) return null;
  return rpc('get_plan', { p_slug: slug });
}
/** Planes publicados de una ocasión (`get_plans`), los más guardados primero. */
export async function plansFor(occasion) {
  if (isDemo) return [];
  return rpc('get_plans', { p_occasion: occasion });
}
/** "3 paradas · 5 h · $$", igual que `Itinerary.facts` de la app. */
export function planFacts(plan) {
  const parts = [`${plan.stops.length} paradas`];
  const m = plan.duration_minutes;
  if (m) parts.push(m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} min`);
  if (plan.budget) parts.push(plan.budget);
  return parts.join(' · ');
}
/** "19:30" de "19:30:00". */
export function planClock(time) { return time ? String(time).slice(0, 5) : null; }
export function planCover(plan) { return plan.cover_photo || photoURLs(plan.stops[0]?.place ?? {})[0] || null; }
export function planURL(plan) { return `/plan/${plan.occasion}/${plan.slug}/`; }
export function planCard(plan) {
  const cover = planCover(plan);
  return el('a', { class: 'plan-card', href: planURL(plan) },
    cover ? el('img', { src: cover, alt: '', loading: 'lazy' }) : null,
    el('span', {}, el('b', {}, plan.title), el('small', {}, planFacts(plan)),
      el('small', { class: 'route' }, plan.stops.map(s => s.place.name).join(' → '))));
}

export async function placesByCreator(userId, limit = 9) {
  if (!userId) return [];
  if (isDemo) return (await demo()).places.filter(p => String(p.created_by).toLowerCase() === userId.toLowerCase()).slice(0, limit);
  return rest(`places?select=${PLACE_COLUMNS}&created_by=eq.${userId.toLowerCase()}&order=created_at.desc&limit=${limit}`);
}

// ------------------------------------------------------------------ DOM
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'style') node.style.cssText = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) node.append(c.nodeType ? c : String(c));
  return node;
}
export function chip(label, [color, icon]) {
  return el('span', { class: 'chip', style: `color:${color};background:color-mix(in srgb, ${color} 12%, transparent)` }, `${icon} ${label}`);
}
export function avatar(profile, size) {
  const name = profile?.name || profile?.username || 'I';
  if (profile?.photourl) return el('img', { class: 'avatar', src: profile.photourl, alt: '', loading: 'lazy', width: size, height: size });
  return el('span', { class: 'avatar', 'aria-hidden': 'true' }, name.trim()[0]?.toUpperCase() ?? 'I');
}
export function placeTile(place) {
  const photo = photoURLs(place)[0];
  return el('a', { class: 'tile', href: `/lugar/?id=${place.id}` },
    photo ? el('img', { src: photo, alt: '', loading: 'lazy' }) : null,
    el('span', { class: 'cap' }, place.name, el('small', {}, perfectPhrase(place))));
}
export function gateTile(text = 'Ve todos en la app') {
  return el('button', { class: 'tile gate', type: 'button', onclick: () => openInstallSheet('grid') }, el('span', {}, '＋'), text);
}
export function skeletonTiles(n) { return Array.from({ length: n }, () => el('div', { class: 'tile skeleton' })); }

export const ICONS = {
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.6C1.6 7.6 3.8 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.9 1.3-1.8 2.9-2.9 4.9-2.9 3.3 0 5.5 3.1 4.4 6.4-1.8 5-9.3 9.6-9.3 9.6Z"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M6 3.5h12v17l-6-4.3-6 4.3v-17Z"/></svg>',
  route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v6.5h14V13"/></svg>',
};
export function iconButton(name, label, onclick) {
  const b = el('button', { class: 'icon-btn', type: 'button', 'aria-label': label, onclick });
  b.innerHTML = ICONS[name]; // SVG fijo del código, no datos
  return b;
}

// ------------------------------------------------------------------ instalar
const ua = navigator.userAgent;
export const platform = /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop';

export function storeButtons({ compact = false } = {}) {
  const cls = compact ? 'btn btn-primary btn-small' : 'btn btn-primary';
  const ios = el('a', { class: cls, href: CONFIG.appStoreUrl }, 'Descargar para iPhone');
  const android = CONFIG.playStoreUrl
    ? el('a', { class: compact ? 'btn btn-ghost btn-small' : 'btn btn-ghost', href: CONFIG.playStoreUrl }, 'Descargar para Android')
    : el('span', { class: compact ? 'btn btn-ghost btn-small' : 'btn btn-ghost', 'aria-disabled': 'true' }, 'Android · muy pronto');
  return platform === 'android' ? [android, ios] : [ios, android];
}

const REASONS = {
  like: ['Dale like en la app', 'Los likes ayudan a que los mejores lugares suban. Se hacen desde Itervia.'],
  save: ['Guarda este lugar en la app', 'Arma tu lista de planes y tenla a la mano cuando alguien pregunte "¿a dónde vamos?".'],
  route: ['Cómo llegar, en la app', 'Dirección exacta, mapa y la ruta desde donde estés.'],
  photos: ['Ve todas las fotos en la app', 'Galería completa, precio, pagos y estacionamiento.'],
  follow: ['Sigue a quien recomienda bien', 'Ve primero los lugares nuevos de las personas que sigues.'],
  grid: ['Hay más lugares en la app', 'Explora por zona, por plan o cerca de ti.'],
  plan: ['Guarda este plan en la app', 'Mapa con las paradas, horarios de hoy y cómo llegar a cada una.'],
  default: ['Esto se hace en la app', 'La web solo muestra una vista previa. Descarga Itervia gratis.'],
};
let sheetNodes;
export function openInstallSheet(reason = 'default') {
  const [title, text] = REASONS[reason] ?? REASONS.default;
  if (!sheetNodes) {
    const backdrop = el('div', { class: 'sheet-backdrop', onclick: closeInstallSheet });
    const sheet = el('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sheet-title' });
    document.body.append(backdrop, sheet);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInstallSheet(); });
    sheetNodes = { backdrop, sheet };
  }
  const { backdrop, sheet } = sheetNodes;
  sheet.replaceChildren(
    el('div', { class: 'grab', 'aria-hidden': 'true' }),
    el('img', { class: 'logo', src: '/assets/logo.png', alt: '' }),
    el('h2', { id: 'sheet-title' }, title),
    el('p', {}, text),
    el('div', { class: 'stack' },
      storeButtons().map(b => { b.classList.add('btn-block'); return b; }),
      platform === 'ios' ? el('a', { class: 'btn btn-ghost btn-block', href: CONFIG.appScheme }, 'Ya la tengo: abrir Itervia') : null,
      el('button', { class: 'btn btn-ghost btn-block', type: 'button', onclick: closeInstallSheet }, 'Seguir viendo')),
  );
  backdrop.classList.add('open');
  sheet.classList.add('open');
  sheet.querySelector('a, button')?.focus();
}
export function closeInstallSheet() {
  sheetNodes?.backdrop.classList.remove('open');
  sheetNodes?.sheet.classList.remove('open');
}

export function stickyCTA(title, subtitle) {
  document.body.classList.add('has-sticky');
  document.body.append(el('div', { class: 'sticky-cta' },
    el('img', { src: '/assets/logo.png', alt: '' }),
    el('div', {}, el('b', {}, title), subtitle),
    el('button', { class: 'btn btn-primary btn-small', type: 'button', onclick: () => openInstallSheet('default') }, 'Abrir app')));
}

export function demoNotice() {
  return isDemo ? el('p', { class: 'notice', role: 'note' }, 'Modo demo: falta la anon key en assets/config.js. Los lugares son de ejemplo.') : null;
}
