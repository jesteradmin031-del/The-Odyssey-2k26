import test from 'node:test';
import assert from 'node:assert/strict';
import { getRoutes } from '../src/services/api.js';
import { places } from '../shared/data.js';
const trip = { origin: places[0], destination: places[1], mode: 'walking' };
test('non-JSON HTTP errors retain their status instead of simulating success', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => {
      throw new SyntaxError('HTML response');
    },
  });
  try {
    await assert.rejects(
      getRoutes(trip),
      (error) => error.status === 429 && /429/.test(error.message),
    );
  } finally {
    globalThis.fetch = original;
  }
});
test('network failure still returns labelled offline routes', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };
  try {
    const result = await getRoutes(trip);
    assert.equal(result.source, 'demo');
    assert.match(result.notice, /unavailable/i);
  } finally {
    globalThis.fetch = original;
  }
});
