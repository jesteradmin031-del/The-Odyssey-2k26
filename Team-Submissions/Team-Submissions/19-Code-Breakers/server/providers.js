import { modes } from '../shared/data.js';
// All provider calls stay on the server. No API key is returned to the browser.
export async function providerFetch(url, options = {}, fetcher = fetch) {
  const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  return response.json();
}
export async function searchPlaces(query, key, fetcher) {
  const url = new URL('https://api.openrouteservice.org/geocode/search');
  url.searchParams.set('api_key', key);
  url.searchParams.set('text', query);
  url.searchParams.set('size', '6');
  const data = await providerFetch(url, {}, fetcher);
  return (data.features || [])
    .filter((f) => f.geometry?.type === 'Point')
    .map((f, i) => ({
      id: `live-${i}-${f.geometry.coordinates.join(',')}`,
      name: f.properties.name || f.properties.label,
      area: f.properties.label,
      coordinates: f.geometry.coordinates,
      category: 'Place',
      emoji: '📍',
    }));
}
export async function routePlaces(origin, destination, mode, key, fetcher, stop) {
  const data = await providerFetch(
    `https://api.openrouteservice.org/v2/directions/${modes[mode].profile}/geojson`,
    {
      method: 'POST',
      headers: { Authorization: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [
          origin.coordinates,
          ...(stop ? [stop.coordinates] : []),
          destination.coordinates,
        ],
        instructions: true,
      }),
    },
    fetcher,
  );
  if (!data.features?.length) throw new Error('No route');
  return data.features.map((f, i) => ({
    id: `live-${i}`,
    title: stop ? 'Via your stop' : 'Suggested route',
    source: 'openrouteservice',
    coordinates: f.geometry.coordinates,
    distance: f.properties.summary.distance,
    duration: f.properties.summary.duration,
    steps: f.properties.segments
      .flatMap((s) => s.steps)
      .map((s) => ({
        instruction: s.instruction,
        distance: s.distance,
        coordinates: f.geometry.coordinates[s.way_points?.[0]],
      })),
  }));
}
export async function aiText(instructions, input, config, fetcher) {
  const data = await providerFetch(
    'https://api.openai.com/v1/responses',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.OPENAI_MODEL || 'gpt-4.1-mini',
        instructions,
        input,
        max_output_tokens: 700,
        store: false,
      }),
    },
    fetcher,
  );
  const text = data.output
    ?.flatMap((item) => item.content || [])
    .filter((c) => c.type === 'output_text')
    .map((c) => c.text)
    .join('\n')
    .trim();
  if (!text) throw new Error('Empty AI response');
  return text;
}
