import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleNetwork } from '../shared/local-network.js';
import {
  activeClosures,
  createClosure,
  edgeCost,
  findLocalRoute,
  validateNetwork,
} from '../shared/local-routing.js';
const network = validateNetwork(sampleNetwork);
const base = { start: 'west', end: 'library', now: 1000 };
const close = (edgeId, expiresAt = null) =>
  createClosure(network, { edgeId, expiresAt, text: 'Confirmed sample closure' }, 500);

test('local engine calculates the sample shortest route and actual closure detour', () => {
  const original = findLocalRoute(network, base);
  assert.equal(original.metres, 390);
  assert.deepEqual(original.edgeIds, ['west-plaza', 'library-steps']);
  const alternative = findLocalRoute(network, { ...base, closures: [close('library-steps')] });
  assert.equal(alternative.metres, 570);
  assert.equal(alternative.metres - original.metres, 180);
  assert.ok(!alternative.edgeIds.includes('library-steps'));
  assert.deepEqual(alternative.nodeIds, ['west', 'plaza', 'garden', 'library']);
});

test('preferences choose different routes with explainable costs', () => {
  const stairs = findLocalRoute(network, { ...base, preference: 'stairs' });
  assert.equal(stairs.stairs, 0);
  assert.equal(stairs.metres, 570);
  const crossings = findLocalRoute(network, { ...base, preference: 'crossings' });
  assert.equal(crossings.crossings, 0);
  assert.equal(crossings.metres, 580);
  assert.equal(findLocalRoute(network, { ...base, stepFree: true }).stairs, 0);
  assert.throws(() => findLocalRoute(network, { ...base, preference: 'toString' }), /Unknown/);
});

test('unknown attributes remain visible and cannot pass the strict zero-stair filter', () => {
  const unknown = validateNetwork({
    ...network,
    edges: network.edges.map((e) => ({ ...e, stairs: null })),
  });
  assert.equal(findLocalRoute(unknown, { ...base, stepFree: true }), null);
  assert.ok(findLocalRoute(unknown, base).unknownStairs > 0);
  assert.equal(edgeCost({ metres: 10, stairs: null, crossings: 0 }, 'stairs'), 210);
});

test('closures expire at the exact boundary, reject stale evidence timing and reopen routes', () => {
  const closure = close('library-steps', 1200);
  assert.equal(activeClosures([closure], 1199).length, 1);
  assert.equal(activeClosures([closure], 1200).length, 0);
  assert.equal(findLocalRoute(network, { ...base, closures: [closure], now: 1200 }).metres, 390);
  assert.throws(
    () =>
      createClosure(network, { edgeId: 'library-steps', text: 'closed', expiresAt: 1000 }, 1000),
    /future/,
  );
  assert.throws(() => createClosure(network, { edgeId: 'fake', text: 'closed' }), /Choose/);
  assert.equal(activeClosures([{ ...closure, createdAt: 2000 }], 1000).length, 0);
});

test('disconnected routes fail without invented geometry; equal endpoints need no travel', () => {
  const closures = network.edges
    .filter((e) => e.from === 'library' || e.to === 'library')
    .map((e) => close(e.id));
  assert.equal(findLocalRoute(network, { ...base, closures }), null);
  assert.equal(findLocalRoute(network, { ...base, end: 'west', closures }).metres, 0);
  assert.throws(() => findLocalRoute(network, { ...base, start: 'missing' }), /endpoints/);
});

test('import validation rejects malformed networks and keeps only supported fields', () => {
  for (const patch of [
    { metres: -1 },
    { metres: Infinity },
    { stairs: -1 },
    { crossings: 0.5 },
    { from: 'missing' },
    { to: 'west' },
  ]) {
    assert.throws(() =>
      validateNetwork({ ...network, edges: [{ ...network.edges[0], ...patch }] }),
    );
  }
  assert.throws(
    () => validateNetwork({ ...network, nodes: [network.nodes[0], network.nodes[0]] }),
    /unique/,
  );
  assert.throws(
    () => validateNetwork({ ...network, edges: [network.edges[0], network.edges[0]] }),
    /unique/,
  );
  assert.equal(validateNetwork({ ...network, unexpected: 'discard me' }).unexpected, undefined);
});

test('Dijkstra scores match an independent exhaustive simple-path oracle', () => {
  function exhaustive(start, end, pref, closed) {
    let best = Infinity;
    function visit(id, seen, total) {
      if (id === end) {
        best = Math.min(best, total);
        return;
      }
      for (const e of network.edges) {
        if (closed.has(e.id)) continue;
        const next = e.from === id ? e.to : e.to === id ? e.from : null;
        if (!next || seen.has(next)) continue;
        const weight = pref === 'stairs' ? 200 : pref === 'crossings' ? 250 : 0;
        const attribute = pref === 'stairs' ? e.stairs : pref === 'crossings' ? e.crossings : 0;
        visit(
          next,
          new Set([...seen, next]),
          total + e.metres + (attribute === null ? weight : attribute * weight),
        );
      }
    }
    visit(start, new Set([start]), 0);
    return best;
  }
  for (const preference of ['shortest', 'stairs', 'crossings']) {
    for (const end of ['library', 'east', 'cafe', 'south']) {
      for (const ids of [[], ['library-steps'], ['west-plaza', 'garden-east']]) {
        const result = findLocalRoute(network, {
          ...base,
          end,
          preference,
          closures: ids.map((id) => close(id)),
        });
        assert.equal(result?.score ?? Infinity, exhaustive('west', end, preference, new Set(ids)));
      }
    }
  }
});
