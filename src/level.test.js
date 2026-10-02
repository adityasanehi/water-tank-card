import test from 'node:test';
import assert from 'node:assert';
import { computeLevel } from './level.js';

const s = (state, attributes = {}) => ({ state, attributes });
test('percent entity used directly and clamped', () => {
  assert.equal(computeLevel(s('42', { unit_of_measurement: '%' })), 42);
  assert.equal(computeLevel(s('-5', { unit_of_measurement: '%' })), 0);
  assert.equal(computeLevel(s('130', { unit_of_measurement: '%' })), 100);
});
test('generic entity uses min/max', () => {
  assert.equal(computeLevel(s('0.6', { unit_of_measurement: 'm' }), { min: 0, max: 1.2 }), 50);
  assert.equal(computeLevel(s('2', {}), { min: 0, max: 1.2 }), 100);
  assert.equal(computeLevel(s('-1', {}), { min: 0, max: 1.2 }), 0);
});
test('invalid states give null', () => {
  for (const v of ['unavailable', 'unknown', 'NaN', '', 'abc']) assert.equal(computeLevel(s(v)), null);
  assert.equal(computeLevel(null), null);
  assert.equal(computeLevel(s('5'), { min: 1, max: 1 }), null);
});
