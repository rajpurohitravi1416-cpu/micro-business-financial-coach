import assert from 'node:assert/strict';
import test from 'node:test';
import { getTimeGreeting } from './timeGreeting.js';

test('greeting follows the requested local-hour boundaries', () => {
  for (const hour of [5, 6, 11]) assert.equal(getTimeGreeting(hour), 'Good morning');
  for (const hour of [12, 13, 16]) assert.equal(getTimeGreeting(hour), 'Good afternoon');
  for (const hour of [17, 18, 20]) assert.equal(getTimeGreeting(hour), 'Good evening');
  for (const hour of [0, 1, 4, 21, 22, 23]) assert.equal(getTimeGreeting(hour), 'Welcome back');
});

test('rejects invalid hour values', () => {
  assert.throws(() => getTimeGreeting(-1), RangeError);
  assert.throws(() => getTimeGreeting(24), RangeError);
});
