import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { places, phrasebook, languages } from '../shared/data.js';
import { demoRoutes, demoTranslate } from '../shared/demo.js';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function withServer(config, run, fetcher) {
  const app = createApp({ AUTH_DB_PATH: ':memory:', ...config }, fetcher);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, body, headers = {}) => {
    const res = await fetch(base + path, {
      method: body ? 'POST' : 'GET',
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: res.status,
      data: await res.json(),
      cookie: res.headers.get('set-cookie')?.split(';')[0],
      rawCookie: res.headers.get('set-cookie'),
    };
  };
  try {
    await run(call);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    app.locals.closeDatabase();
  }
}
const trip = { origin: places[0], destination: places[1], mode: 'walking' };

test('demo routes preserve endpoints and travel modes change time', () => {
  const walk = demoRoutes(trip.origin, trip.destination, 'walking')[0];
  const cycle = demoRoutes(trip.origin, trip.destination, 'cycling')[0];
  assert.deepEqual(walk.coordinates[0], trip.origin.coordinates);
  assert.deepEqual(walk.coordinates.at(-1), trip.destination.coordinates);
  assert.ok(walk.distance > 0);
  assert.ok(walk.duration > cycle.duration);
  assert.equal(walk.source, 'demo');
  assert.ok(demoRoutes(trip.origin, trip.destination)[1].distance > walk.distance);
});
test('all phrasebook language pairs work, unknown text is never fabricated', () => {
  for (const p of phrasebook)
    for (const from of languages)
      for (const to of languages) {
        assert.equal(demoTranslate(p[from.code], from.code, to.code).text, p[to.code]);
      }
  assert.equal(demoTranslate('A completely different sentence', 'en', 'kn'), null);
});
test('demo API works without any keys and labels results', () =>
  withServer({}, async (call) => {
    assert.equal((await call('/api/health')).data.routing, 'demo');
    const search = await call('/api/places?q=cubbon');
    assert.ok(search.data.places.length >= 1);
    assert.equal(search.data.source, 'demo');
    const routes = await call('/api/routes', trip);
    assert.equal(routes.status, 200);
    assert.equal(routes.data.routes.length, 2);
    const ai = await call('/api/assistant', { message: 'Where is coffee?', context: trip });
    assert.match(ai.data.text, /Coffee House/);
    assert.equal(ai.data.source, 'demo');
    const translation = await call('/api/translate', { text: 'Thank you', from: 'en', to: 'hi' });
    assert.equal(translation.data.text, 'धन्यवाद');
    const transport = await call('/api/transport');
    assert.equal(transport.data.available, false);
  }));

test('registration, login, session cookies and logout work without exposing password hashes', () =>
  withServer({}, async (call) => {
    const details = {
      name: 'Test Explorer',
      email: 'Explorer@Example.com',
      password: 'a-strong-test-password',
    };
    assert.equal((await call('/api/auth/register', { ...details, password: 'weak' })).status, 400);
    const registered = await call('/api/auth/register', details);
    assert.equal(registered.status, 201);
    assert.equal(registered.data.user.email, 'explorer@example.com');
    assert.match(registered.rawCookie, /HttpOnly/);
    assert.match(registered.rawCookie, /SameSite=Lax/);
    assert.doesNotMatch(JSON.stringify(registered.data), /password|salt|token/);
    assert.equal(
      (await call('/api/auth/me', null, { Cookie: registered.cookie })).data.user.name,
      'Test Explorer',
    );
    assert.equal((await call('/api/auth/register', details)).status, 409);
    assert.equal(
      (await call('/api/auth/login', { email: details.email, password: 'wrong password' })).status,
      401,
    );
    const logged = await call('/api/auth/login', details);
    assert.equal(logged.status, 200);
    await call('/api/auth/logout', {}, { Cookie: logged.cookie });
    assert.equal((await call('/api/auth/me', null, { Cookie: logged.cookie })).data.user, null);
    assert.equal(
      (await call('/api/auth/me', null, { Cookie: 'localroute_session=invalid' })).data.user,
      null,
    );
  }));

test('accounts and sessions persist across a backend restart', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'localroute-test-'));
  const database = join(directory, 'accounts.sqlite');
  let cookie;
  try {
    await withServer({ AUTH_DB_PATH: database }, async (call) => {
      cookie = (
        await call('/api/auth/register', {
          name: 'Persistent User',
          email: 'persistent@example.com',
          password: 'persistent-test-password',
        })
      ).cookie;
    });
    await withServer({ AUTH_DB_PATH: database }, async (call) => {
      assert.equal(
        (await call('/api/auth/me', null, { Cookie: cookie })).data.user.name,
        'Persistent User',
      );
      assert.equal(
        (
          await call('/api/auth/login', {
            email: 'persistent@example.com',
            password: 'persistent-test-password',
          })
        ).status,
        200,
      );
    });
  } finally {
    rmSync(database, { force: true });
    rmdirSync(directory);
  }
});
test('API rejects invalid coordinates, modes, equal points and malformed inputs', () =>
  withServer({}, async (call) => {
    assert.equal((await call('/api/routes', { ...trip, mode: 'flying' })).status, 400);
    assert.equal(
      (await call('/api/routes', { ...trip, origin: { ...places[0], coordinates: [200, 12] } }))
        .status,
      400,
    );
    assert.equal((await call('/api/routes', { ...trip, destination: trip.origin })).status, 400);
    assert.equal((await call('/api/routes', { ...trip, stop: trip.origin })).status, 400);
    assert.equal(
      (await call('/api/routes', { ...trip, stop: { name: 'Invalid', coordinates: [999, 12] } }))
        .status,
      400,
    );
    const stopped = await call('/api/routes', { ...trip, stop: places[2] });
    assert.equal(stopped.status, 200);
    assert.ok(
      stopped.data.routes[0].coordinates.some(
        (p) => JSON.stringify(p) === JSON.stringify(places[2].coordinates),
      ),
    );
    assert.equal((await call('/api/assistant', { message: '' })).status, 400);
    assert.equal((await call('/api/places?q=')).status, 400);
    assert.equal(
      (await call('/api/translate', { text: 'Hello', from: 'xx', to: 'hi' })).status,
      400,
    );
    assert.equal(
      (await call('/api/translate', { text: 'Unknown phrase', from: 'en', to: 'kn' })).status,
      503,
    );
    assert.equal(
      (await call('/api/health', null, { Origin: 'https://untrusted.example' })).status,
      403,
    );
  }));
test('provider errors fall back without leaking keys or upstream details', () =>
  withServer(
    { ORS_API_KEY: 'test-secret-ors', OPENAI_API_KEY: 'test-secret-ai' },
    async (call) => {
      const responses = [
        await call('/api/health'),
        await call('/api/routes', trip),
        await call('/api/assistant', { message: 'Hello' }),
        await call('/api/places?q=cubbon'),
      ];
      assert.equal(responses[1].data.source, 'demo');
      assert.ok(responses[1].data.notice);
      assert.equal(responses[2].data.source, 'demo');
      assert.doesNotMatch(JSON.stringify(responses), /test-secret|upstream-private/);
    },
    async () => {
      throw new Error('upstream-private');
    },
  ));
test('live routing adapter uses profile and returns normalized geometry', () => {
  let called = false;
  return withServer(
    { ORS_API_KEY: 'test-key' },
    async (call) => {
      const result = await call('/api/routes', { ...trip, mode: 'cycling' });
      assert.equal(result.data.source, 'openrouteservice');
      assert.equal(result.data.routes[0].distance, 1200);
      assert.equal(called, true);
    },
    async (url, options) => {
      assert.match(String(url), /cycling-regular\/geojson$/);
      assert.equal(options.headers.Authorization, 'test-key');
      assert.deepEqual(JSON.parse(options.body).coordinates, [
        trip.origin.coordinates,
        trip.destination.coordinates,
      ]);
      called = true;
      return {
        ok: true,
        json: async () => ({
          features: [
            {
              geometry: { coordinates: [trip.origin.coordinates, trip.destination.coordinates] },
              properties: {
                summary: { distance: 1200, duration: 240 },
                segments: [{ steps: [{ instruction: 'Continue straight', distance: 1200 }] }],
              },
            },
          ],
        }),
      };
    },
  );
});
test('OpenAI response parsing and translation keep secret server-side', () =>
  withServer(
    { OPENAI_API_KEY: 'private-test-key' },
    async (call) => {
      const result = await call('/api/translate', {
        text: 'Please take me to the park',
        from: 'en',
        to: 'hi',
      });
      assert.equal(result.data.text, 'कृपया मुझे पार्क ले चलिए');
      assert.equal(result.data.source, 'openai');
    },
    async (url, options) => {
      assert.equal(String(url), 'https://api.openai.com/v1/responses');
      assert.equal(options.headers.Authorization, 'Bearer private-test-key');
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.match(body.instructions, /Hindi/);
      return {
        ok: true,
        json: async () => ({
          output: [
            {
              type: 'message',
              content: [{ type: 'output_text', text: 'कृपया मुझे पार्क ले चलिए' }],
            },
          ],
        }),
      };
    },
  ));
