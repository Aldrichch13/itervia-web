// Prueba del `ct` por tipo de página: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.location = { search: '', pathname: '/' };
const { appStoreLink, pageCampaign } = await import('../assets/app.js');

const ct = (path, search = '') => new URL(appStoreLink(search, path)).searchParams.get('ct');

test('cada tipo de página manda su ct', () => {
  assert.equal(ct('/'), 'web-portada');
  assert.equal(ct('/lugar/'), 'web-lugar');
  assert.equal(ct('/lugar/0116be59-d921-4729-874b-835153c118ff/'), 'web-lugar');
  assert.equal(ct('/plan/cita/'), 'web-plan');
  assert.equal(ct('/plan/ruta/'), 'web-ruta');
  assert.equal(ct('/plan/cita/cita-barata-coyoacan/'), 'web-ruta');
  assert.equal(ct('/perfil/'), 'web-portada');
});

test('el ?c= del anuncio manda sobre el tipo de página', () => {
  assert.equal(ct('/lugar/', '?c=ads-marca-reel9'), 'ads-marca-reel9');
  assert.equal(ct('/plan/cita/', '?c=ads-cita-1'), 'ads-cita-1');
});

test('un ?c= inválido se ignora', () => {
  assert.equal(ct('/lugar/', '?c=Mal%20Valor'), 'web-lugar');
  assert.equal(ct('/plan/cita/', '?c=' + 'a'.repeat(31)), 'web-plan');
});

test('el enlace conserva pt y mt', () => {
  const u = new URL(appStoreLink('', '/lugar/'));
  assert.equal(u.searchParams.get('pt'), '128499590');
  assert.equal(u.searchParams.get('mt'), '8');
  assert.equal(pageCampaign('/plan/trabajar/'), 'web-plan');
});
