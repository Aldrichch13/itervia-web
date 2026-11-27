// Campaña (`ct`) del enlace a la App Store según el tipo de página (docs/medicion.md §1 del repo de la app).
// Función pura, sin DOM: la usa assets/app.js y la prueba tests/campana.test.mjs.
// Un anuncio puede traer ?c=<campaña> (minúsculas, números y guiones, máx. 30) y ese gana.
export const CAMPANA_PORTADA = 'web-portada';

export function campanaDePagina(pathname = '/') {
  const partes = pathname.split('/').filter(Boolean);
  if (partes[0] === 'lugar') return 'web-lugar';
  if (partes[0] === 'plan') {
    // /plan/ y /plan/<plan>/ son el aterrizaje del plan; /plan/ruta/ y /plan/<plan>/<slug>/ son una ruta.
    return partes[1] === 'ruta' || partes.length >= 3 ? 'web-ruta' : 'web-plan';
  }
  if (partes[0] === 'perfil') return 'web-perfil';
  return CAMPANA_PORTADA;
}

export function campanaFinal(pathname, search = '') {
  const c = new URLSearchParams(search).get('c') || '';
  return /^[a-z0-9-]{1,30}$/.test(c) ? c : campanaDePagina(pathname);
}
