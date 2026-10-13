import { useEffect, useMemo, useRef, useState } from 'react';
import { Route, ScanText, Download, Upload, FlaskConical, ArrowRight, Undo2 } from 'lucide-react';
import { sampleNetwork } from '../../shared/local-network.js';
import {
  activeClosures,
  createClosure,
  edgeCost,
  findLocalRoute,
  routePreferences,
  validateNetwork,
} from '../../shared/local-routing.js';
import './local-routing.css';

function readWorkspace(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (!value) return { network: validateNetwork(sampleNetwork), closures: [] };
    const network = validateNetwork(value.network);
    const closures = Array.isArray(value.closures)
      ? value.closures
          .filter(
            (c) =>
              c &&
              network.edges.some((e) => e.id === c.edgeId) &&
              typeof c.text === 'string' &&
              c.text.length <= 6000 &&
              Number.isFinite(c.createdAt) &&
              (c.expiresAt === null || Number.isFinite(c.expiresAt)),
          )
          .slice(0, 500)
      : [];
    return { network, closures };
  } catch {
    return {
      network: validateNetwork(sampleNetwork),
      closures: [],
      warning: 'Saved lab data could not be loaded. The sample network is shown.',
    };
  }
}
function saveDownload(value, name) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function EdgeEditor({ edge, onSave }) {
  const [draft, setDraft] = useState(edge);
  const [error, setError] = useState('');
  return (
    <details className="lab-editor">
      <summary>Edit selected path data</summary>
      <p className="fine-print">
        Your recorded observations are self-reported. Blank stair or crossing counts mean unknown.
      </p>
      <label className="field-label">
        Path name
        <input
          value={draft.name}
          maxLength={160}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <label className="field-label">
        Distance in metres
        <input
          type="number"
          min="1"
          max="100000"
          value={draft.metres}
          onChange={(e) =>
            setDraft({ ...draft, metres: e.target.value === '' ? '' : Number(e.target.value) })
          }
        />
      </label>
      <div className="lab-input-pair">
        {['stairs', 'crossings'].map((field) => (
          <label className="field-label" key={field}>
            {field === 'stairs' ? 'Stair flights' : 'Road crossings'}
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={draft[field] ?? ''}
              placeholder="Unknown"
              onChange={(e) =>
                setDraft({
                  ...draft,
                  [field]: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>
        ))}
      </div>
      <label className="field-label">
        Evidence / survey note
        <textarea
          maxLength={1000}
          value={draft.evidence}
          onChange={(e) => setDraft({ ...draft, evidence: e.target.value })}
        />
      </label>
      <button
        className="secondary full"
        onClick={() => {
          try {
            onSave(draft);
            setError('');
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        Save path data
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </details>
  );
}

export default function LocalRoutingLab({ storageKey, incomingNotice, onScan, active: visible }) {
  const [initial] = useState(() => readWorkspace(storageKey));
  const [network, setNetwork] = useState(initial.network);
  const [closures, setClosures] = useState(initial.closures);
  const [start, setStart] = useState(initial.network.nodes[0].id);
  const [end, setEnd] = useState(
    initial.network.nodes.find((n) => n.id === 'library')?.id || initial.network.nodes.at(-1).id,
  );
  const [preference, setPreference] = useState('shortest');
  const [stepFree, setStepFree] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(
    initial.network.edges.find((e) => e.id === 'library-steps')?.id || initial.network.edges[0].id,
  );
  const [noticeText, setNoticeText] = useState('');
  const [expires, setExpires] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [storageError, setStorageError] = useState(initial.warning || '');
  const [now, setNow] = useState(Date.now());
  const fileInput = useRef(null);
  useEffect(() => {
    if (incomingNotice?.text) {
      setNoticeText(incomingNotice.text.slice(0, 6000));
      setConfirmed(false);
      setMessage('Reviewed text received. Choose the affected path and confirm its timing.');
    }
  }, [incomingNotice]);
  useEffect(() => {
    if (!visible) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [visible]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ network, closures }));
    } catch {
      setStorageError(
        'Browser storage unavailable. Export your network and report to keep this session’s work.',
      );
    }
  }, [network, closures, storageKey]);
  const active = useMemo(() => activeClosures(closures, now), [closures, now]);
  const options = { start, end, preference, stepFree, closures, now };
  const route = findLocalRoute(network, options);
  const before = findLocalRoute(network, { ...options, closures: [] });
  const shortestOpen = findLocalRoute(network, {
    ...options,
    preference: 'shortest',
    stepFree: false,
  });
  const edge = network.edges.find((e) => e.id === selectedEdge);
  const nodes = new Map(network.nodes.map((n) => [n.id, n]));
  const blocked = new Set(active.map((c) => c.edgeId));
  const selectedIds = new Set(route?.edgeIds || []);
  const maxX = Math.max(...network.nodes.map((n) => n.x)),
    minX = Math.min(...network.nodes.map((n) => n.x));
  const maxY = Math.max(...network.nodes.map((n) => n.y)),
    minY = Math.min(...network.nodes.map((n) => n.y));
  const viewBox = `${minX - 95} ${minY - 80} ${Math.max(300, maxX - minX + 190)} ${Math.max(250, maxY - minY + 180)}`;
  function chooseEdge(id) {
    setSelectedEdge(id);
    setConfirmed(false);
    setMessage('');
  }
  function applyClosure() {
    try {
      if (!confirmed) throw new Error('Confirm the affected path and timing first.');
      const closure = createClosure(network, {
        edgeId: selectedEdge,
        text: noticeText,
        expiresAt: expires ? Date.parse(expires) : null,
      });
      setClosures((items) => [...items.filter((c) => c.edgeId !== selectedEdge), closure]);
      setNow(Date.now());
      setConfirmed(false);
      setError('');
      setMessage(`Closed “${edge.name}” in your local network. Routes have been recalculated.`);
    } catch (e) {
      setError(e.message);
    }
  }
  async function importNetwork(file) {
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a network JSON file smaller than 1 MB.');
      const next = validateNetwork(JSON.parse(await file.text()));
      setNetwork(next);
      setClosures([]);
      setStart(next.nodes[0].id);
      setEnd(next.nodes.at(-1).id);
      setSelectedEdge(next.edges[0].id);
      setConfirmed(false);
      setError('');
      setMessage(
        'Network imported. Previous closures cleared because this is a new dataset. Imported observations are not independently verified.',
      );
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? 'This file is not valid JSON. The current network is unchanged.'
          : e.message,
      );
    }
  }
  function report() {
    saveDownload(
      {
        generatedAt: new Date().toISOString(),
        network: network.name,
        provenance: network.provenance,
        algorithm: 'Dijkstra, nonnegative weighted path costs',
        start,
        end,
        preference,
        stepFree,
        scoreRule: routePreferences[preference],
        activeClosures: active,
        beforeClosures: before,
        selectedRoute: route,
        shortestOpen,
        limitations:
          'Local self-reported data. No live GPS, safety guarantee or accessibility certification. Sample network is fictional.',
      },
      'localroute-routing-report.json',
    );
  }
  return (
    <div className="routing-lab">
      <aside className="lab-controls" aria-label="Local routing controls">
        <div className="section-eyebrow">
          <FlaskConical size={15} /> BUILT HERE. EXPLAINED HERE.
        </div>
        <h2>
          Every route
          <br />
          has a reason.
        </h2>
        <p className="muted">
          Plan over your own path network. Review a notice, close a path and see the route adapt.
        </p>
        <div className="lab-data-notice">
          <strong>{network.name}</strong>
          <p>{network.provenance}</p>
          <small>Local calculation · walking only · no routing API</small>
        </div>
        <div className="lab-input-pair">
          {[
            ['Start in local network', start, setStart],
            ['Destination in local network', end, setEnd],
          ].map(([label, value, setter]) => (
            <label className="field-label" key={label}>
              {label}
              <select aria-label={label} value={value} onChange={(e) => setter(e.target.value)}>
                {network.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label className="field-label">
          Route preference
          <select
            aria-label="Local route preference"
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
          >
            {Object.entries(routePreferences).map(([id, p]) => (
              <option key={id} value={id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={stepFree}
            onChange={(e) => setStepFree(e.target.checked)}
          />{' '}
          Only paths recorded with zero stair flights
        </label>
        <p className="fine-print">
          This excludes unknown stair data too. It does not certify wheelchair access; widths,
          slopes and surfaces are not assessed.
        </p>
        <div className="lab-result" aria-live="polite">
          {route ? (
            <>
              <span className="ticket-label">
                {start === end ? 'YOU ARE AT YOUR DESTINATION' : 'YOUR SELECTED ROUTE'}
              </span>
              <strong className="lab-distance">
                {Math.round(route.metres)} <small>metres</small>
              </strong>
              <p>
                {route.stairs} recorded stair flights · {route.crossings} recorded crossings
              </p>
              <p>
                {route.unknownStairs} paths with unknown stairs · {route.unknownCrossings} with
                unknown crossings
              </p>
              {before && active.length > 0 && (
                <p className="lab-impact">
                  Before closures: {Math.round(before.metres)} m. Current route:{' '}
                  {Math.round(route.metres)} m. Distance change:{' '}
                  {route.metres - before.metres >= 0 ? '+' : ''}
                  {Math.round(route.metres - before.metres)} m.
                </p>
              )}
              {shortestOpen && route.metres > shortestOpen.metres && (
                <p>
                  Your preferences add {Math.round(route.metres - shortestOpen.metres)} m versus the
                  shortest open route.
                </p>
              )}
            </>
          ) : (
            <>
              <strong>No route meets these conditions</strong>
              <p>
                The destination is disconnected or the stair restriction excludes all available
                paths. Reopen a path or change your preference; no simulated fallback is drawn.
              </p>
            </>
          )}
        </div>
        <h3 className="spaced-heading">Connect a notice to a path</h3>
        <button className="secondary full" onClick={onScan}>
          <ScanText size={16} /> Scan a sign in Translator
        </button>
        <label className="field-label">
          Affected path
          <select
            aria-label="Affected local path"
            value={selectedEdge}
            onChange={(e) => chooseEdge(e.target.value)}
          >
            {network.edges.map((e) => (
              <option value={e.id} key={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Reviewed notice or observation
          <textarea
            aria-label="Local closure evidence"
            maxLength={6000}
            value={noticeText}
            onChange={(e) => {
              setNoticeText(e.target.value);
              setConfirmed(false);
            }}
            placeholder="For example: Library steps closed for repairs."
          />
        </label>
        <button
          className="text-btn"
          onClick={() => {
            setNoticeText(
              `${edge.name} closed for repairs. Illustrative notice for this sample network.`,
            );
            setConfirmed(false);
          }}
        >
          Use sample notice for selected path
        </button>
        <label className="field-label">
          Closure expiry (optional)
          <input
            aria-label="Local closure expiry"
            type="datetime-local"
            value={expires}
            onChange={(e) => {
              setExpires(e.target.value);
              setConfirmed(false);
            }}
          />
        </label>
        <p className="fine-print">
          Device-local time. A blank expiry stays active until you reopen the path. Closures affect
          only this local network, not city routes.
        </p>
        <label className="check-row">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />{' '}
          I confirm this notice applies to the selected path now.
        </label>
        <button
          className="primary full"
          disabled={!noticeText.trim() || !confirmed}
          onClick={applyClosure}
        >
          <Route size={16} /> Close path and reroute
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {storageError && <p className="notice">{storageError}</p>}
        {closures.length > 0 && (
          <div className="lab-closures">
            <h3>Local closure record</h3>
            {closures.map((c) => (
              <div className="lab-closure" key={c.edgeId}>
                <strong>{network.edges.find((e) => e.id === c.edgeId)?.name}</strong>
                <small>
                  {blocked.has(c.edgeId) ? 'Active' : 'Expired'} ·{' '}
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleString() : 'Until manually reopened'}
                </small>
                <p>{c.text}</p>
                <button
                  className="text-btn"
                  onClick={() => {
                    setClosures((items) => items.filter((item) => item.edgeId !== c.edgeId));
                    setMessage('Closure removed. Route recalculated.');
                  }}
                >
                  <Undo2 size={13} />
                  {blocked.has(c.edgeId) ? 'Reopen path' : 'Remove expired record'}
                </button>
              </div>
            ))}
          </div>
        )}
        <EdgeEditor
          key={JSON.stringify(edge)}
          edge={edge}
          onSave={(updated) => {
            const next = validateNetwork({
              ...network,
              edges: network.edges.map((e) => (e.id === edge.id ? updated : e)),
            });
            setNetwork(next);
            setMessage('Path data saved locally. Route scores recalculated.');
          }}
        />
        <details className="lab-editor">
          <summary>Bring your own network</summary>
          <p className="fine-print">
            Export the sample as a template. Record measured distances and path attributes, edit
            nodes/links, then import your JSON. Imports replace the network and clear its closures.
          </p>
          <div className="lab-buttons">
            <button
              className="secondary"
              onClick={() => saveDownload(network, 'localroute-network.json')}
            >
              <Download size={14} /> Export network
            </button>
            <button className="secondary" onClick={() => fileInput.current.click()}>
              <Upload size={14} /> Import network
            </button>
          </div>
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept=".json,application/json"
            aria-label="Import local network"
            onChange={(e) => {
              importNetwork(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </details>
      </aside>
      <main className="lab-map" aria-label="Local network and route explanation">
        <header className="lab-map-header">
          <div>
            <span className="section-eyebrow">YOUR PATH NETWORK</span>
            <h2>See the decision.</h2>
          </div>
          <span className="lab-offline">Computed on this device</span>
        </header>
        <div className="lab-legend">
          <span>
            <i className="legend-route" />
            Selected route
          </span>
          <span>
            <i className="legend-closed" />
            Closed path
          </span>
          <span>
            <i />
            Available path
          </span>
        </div>
        <svg
          className="network-diagram"
          viewBox={viewBox}
          role="group"
          aria-label="Interactive schematic of local paths"
        >
          <defs>
            <pattern id="network-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#d6dfcd" />
            </pattern>
          </defs>
          <rect
            x={minX - 95}
            y={minY - 80}
            width={maxX - minX + 190}
            height={maxY - minY + 180}
            fill="url(#network-grid)"
          />
          {network.edges.map((e) => {
            const a = nodes.get(e.from),
              b = nodes.get(e.to);
            return (
              <g
                key={e.id}
                role="button"
                tabIndex="0"
                aria-label={`Inspect path ${e.name}`}
                onClick={() => chooseEdge(e.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    chooseEdge(e.id);
                  }
                }}
                className="network-edge"
              >
                <title>
                  {e.name}: {e.metres} m{blocked.has(e.id) ? ', closed' : ''}
                </title>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="28" />
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  className={
                    blocked.has(e.id)
                      ? 'closed-edge'
                      : selectedIds.has(e.id)
                        ? 'route-edge'
                        : 'open-edge'
                  }
                />
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 12}
                  textAnchor="middle"
                  className={selectedEdge === e.id ? 'selected-edge-label' : ''}
                >
                  {Math.round(e.metres)} m{e.stairs ? ' · stairs' : e.stairs === null ? ' · ?' : ''}
                </text>
              </g>
            );
          })}
          {network.nodes.map((n) => (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.id === start || n.id === end ? 18 : 9}
                className={
                  n.id === start ? 'start-node' : n.id === end ? 'end-node' : 'network-node'
                }
              />
              {(n.id === start || n.id === end) && (
                <text x={n.x} y={n.y + 5} textAnchor="middle" className="node-letter">
                  {n.id === start ? 'A' : 'B'}
                </text>
              )}
              <text className="node-name" x={n.x} y={n.y + 38} textAnchor="middle">
                {n.name}
              </text>
            </g>
          ))}
        </svg>
        <p className="lab-map-caption">
          Schematic layout, not a street map. Select a path to inspect or update its attributes.
        </p>
        <div className="lab-explanation">
          <div>
            <h3>Why this route?</h3>
            <p>
              {preference === 'shortest'
                ? 'Minimises total recorded distance.'
                : preference === 'stairs'
                  ? 'Score = metres + 200 per recorded stair flight + 200 per path with unknown stairs.'
                  : 'Score = metres + 250 per recorded crossing + 250 per path with unknown crossings.'}{' '}
              Closed paths are removed before the search.
            </p>
            <p>
              Preference penalties are design choices, not measured travel time or a safety score.
            </p>
            {route && (
              <p>
                <strong>{Math.round(route.score)} cost units</strong> · {route.visited} nodes
                visited · {route.relaxed} distance updates using Dijkstra’s algorithm.
              </p>
            )}
          </div>
          <button className="secondary" onClick={report}>
            <Download size={16} /> Export evidence report
          </button>
        </div>
        <div className="lab-path-detail">
          <span className="section-eyebrow">SELECTED PATH</span>
          <h3>{edge.name}</h3>
          <p>
            {edge.metres} m · {edge.stairs ?? 'Unknown'} stair flights ·{' '}
            {edge.crossings ?? 'Unknown'} crossings · {Math.round(edgeCost(edge, preference))} cost
            units
          </p>
          <p>Evidence: {edge.evidence}</p>
        </div>
        {route && (
          <ol className="lab-directions">
            {route.steps.map((s, i) => (
              <li key={`${s.id}-${i}`}>
                <span>
                  {s.name} <ArrowRight size={13} /> {s.to}
                </span>
                <strong>{Math.round(s.metres)} m</strong>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
