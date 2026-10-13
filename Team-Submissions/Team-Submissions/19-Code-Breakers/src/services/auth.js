async function authRequest(path, body) {
  let response;
  try {
    response = await fetch(`/api/auth/${path}`, {
      method: body ? 'POST' : 'GET',
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      'The account server is unavailable. Start the local backend, or explore the demo without an account.',
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The account server is unavailable. You can still explore the demo.');
  }
  if (!response.ok) throw new Error(data.error || 'Account request failed. Please try again.');
  return data;
}
export const auth = {
  me: () => authRequest('me'),
  register: (data) => authRequest('register', data),
  login: (data) => authRequest('login', data),
  logout: () => authRequest('logout', {}),
};
