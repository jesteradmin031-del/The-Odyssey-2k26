import { distanceKm, demoRoutes } from './demo.js';

// Deliberately conservative: this is a text cue, never a verified incident feed.
export function inspectNotice(text, { validUntil = '', now = Date.now() } = {}) {
  const clean = text.trim();
  const expired = Boolean(
    validUntil && Number.isFinite(Date.parse(validUntil)) && Date.parse(validUntil) <= now,
  );
  const closure =
    /\b(closed|closure|blocked|shut|no entry|do not enter)\b|ಮುಚ್ಚ|ಬಂದ್|बंद|प्रवेश निषेध|மூட|మూసి/i.test(
      clean,
    );
  const diversion =
    /\b(diverted|diversion|detour|alternative entrance|use .*entrance)\b|ಬದಲಿ|परिवर्तन/i.test(
      clean,
    );
  const uncertain =
    /\b(not closed|not blocked|reopened|open again|closure cancelled|closure canceled)\b/i.test(
      clean,
    );
  const kind = uncertain ? 'review' : closure ? 'closure' : diversion ? 'diversion' : 'review';
  return {
    kind,
    expired,
    title: expired
      ? 'This notice has expired'
      : kind === 'closure'
        ? 'Possible closure mentioned'
        : kind === 'diversion'
          ? 'Possible diversion mentioned'
          : 'Review this notice manually',
    detail: expired
      ? 'The expiry you entered has passed. Check for a newer notice before changing your trip.'
      : 'Text cues are not verification. Confirm the affected location, dates and alternative on the sign or with staff.',
    canApply: !expired && clean.length > 0,
  };
}

export function routesWithStop(origin, destination, mode, stop) {
  if (!stop) return demoRoutes(origin, destination, mode);
  const first = demoRoutes(origin, stop, mode);
  const last = demoRoutes(stop, destination, mode);
  return first.map((route, i) => ({
    ...route,
    title: i ? 'Explore via your stop' : 'Via your stop',
    coordinates: [...route.coordinates, ...last[i].coordinates.slice(1)],
    distance: route.distance + last[i].distance,
    duration: route.duration + last[i].duration,
    steps: [...route.steps, ...last[i].steps.slice(1)],
  }));
}

export function nearbyStops(origin, destination, places) {
  if (!origin || !destination) return [];
  const direct = distanceKm(origin.coordinates, destination.coordinates);
  return places
    .filter(
      (p) =>
        p.id !== origin.id && p.id !== destination.id && ['Cafés', 'Parks'].includes(p.category),
    )
    .map((place) => ({
      place,
      extraMetres: Math.max(
        0,
        Math.round(
          (distanceKm(origin.coordinates, place.coordinates) +
            distanceKm(place.coordinates, destination.coordinates) -
            direct) *
            1000,
        ),
      ),
    }))
    .sort((a, b) => a.extraMetres - b.extraMetres)
    .slice(0, 3);
}

const escapeHTML = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function tripDocument({
  origin,
  destination,
  stop,
  mode,
  route,
  phrases = [],
  note = '',
  notice = '',
}) {
  const e = escapeHTML;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LocalRoute trip card</title><style>body{font:16px/1.6 system-ui;margin:40px auto;padding:0 24px;max-width:680px;color:#183b34;background:#f8faf6}h1{font-size:36px;line-height:1.2}article{background:white;border:1px solid #dce4dc;border-radius:16px;padding:24px;margin:20px 0}small{color:#53685e}li{margin:12px 0}p{white-space:pre-wrap}@media print{body{margin:0;background:white}}</style><small>LOCALROUTE / YOUR POCKET JOURNEY</small><h1>${e(destination.name)}</h1><article><strong>${e(origin.name)} → ${stop ? `${e(stop.name)} → ` : ''}${e(destination.name)}</strong><p>${e(mode)} · ${e((route.distance / 1000).toFixed(1))} km · ${e(Math.round(route.duration / 60))} min</p><p>${route.source === 'demo' ? 'SIMULATED ROUTE — not road directions.' : 'Route preview — no live tracking or traffic updates.'}</p><p>Destination: ${e(destination.coordinates[1])}, ${e(destination.coordinates[0])}</p><small>Snapshot created ${e(new Date().toISOString())}. This file does not update.</small></article><article><h2>Directions preview</h2><ol>${route.steps.map((s) => `<li>${e(s.instruction)}</li>`).join('')}</ol></article>${notice ? `<article><h2>Notice reviewed by you</h2><p>${e(notice)}</p><small>Unverified personal note; check current conditions.</small></article>` : ''}${note ? `<article><h2>Your notes</h2><p>${e(note)}</p></article>` : ''}<article><h2>Useful phrases</h2>${phrases.map((p) => `<p><strong>${e(p.en)}</strong><br>${e(p.translated)}</p>`).join('')}</article><small>Saved locally. Share this file only with people you choose; it contains your planned trip. Offline card, not an offline map.</small></html>`;
}
