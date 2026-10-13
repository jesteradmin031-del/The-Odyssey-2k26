// Dijkstra's algorithm is established computer science. This implementation, the
// closure lifecycle, scoring model and evidence workflow live in this project.
export const routePreferences = {
  shortest: { label: 'Shortest distance', stairs: 0, crossings: 0, unknown: 0 },
  stairs: { label: 'Fewer stairs', stairs: 200, crossings: 0, unknown: 200 },
  crossings: { label: 'Fewer crossings', stairs: 0, crossings: 250, unknown: 250 },
};
const isText = (s, max = 160) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
const idOK = (s) => typeof s === 'string' && /^[a-zA-Z0-9_-]{1,60}$/.test(s);
const countOK = (n) => n === null || (Number.isInteger(n) && n >= 0 && n <= 100);

export function validateNetwork(input) {
  if (!input || input.version !== 1 || !isText(input.name) || !isText(input.provenance, 1000))
    throw new Error('Network needs version 1, a name and a provenance statement.');
  if (
    !Array.isArray(input.nodes) ||
    input.nodes.length < 2 ||
    input.nodes.length > 200 ||
    !Array.isArray(input.edges) ||
    input.edges.length < 1 ||
    input.edges.length > 500
  )
    throw new Error('Use 2–200 nodes and 1–500 paths.');
  const ids = new Set();
  const nodes = input.nodes.map((n) => {
    if (
      !n ||
      !idOK(n.id) ||
      ids.has(n.id) ||
      !isText(n.name) ||
      ![n.x, n.y].every((v) => Number.isFinite(v) && v >= 0 && v <= 10000)
    )
      throw new Error(
        'Each node needs a unique ID, name and numeric x/y coordinates from 0 to 10000.',
      );
    ids.add(n.id);
    return { id: n.id, name: n.name, x: n.x, y: n.y };
  });
  const edgeIds = new Set();
  const edges = input.edges.map((e) => {
    if (
      !e ||
      !idOK(e.id) ||
      edgeIds.has(e.id) ||
      !ids.has(e.from) ||
      !ids.has(e.to) ||
      e.from === e.to ||
      !isText(e.name) ||
      !Number.isFinite(e.metres) ||
      e.metres <= 0 ||
      e.metres > 100000 ||
      !countOK(e.stairs) ||
      !countOK(e.crossings) ||
      !isText(e.evidence, 1000)
    )
      throw new Error(
        'Each path needs a unique ID, valid endpoints, positive distance, evidence and nonnegative attribute counts (or null for unknown).',
      );
    edgeIds.add(e.id);
    return {
      id: e.id,
      from: e.from,
      to: e.to,
      name: e.name,
      metres: e.metres,
      stairs: e.stairs,
      crossings: e.crossings,
      evidence: e.evidence,
    };
  });
  return { version: 1, name: input.name, provenance: input.provenance, nodes, edges };
}

export function activeClosures(closures, now = Date.now()) {
  return closures.filter(
    (c) =>
      c &&
      typeof c.edgeId === 'string' &&
      Number.isFinite(c.createdAt) &&
      c.createdAt <= now &&
      (c.expiresAt === null || (Number.isFinite(c.expiresAt) && c.expiresAt > now)),
  );
}

export function createClosure(network, { edgeId, text, expiresAt = null }, now = Date.now()) {
  if (!network.edges.some((e) => e.id === edgeId))
    throw new Error('Choose a path in this network.');
  if (!isText(text, 6000)) throw new Error('Add the reviewed notice or your observation.');
  if (expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= now))
    throw new Error('Closure expiry must be in the future.');
  return { edgeId, text: text.trim(), createdAt: now, expiresAt };
}

export function edgeCost(edge, preference) {
  if (!Object.hasOwn(routePreferences, preference)) throw new Error('Unknown route preference.');
  const p = routePreferences[preference];
  if (!p) throw new Error('Unknown route preference.');
  const relevantUnknown =
    (p.stairs > 0 && edge.stairs === null) || (p.crossings > 0 && edge.crossings === null);
  return (
    edge.metres +
    (edge.stairs ?? 0) * p.stairs +
    (edge.crossings ?? 0) * p.crossings +
    (relevantUnknown ? p.unknown : 0)
  );
}

export function findLocalRoute(
  network,
  { start, end, preference = 'shortest', stepFree = false, closures = [], now = Date.now() },
) {
  if (!Object.hasOwn(routePreferences, preference)) throw new Error('Unknown route preference.');
  const nodes = new Map(network.nodes.map((n) => [n.id, n]));
  if (!nodes.has(start) || !nodes.has(end)) throw new Error('Choose endpoints in this network.');
  const blocked = new Set(activeClosures(closures, now).map((c) => c.edgeId));
  const adjacency = new Map(network.nodes.map((n) => [n.id, []]));
  for (const edge of network.edges) {
    if (blocked.has(edge.id) || (stepFree && edge.stairs !== 0)) continue;
    adjacency.get(edge.from).push({ edge, next: edge.to });
    adjacency.get(edge.to).push({ edge, next: edge.from });
  }
  const costs = new Map([[start, 0]]),
    previous = new Map(),
    visited = new Set();
  let relaxed = 0;
  while (true) {
    let current = null,
      best = Infinity;
    for (const [id, cost] of costs)
      if (!visited.has(id) && cost < best) {
        current = id;
        best = cost;
      }
    if (current === null) return null;
    visited.add(current);
    if (current === end) break;
    for (const { edge, next } of adjacency.get(current)) {
      const candidate = best + edgeCost(edge, preference);
      if (candidate < (costs.get(next) ?? Infinity)) {
        costs.set(next, candidate);
        previous.set(next, { from: current, edge });
        relaxed++;
      }
    }
  }
  const edges = [],
    nodeIds = [end];
  for (let cursor = end; cursor !== start;) {
    const item = previous.get(cursor);
    edges.unshift(item.edge);
    cursor = item.from;
    nodeIds.unshift(cursor);
  }
  return {
    nodeIds,
    edgeIds: edges.map((e) => e.id),
    metres: edges.reduce((sum, e) => sum + e.metres, 0),
    stairs: edges.reduce((sum, e) => sum + (e.stairs ?? 0), 0),
    crossings: edges.reduce((sum, e) => sum + (e.crossings ?? 0), 0),
    unknownStairs: edges.filter((e) => e.stairs === null).length,
    unknownCrossings: edges.filter((e) => e.crossings === null).length,
    score: costs.get(end),
    visited: visited.size,
    relaxed,
    steps: edges.map((e, i) => ({
      name: e.name,
      to: nodes.get(nodeIds[i + 1]).name,
      metres: e.metres,
      id: e.id,
    })),
  };
}
