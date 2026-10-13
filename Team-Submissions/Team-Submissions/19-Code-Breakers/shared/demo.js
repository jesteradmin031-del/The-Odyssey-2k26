import { places, modes, phrasebook } from './data.js';
export function searchDemo(query) {
  const q = query.toLowerCase().trim();
  return places.filter((p) => `${p.name} ${p.area} ${p.category}`.toLowerCase().includes(q));
}
export function distanceKm(a, b) {
  const rad = (x) => (x * Math.PI) / 180;
  const h =
    Math.sin(rad(b[1] - a[1]) / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function demoRoutes(origin, destination, mode = 'walking') {
  const a = origin.coordinates,
    b = destination.coordinates;
  return [0, 1].map((i) => {
    const detourLatitude = b[1] + i * (b[1] >= a[1] ? 0.002 : -0.002);
    const coordinates = [
      a,
      [a[0] + (b[0] - a[0]) * 0.28, a[1]],
      [a[0] + (b[0] - a[0]) * 0.28, detourLatitude],
      [b[0], detourLatitude],
      b,
    ];
    const km = coordinates.slice(1).reduce((s, p, j) => s + distanceKm(coordinates[j], p), 0);
    return {
      id: `demo-${i}`,
      title: i ? 'A little more exploring' : 'The direct way',
      distance: Math.round(km * 1000),
      duration: Math.max(60, Math.round((km / modes[mode].speed) * 3600)),
      coordinates,
      source: 'demo',
      steps: [
        { instruction: `Start at ${origin.name}`, distance: 0 },
        { instruction: 'Follow the highlighted illustrative path', distance: Math.round(km * 600) },
        { instruction: `Arrive at ${destination.name}`, distance: Math.round(km * 400) },
      ],
    };
  });
}
export function demoAssistant(message, context = {}) {
  const q = message.toLowerCase();
  if (/safe|night|emergency/.test(q))
    return 'For an unfamiliar route, prefer busy, well-lit public streets and check current local conditions. The safety layer here only shows sample points of interest; it cannot assess danger or guarantee a safe route. You can copy your trip details from the Safety panel.';
  if (/coffee|cafe|café/.test(q))
    return 'Try Indian Coffee House on Church Street from the Cafés filter. Select it to plan your route. This is a curated demo suggestion; check opening hours before you go.';
  if (/translat|language|sign/.test(q))
    return 'Open Translator to type a phrase, speak in your selected language, or scan a sign. You can review extracted text before translating it. The built-in phrasebook works without an AI key.';
  return `For ${context.destination?.name || 'Cubbon Park'}, compare the walking, cycling and driving options in the planner. ${context.mode === 'walking' ? 'Walking gives you time to explore along the way.' : 'Choose a travel mode that suits your trip.'} Demo times and paths are illustrative. Ask me about cafés, safety, or translating a sign.`;
}
const normalize = (s) =>
  s
    .trim()
    .toLocaleLowerCase()
    .replace(/[?!.।¿]/g, '')
    .replace(/\s+/g, ' ');
export function demoTranslate(text, from, to) {
  if (from === to) return { text, source: 'passthrough' };
  const phrase = phrasebook.find((p) => normalize(p[from] || '') === normalize(text));
  return phrase ? { text: phrase[to], source: 'phrasebook' } : null;
}
