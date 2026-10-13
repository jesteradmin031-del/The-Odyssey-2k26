import { lazy, Suspense, useEffect, useState } from 'react';
import Landing from './components/Landing.jsx';
import { auth } from './services/auth.js';
const App = lazy(() => import('./App.jsx'));
function guestSession() {
  try {
    return sessionStorage.getItem('localroute-guest') === 'true';
  } catch {
    return false;
  }
}
export default function Root() {
  const [screen, setScreen] = useState(guestSession() ? 'map' : 'welcome'),
    [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    auth
      .me()
      .then(({ user }) => {
        if (active) {
          setUser(user);
          if (user) setScreen('map');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  function enter(userData) {
    setUser(userData);
    setScreen('map');
    setError('');
    try {
      sessionStorage.setItem('localroute-guest', 'true');
    } catch {}
  }
  async function signOut() {
    try {
      await auth.logout();
      setUser(null);
      setScreen('welcome');
      try {
        sessionStorage.removeItem('localroute-guest');
      } catch {}
    } catch (e) {
      setError(e.message);
    }
  }
  if (!ready)
    return (
      <div className="app-loading">
        <img src="/favicon.svg" alt="" />
        <span>Finding your way…</span>
      </div>
    );
  return (
    <>
      {screen === 'map' ? (
        <Suspense fallback={<div className="app-loading">Opening your map…</div>}>
          <App
            key={user?.id || 'guest'}
            user={user}
            onSignOut={signOut}
            onAccount={() => setScreen('login')}
            onHome={() => setScreen('welcome')}
          />
        </Suspense>
      ) : (
        <Landing
          initialView={screen}
          user={user}
          onGuest={() => enter(user)}
          onAuthenticated={enter}
        />
      )}{' '}
      {error && (
        <div className="toast" role="alert">
          {error}
          <button
            className="icon-btn"
            onClick={() => setError('')}
            aria-label="Dismiss account error"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
