import { useState } from 'react';
import { Download, Backpack, CheckCircle2, Copy } from 'lucide-react';
import { languages, phrasebook } from '../../shared/data.js';
import { tripDocument } from '../../shared/journey.js';

export default function TripKit({ origin, destination, stop, mode, route, notice, notify }) {
  const [language, setLanguage] = useState('kn');
  const [note, setNote] = useState('');
  const [checks, setChecks] = useState({});
  const tasks = [
    'Check destination opening hours',
    'Review route and local conditions',
    'Charge phone and save trip card',
  ];
  const ready = origin && destination && route;
  function download() {
    const html = tripDocument({
      origin,
      destination,
      stop,
      mode,
      route,
      note,
      notice,
      phrases: phrasebook.map((p) => ({ en: p.en, translated: p[language] })),
    });
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localroute-trip-card.html';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Trip card downloaded. Open the file without internet.');
  }
  return (
    <section className="trip-kit">
      <div className="section-eyebrow">
        <Backpack size={15} /> TAKE THE ESSENTIALS WITH YOU
      </div>
      <h2>
        Your journey.
        <br />
        In your pocket.
      </h2>
      <p className="muted">
        A readable trip card with directions, local phrases and your own notes. Open it offline or
        print it.
      </p>
      <div className="ticket-card">
        <span className="ticket-label">PLANNED JOURNEY</span>
        <h3>{destination?.name || 'Choose a destination'}</h3>
        <p>
          From {origin?.name || 'your starting point'}
          {stop ? ` via ${stop.name}` : ''}
        </p>
        <div className="ticket-stats">
          <span>{mode}</span>
          <span>{route ? `${(route.distance / 1000).toFixed(1)} km` : '—'}</span>
          <span>{route ? `${Math.round(route.duration / 60)} min` : '—'}</span>
        </div>
        <small>
          {route?.source === 'demo'
            ? 'Simulated route · not road directions'
            : 'Route preview · no traffic updates'}
        </small>
      </div>
      <h3 className="spaced-heading">Before you leave</h3>
      {tasks.map((task, i) => (
        <label className="check-row" key={task}>
          <input
            type="checkbox"
            checked={Boolean(checks[i])}
            onChange={(e) => setChecks({ ...checks, [i]: e.target.checked })}
          />
          {task}
        </label>
      ))}
      <p className="readiness">
        <CheckCircle2 size={15} /> {Object.values(checks).filter(Boolean).length} of 3 personal
        checks complete
      </p>
      <label className="field-label">
        Phrasebook language
        <select
          aria-label="Trip card language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Notes for the journey
        <textarea
          aria-label="Trip notes"
          value={note}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Meeting point, entrance details, things to remember…"
        />
      </label>
      <button className="primary full" disabled={!ready} onClick={download}>
        <Download size={17} /> Download offline trip card
      </button>
      <button
        className="secondary full"
        disabled={!ready}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              `${origin.name} → ${stop ? `${stop.name} → ` : ''}${destination.name}\n${mode} · ${(route.distance / 1000).toFixed(1)} km · ${Math.round(route.duration / 60)} min\nDestination: ${destination.coordinates[1]}, ${destination.coordinates[0]}\n${route.source === 'demo' ? 'Simulated route.' : 'Route preview.'} Planned trip, not live tracking.\n${note}`,
            );
            notify('Trip summary copied.');
          } catch {
            notify('Clipboard unavailable. Download the trip card instead.');
          }
        }}
      >
        <Copy size={16} /> Copy trip summary
      </button>
      <p className="fine-print">
        The download contains trip details, not map tiles. It is a snapshot and does not update.
        Notes and checklist stay in this session; download to keep them.
      </p>
    </section>
  );
}
