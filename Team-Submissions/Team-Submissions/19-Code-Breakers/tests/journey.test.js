import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectNotice, routesWithStop, tripDocument } from '../shared/journey.js';
import { places } from '../shared/data.js';
import { routePlaces } from '../server/providers.js';

test('notice cues remain unverified and an expired notice cannot be applied', () => {
  assert.equal(inspectNotice('Entrance closed.').kind, 'closure');
  assert.equal(inspectNotice('ಪ್ರವೇಶ ಮುಚ್ಚಲಾಗಿದೆ').kind, 'closure');
  assert.equal(inspectNotice('Entrance not closed').kind, 'review');
  assert.equal(inspectNotice('Service has reopened').kind, 'review');
  assert.equal(inspectNotice('Use east entrance').kind, 'diversion');
  assert.equal(inspectNotice('').canApply, false);
  const expired = inspectNotice('Entrance closed', {
    validUntil: '2026-01-01T12:00:00Z',
    now: Date.parse('2026-01-02T00:00:00Z'),
  });
  assert.equal(expired.expired, true);
  assert.equal(expired.canApply, false);
});

test('stop routes preserve all three locations in every alternative', () => {
  const routes = routesWithStop(places[0], places[1], 'walking', places[2]);
  for (const route of routes) {
    assert.deepEqual(route.coordinates[0], places[0].coordinates);
    assert.deepEqual(route.coordinates.at(-1), places[1].coordinates);
    assert.ok(
      route.coordinates.some((p) => JSON.stringify(p) === JSON.stringify(places[2].coordinates)),
    );
    assert.ok(route.steps.some((s) => s.instruction.includes(places[2].name)));
  }
});

test('trip export is standalone and escapes untrusted notes and instructions', () => {
  const html = tripDocument({
    origin: places[0],
    destination: places[1],
    mode: 'walking',
    route: {
      ...routesWithStop(places[0], places[1], 'walking')[0],
      steps: [{ instruction: '<img src=x onerror=alert(1)>' }],
    },
    note: '</p><script>alert(1)</script>',
    phrases: [{ en: 'Hello', translated: 'ನಮಸ್ಕಾರ' }],
  });
  assert.ok(html.includes('ನಮಸ್ಕಾರ'));
  assert.ok(html.includes('SIMULATED ROUTE'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('https://'));
});

test('live route request includes the intermediate stop and geographic step positions', async () => {
  let sent;
  const routes = await routePlaces(
    places[0],
    places[1],
    'walking',
    'fixture-key',
    async (url, options) => {
      sent = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          features: [
            {
              geometry: {
                coordinates: [places[0].coordinates, places[2].coordinates, places[1].coordinates],
              },
              properties: {
                summary: { distance: 1200, duration: 900 },
                segments: [
                  { steps: [{ instruction: 'At stop', distance: 100, way_points: [1, 2] }] },
                ],
              },
            },
          ],
        }),
      };
    },
    places[2],
  );
  assert.deepEqual(sent.coordinates, [
    places[0].coordinates,
    places[2].coordinates,
    places[1].coordinates,
  ]);
  assert.deepEqual(routes[0].steps[0].coordinates, places[2].coordinates);
});
