import test from 'node:test';
import assert from 'node:assert/strict';
import { campanaDePagina, campanaFinal } from '../assets/campana.js';

test('cada tipo de página tiene su ct', () => {
  assert.equal(campanaDePagina('/'), 'web-portada');
  assert.equal(campanaDePagina('/lugar/'), 'web-lugar');
  assert.equal(campanaDePagina('/lugar/0116be59-d921-4729-874b-835153c118ff/'), 'web-lugar');
  assert.equal(campanaDePagina('/plan/'), 'web-plan');
  assert.equal(campanaDePagina('/plan/cita/'), 'web-plan');
  assert.equal(campanaDePagina('/plan/ruta/'), 'web-ruta');
  assert.equal(campanaDePagina('/plan/cita/jazz-y-un-trago-juarez/'), 'web-ruta');
  assert.equal(campanaDePagina('/perfil/'), 'web-perfil');
  assert.equal(campanaDePagina('/soporte/'), 'web-portada');
});

test('el ?c= del anuncio gana si es válido', () => {
  assert.equal(campanaFinal('/lugar/', '?id=1&c=ads-cita-reel9'), 'ads-cita-reel9');
  assert.equal(campanaFinal('/plan/cita/', '?c=Mal Formato'), 'web-plan');
  assert.equal(campanaFinal('/plan/cita/', '?c=' + 'a'.repeat(31)), 'web-plan');
  assert.equal(campanaFinal('/plan/cita/', '?c=' + 'a'.repeat(30)), 'a'.repeat(30));
  assert.equal(campanaFinal('/lugar/', ''), 'web-lugar');
});
