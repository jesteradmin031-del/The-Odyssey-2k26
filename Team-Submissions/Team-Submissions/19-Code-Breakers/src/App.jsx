import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Map,
  Sparkles,
  Languages,
  ShieldCheck,
  Bookmark,
  Bus,
  ArrowRight,
  ArrowDownUp,
  Footprints,
  Bike,
  CarFront,
  ChevronRight,
  X,
  Navigation,
  LoaderCircle,
  Info,
  Check,
  Route,
  CircleHelp,
  Leaf,
  Compass,
  ScanText,
  Backpack,
  MapPin,
} from 'lucide-react';
import { places, modes } from '../shared/data.js';
import { demoRoutes, distanceKm } from '../shared/demo.js';
import { getRoutes, getHealth } from './services/api.js';
import PlaceSearch from './components/PlaceSearch.jsx';
import MapView from './components/MapView.jsx';
import Assistant from './components/Assistant.jsx';
import Translator from './components/Translator.jsx';
import Safety from './components/Safety.jsx';
import Transport from './components/Transport.jsx';
import NoticeCheck from './components/NoticeCheck.jsx';
import TripKit from './components/TripKit.jsx';
import LocalRoutingLab from './components/LocalRoutingLab.jsx';
import { nearbyStops } from '../shared/journey.js';
import './journey.css';

const tabs = [
  { id: 'explore', label: 'Explore', icon: Map },
  { id: 'local', label: 'Route lab', icon: Route },
  { id: 'notice', label: 'Notice check', icon: ScanText },
  { id: 'kit', label: 'Trip card', icon: Backpack },
  { id: 'assistant', label: 'AI guide', icon: Sparkles },
  { id: 'translator', label: 'Translator', icon: Languages },
  { id: 'safety', label: 'Safety', icon: ShieldCheck },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'transport', label: 'Transport', icon: Bus },
];
const minutes = (seconds) => Math.max(1, Math.round(seconds / 60));
const distance = (metres) =>
  metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
function readSaved(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data)
      ? data.filter(
          (p) =>
            p &&
            typeof p.name === 'string' &&
            Array.isArray(p.coordinates) &&
            p.coordinates.length === 2 &&
            p.coordinates.every(Number.isFinite),
        )
      : [];
  } catch {
    return [];
  }
}

export default function App({ user, onSignOut, onAccount, onHome }) {
  const [labNotice, setLabNotice] = useState(null);
  function openLabWithNotice(text) {
    setLabNotice({ text, receivedAt: Date.now() });
    setTab('local');
  }
  const savedKey = user ? `localroute-saved-user-${user.id}` : 'localroute-saved';
  const [tab, setTab] = useState('explore'),
    [origin, setOrigin] = useState(places[0]),
    [destination, setDestination] = useState(places[1]),
    [mode, setMode] = useState('walking');
  const [stop, setStop] = useState(null),
    [stopReset, setStopReset] = useState(0),
    [noticeSeed, setNoticeSeed] = useState(''),
    [tripNotice, setTripNotice] = useState(''),
    [noticeVersion, setNoticeVersion] = useState(0);
  const [routes, setRoutes] = useState(() => demoRoutes(places[0], places[1])),
    [selected, setSelected] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [category, setCategory] = useState('All'),
    [safety, setSafety] = useState(false),
    [saved, setSaved] = useState(() => readSaved(savedKey)),
    [toast, setToast] = useState(''),
    [health, setHealth] = useState(null),
    [step, setStep] = useState(null),
    [locating, setLocating] = useState(false);
  const request = useRef(null),
    toastTimer = useRef(null),
    help = useRef(null);
  const route = routes[selected];
  const notify = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 5000);
  }, []);
  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ ai: 'demo', routing: 'demo', offline: true }));
    return () => {
      clearTimeout(toastTimer.current);
      request.current?.abort();
    };
  }, []);
  const calculate = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStep(null);
    setError('');
    setNotice('');
    setRoutes([]);
    setBusy(false);
    if (!origin || !destination) return;
    if (distanceKm(origin.coordinates, destination.coordinates) < 0.02) {
      setError('Choose a destination at least 20 metres from your start.');
      return;
    }
    setBusy(true);
    try {
      const data = await getRoutes({ origin, destination, mode, stop }, controller.signal);
      if (!controller.signal.aborted) {
        setRoutes(data.routes);
        setSelected(0);
        setNotice(data.notice || '');
      }
    } catch (e) {
      if (!controller.signal.aborted) setError(e.message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }, [origin, destination, mode, stop]);
  useEffect(() => {
    calculate();
    return () => request.current?.abort();
  }, [calculate]);
  const pickDestination = useCallback((p) => {
    setDestination(p);
    setTripNotice('');
    setStop(null);
    setStopReset((v) => v + 1);
    setTab('explore');
  }, []);
  function savePlace() {
    if (!destination) return;
    const exists = saved.some((p) => p.id === destination.id);
    const next = exists ? saved.filter((p) => p.id !== destination.id) : [...saved, destination];
    setSaved(next);
    try {
      localStorage.setItem(savedKey, JSON.stringify(next));
      notify(exists ? 'Place removed from saved.' : 'Place saved on this device.');
    } catch {
      notify('Saved for this session. Browser storage is unavailable.');
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      notify('Location is unavailable in this browser. Search for your starting point.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setTripNotice('');
        setOrigin({
          id: 'my-location',
          name: 'My location',
          area: 'Device location',
          coordinates: [p.coords.longitude, p.coords.latitude],
        });
        setLocating(false);
        notify(
          'Starting point updated. The demo illustration covers central Bengaluru; use street map for other locations.',
        );
      },
      () => {
        setLocating(false);
        notify(
          'Location was unavailable or permission was denied. Search for your starting point.',
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }
  return (
    <div className="app" data-tab={tab}>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onHome();
          }}
          aria-label="LocalRoute home"
        >
          <img src="/favicon.svg" alt="" />
          <span>
            Local<span className="brand-light">Route</span>
            <small>GO WITH A LITTLE LOCAL KNOWLEDGE.</small>
          </span>
        </a>
        <div className="header-center">
          <span className="header-line" />
          More than the way there.
          <span className="header-line" />
        </div>
        <div className="header-actions">
          <span className="demo-pill">
            <span className="status-dot" />
            {health?.routing === 'live' ? 'Live services enabled' : 'Demo playground'}
          </span>
          <button
            className="icon-btn"
            aria-label="About this demo"
            onClick={() => help.current.showModal()}
          >
            <CircleHelp size={21} />
          </button>
          {user ? (
            <>
              <span className="avatar user-avatar" title={user.name}>
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <button className="account-button" onClick={onSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <button className="account-button" onClick={onAccount}>
              Sign in
            </button>
          )}
        </div>
      </header>
      <div className="workspace">
        <nav className="nav-rail" aria-label="Main navigation">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => setTab(id)}
            >
              <Icon size={21} />
              <span>{label}</span>
              {id === 'saved' && saved.length > 0 && <i>{saved.length}</i>}
            </button>
          ))}
          <div className="rail-bottom">
            <span className="tiny-logo">↗</span>
            <small>
              GO A LITTLE
              <br />
              FURTHER.
            </small>
          </div>
        </nav>
        <div className="local-lab-slot" hidden={tab !== 'local'}>
          <LocalRoutingLab
            active={tab === 'local'}
            storageKey={`localroute-lab-${user?.id || 'guest'}`}
            incomingNotice={labNotice}
            onScan={() => setTab('translator')}
          />
        </div>
        <aside
          hidden={tab === 'local'}
          className="side-panel"
          aria-label={`${tabs.find((t) => t.id === tab).label} panel`}
        >
          {tab === 'explore' && (
            <section className="planner">
              <div className="section-eyebrow">
                <Compass size={15} /> YOUR NEXT JOURNEY STARTS HERE
              </div>
              <h1>
                Where are
                <br />
                we headed?
              </h1>
              <p className="intro">
                Plan the route. Understand the signs.
                <br />
                Keep the essentials close.
              </p>
              <div className="journey-fields">
                <PlaceSearch
                  label="Starting point"
                  value={origin}
                  onChange={(p) => {
                    setOrigin(p);
                    setTripNotice('');
                  }}
                  onLocate={locate}
                />
                <button
                  className="swap-places"
                  aria-label="Swap starting point and destination"
                  onClick={() => {
                    setOrigin(destination);
                    setDestination(origin);
                    setTripNotice('');
                  }}
                >
                  <ArrowDownUp size={15} />
                </button>
                <PlaceSearch
                  label="Destination"
                  value={destination}
                  onChange={(p) => {
                    setDestination(p);
                    setTripNotice('');
                  }}
                />
              </div>
              <div className="stop-planner">
                <div className="stop-heading">
                  <span>
                    <MapPin size={14} /> A stop along the way
                  </span>
                  {stop && (
                    <button
                      className="text-btn"
                      onClick={() => {
                        setStop(null);
                        setStopReset((v) => v + 1);
                      }}
                    >
                      Remove stop
                    </button>
                  )}
                </div>
                <PlaceSearch
                  key={stopReset}
                  label="Optional stop"
                  value={stop}
                  onChange={setStop}
                />
              </div>
              {locating && (
                <p className="small loading-line">
                  <LoaderCircle size={14} className="spin" /> Finding your location…
                </p>
              )}
              <div className="mode-selector" aria-label="Travel mode">
                {[
                  { id: 'walking', icon: Footprints },
                  { id: 'cycling', icon: Bike },
                  { id: 'driving', icon: CarFront },
                ].map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    aria-pressed={mode === id}
                    className={mode === id ? 'selected' : ''}
                    onClick={() => setMode(id)}
                  >
                    <Icon size={18} />
                    {modes[id].label}
                  </button>
                ))}
              </div>
              <button
                className="primary full find-route"
                onClick={calculate}
                disabled={!origin || !destination || busy}
              >
                {busy ? <LoaderCircle size={18} className="spin" /> : <Route size={18} />}{' '}
                {busy ? 'Finding your way…' : 'Find my route'}
                <ArrowRight size={18} />
              </button>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p className="notice" role="status">
                  {notice}
                </p>
              )}
              <div className="routes-heading">
                <h3>Your route options</h3>
                <span>{route?.source === 'openrouteservice' ? 'Live routing' : 'Demo routes'}</span>
              </div>
              {busy ? (
                <div className="route-skeleton">
                  <div />
                  <div />
                  <div />
                </div>
              ) : !routes.length ? (
                <p className="empty-state">Choose two places to see a route.</p>
              ) : (
                routes.map((r, i) => (
                  <button
                    key={r.id}
                    className={`route-card ${selected === i ? 'selected' : ''}`}
                    onClick={() => {
                      setSelected(i);
                      setStep(null);
                    }}
                    aria-pressed={selected === i}
                  >
                    <div className="route-card-top">
                      <span className="route-radio">{selected === i && <span />}</span>
                      <strong>{r.title}</strong>
                      {i === 0 && <span className="recommended">SUGGESTED</span>}
                    </div>
                    <div className="route-numbers">
                      <strong>
                        {minutes(r.duration)}
                        <small> min</small>
                      </strong>
                      <span>·</span>
                      <span>{distance(r.distance)}</span>
                      <span>·</span>
                      <span>{modes[mode].label}</span>
                    </div>
                    <div className="route-meta">
                      <Leaf size={13} />
                      {r.source === 'demo'
                        ? 'Illustrative path · estimated time'
                        : 'Openrouteservice · traffic not included'}
                    </div>
                  </button>
                ))
              )}
              <button className="ai-teaser" onClick={() => setTab('notice')}>
                <span className="sparkle-box">
                  <ScanText size={20} />
                </span>
                <span>
                  <strong>Plans change. Read the signs.</strong>
                  <small>Check a notice and choose your next move.</small>
                </span>
                <ChevronRight size={18} />
              </button>
              <button className="journey-kit-link" onClick={() => setTab('kit')}>
                <Backpack size={18} />
                <span>
                  <strong>Take your trip offline</strong>
                  <small>Directions, phrases and notes in one card</small>
                </span>
                <ChevronRight size={17} />
              </button>
              <div className="route-stops">
                <div className="discover-heading">
                  <h3>Make room for a little discovery</h3>
                  <span>CURATED</span>
                </div>
                <p className="fine-print">
                  Ranked by extra straight-line distance, not verified road detours. Recalculate to
                  see the route.
                </p>
                {nearbyStops(origin, destination, places).map(({ place, extraMetres }) => (
                  <button
                    key={place.id}
                    className="stop-suggestion"
                    disabled={stop?.id === place.id}
                    onClick={() => setStop(place)}
                  >
                    <span className="stop-emoji">{place.emoji}</span>
                    <span>
                      <strong>{place.name}</strong>
                      <small>
                        About +
                        {extraMetres < 1000
                          ? `${extraMetres} m`
                          : `${(extraMetres / 1000).toFixed(1)} km`}{' '}
                        straight-line distance
                      </small>
                    </span>
                    <span>{stop?.id === place.id ? 'Added' : '+ Stop'}</span>
                  </button>
                ))}
              </div>
              <div className="discover-heading">
                <h3>Around the corner</h3>
                <span>CURATED PICKS</span>
              </div>
              <div className="place-cards">
                {places
                  .filter((p) => ['coffee', 'cubbon'].includes(p.id))
                  .map((p) => (
                    <button key={p.id} onClick={() => pickDestination(p)}>
                      <div className={`place-art ${p.id}`}>
                        <span>
                          {p.id === 'cubbon' ? 'A BREATH OF FRESH AIR' : 'YOUR NEXT COFFEE STOP'}
                        </span>
                        <span className="art-symbol">{p.id === 'cubbon' ? '♣' : '☕'}</span>
                      </div>
                      <strong>{p.name}</strong>
                      <small>
                        {p.category}
                        <ChevronRight size={12} />
                      </small>
                    </button>
                  ))}
              </div>
              <p className="fine-print planner-foot">
                Built for discovery. Demo paths are illustrative and must not be used as real
                turn-by-turn directions.
              </p>
            </section>
          )}
          {tab === 'assistant' && (
            <Assistant
              origin={origin}
              destination={destination}
              mode={mode}
              onSelect={pickDestination}
            />
          )}
          {tab === 'translator' && (
            <Translator
              notify={notify}
              onLocalNotice={openLabWithNotice}
              onCheckNotice={({ original, text }) => {
                setNoticeSeed(
                  original === text ? text : `${original}\n\nReviewed translation:\n${text}`,
                );
                setNoticeVersion((v) => v + 1);
                setTab('notice');
              }}
            />
          )}
          <div className="panel-slot" hidden={tab !== 'notice'}>
            <NoticeCheck
              key={noticeVersion}
              initialText={noticeSeed}
              origin={origin}
              destination={destination}
              currentNotice={tripNotice}
              onLocalNotice={openLabWithNotice}
              onScan={() => setTab('translator')}
              onApply={(p, text) => {
                setDestination(p);
                setStop(null);
                setStopReset((v) => v + 1);
                setTripNotice(text);
                notify('Alternative destination selected. Review the updated route in Explore.');
              }}
            />
          </div>
          <div className="panel-slot" hidden={tab !== 'kit'}>
            <TripKit
              origin={origin}
              destination={destination}
              stop={stop}
              mode={mode}
              route={busy ? null : route}
              notice={tripNotice}
              notify={notify}
            />
          </div>
          {tab === 'safety' && (
            <Safety
              enabled={safety}
              setEnabled={setSafety}
              origin={origin}
              destination={destination}
              notify={notify}
            />
          )}
          {tab === 'transport' && <Transport />}
          {tab === 'saved' && (
            <section>
              <div className="section-eyebrow">
                <Bookmark size={15} /> YOUR LITTLE BLACK BOOK
              </div>
              <h2>
                Worth coming
                <br />
                back to.
              </h2>
              <p className="muted">
                {user
                  ? 'Your account’s saved places in this browser.'
                  : 'Your guest saved places in this browser.'}{' '}
                No cross-device sync.
              </p>
              {saved.length ? (
                saved.map((p) => (
                  <button className="saved-place" key={p.id} onClick={() => pickDestination(p)}>
                    <span>{p.emoji || '📍'}</span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.area}</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))
              ) : (
                <div className="empty-saved">
                  <Bookmark size={32} />
                  <h3>A blank page for now.</h3>
                  <p>Save a destination using the bookmark beside your route preview.</p>
                </div>
              )}
            </section>
          )}
        </aside>
        <main hidden={tab === 'local'} className="map-area">
          <MapView
            origin={origin}
            destination={destination}
            routes={routes}
            selected={selected}
            category={category}
            onSelect={pickDestination}
            safety={safety}
            stop={stop}
            stepCoordinates={step === null ? null : route?.steps[step]?.coordinates}
            progress={step === null ? null : step / Math.max(1, (route?.steps.length || 2) - 1)}
          />
          <div className="map-categories" aria-label="Filter places">
            {['All', 'Cafés', 'Parks', 'Transit', 'Hospitals'].map((c) => (
              <button
                key={c}
                aria-pressed={category === c}
                className={category === c ? 'active' : ''}
                onClick={() => setCategory(c)}
              >
                {c === 'All' ? (
                  <Compass size={15} />
                ) : (
                  <span>
                    {c === 'Cafés' ? '☕' : c === 'Parks' ? '♣' : c === 'Transit' ? '▣' : '✚'}
                  </span>
                )}
                {c === 'All' ? 'Discover' : c}
              </button>
            ))}
          </div>
          {safety && (
            <div className="safety-layer-badge">
              <ShieldCheck size={16} /> Sample support points visible
            </div>
          )}
          {route && origin && destination && (
            <div className="trip-preview">
              {step === null ? (
                <>
                  <div className="preview-icon">
                    <Navigation size={23} />
                  </div>
                  <div className="preview-description">
                    <span>YOUR NEXT LITTLE ADVENTURE</span>
                    <strong>{destination.name}</strong>
                    <small>
                      {minutes(route.duration)} min <b>·</b> {distance(route.distance)} <b>·</b>{' '}
                      {modes[mode].label}
                      {route.source === 'demo' ? ' · simulated' : ''}
                    </small>
                  </div>
                  <button
                    className={`save-button ${saved.some((p) => p.id === destination.id) ? 'saved' : ''}`}
                    aria-label={
                      saved.some((p) => p.id === destination.id)
                        ? 'Unsave destination'
                        : 'Save destination'
                    }
                    onClick={savePlace}
                  >
                    <Bookmark
                      size={20}
                      fill={saved.some((p) => p.id === destination.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                  <button className="primary preview-start" onClick={() => setStep(0)}>
                    {route.source === 'demo' ? 'Preview demo' : 'View directions'}
                    <ArrowRight size={17} />
                  </button>
                </>
              ) : (
                <>
                  <div className="preview-icon">
                    <Navigation size={23} />
                  </div>
                  <div className="preview-description">
                    <span>
                      DIRECTIONS PREVIEW · {step + 1}/{route.steps.length}
                    </span>
                    <strong>{route.steps[step]?.instruction}</strong>
                    <small>
                      {route.source === 'demo'
                        ? 'Simulated guidance. No live navigation.'
                        : 'Preview only. Follow real signs and conditions.'}
                    </small>
                  </div>
                  <button
                    className="primary"
                    onClick={() =>
                      step >= route.steps.length - 1 ? setStep(null) : setStep(step + 1)
                    }
                  >
                    {step >= route.steps.length - 1 ? 'Finish' : 'Next'}
                    <ChevronRight size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label="Close directions preview"
                    onClick={() => setStep(null)}
                  >
                    <X size={18} />
                  </button>
                </>
              )}
            </div>
          )}
          <div className="map-corner-note">
            <span className="small-compass">N ↑</span>
            <span>Take the scenic way home.</span>
          </div>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            className="icon-btn"
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={15} />
          </button>
        </div>
      )}
      <dialog ref={help} className="about-dialog">
        <button
          className="dialog-close icon-btn"
          aria-label="Close about"
          onClick={() => help.current.close()}
        >
          <X size={20} />
        </button>
        <img src="/favicon.svg" alt="" />
        <h2>Meet LocalRoute.</h2>
        <p>
          A hackathon playground for thoughtful navigation, local discovery, and crossing language
          barriers.
        </p>
        <ul>
          <li>
            <strong>Explore:</strong> search places, compare modes, save destinations and preview
            routes.
          </li>
          <li>
            <strong>AI guide:</strong> use the offline helper or connect OpenAI.
          </li>
          <li>
            <strong>Translator:</strong> type, speak, scan text and listen to translations.
          </li>
          <li>
            <strong>Safety:</strong> sample support points and copyable trip details.
          </li>
        </ul>
        <p className="notice">
          The demo map and routes are illustrative. OCR and speech depend on browser support;
          first-time OCR needs an internet connection. Live service setup is documented in
          README.md.
        </p>
        <button className="primary full" onClick={() => help.current.close()}>
          Let’s explore
          <ArrowRight size={17} />
        </button>
      </dialog>
    </div>
  );
}
