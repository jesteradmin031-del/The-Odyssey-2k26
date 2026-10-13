import { searchDemo, demoAssistant, demoTranslate } from '../../shared/demo.js';
import { routesWithStop } from '../../shared/journey.js';
async function request(path, body, signal) {
  const timeout = AbortSignal.timeout(25000);
  const response = await fetch(`/api/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    if (response.ok) throw new Error('The server returned an invalid response.');
  }
  if (!response.ok) {
    const error = new Error(
      data?.error || 'Request failed (HTTP ' + response.status + '). Please try again.',
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
const offlineNotice = 'Local server unavailable. Using the built-in offline demo.';
export async function searchPlaces(q, signal) {
  try {
    return await request(`places?q=${encodeURIComponent(q)}`, null, signal);
  } catch (e) {
    if (signal?.aborted || e.status) throw e;
    return { places: searchDemo(q), source: 'demo', notice: offlineNotice };
  }
}
export async function getRoutes(body, signal) {
  try {
    return await request('routes', body, signal);
  } catch (e) {
    if (signal?.aborted || e.status) throw e;
    return {
      routes: routesWithStop(body.origin, body.destination, body.mode, body.stop),
      source: 'demo',
      notice: offlineNotice,
    };
  }
}
export async function askAssistant(message, context) {
  try {
    return await request('assistant', { message, context });
  } catch (e) {
    if (e.status) throw e;
    return { text: demoAssistant(message, context), source: 'demo', notice: offlineNotice };
  }
}
export async function translate(text, from, to) {
  try {
    return await request('translate', { text, from, to });
  } catch (e) {
    if (e.status) throw e;
    const result = demoTranslate(text, from, to);
    if (result) return { ...result, notice: offlineNotice };
    throw new Error(
      'Live translation needs the local server and an OpenAI key. Try a phrasebook example in the meantime.',
    );
  }
}
export const getHealth = () => request('health');
