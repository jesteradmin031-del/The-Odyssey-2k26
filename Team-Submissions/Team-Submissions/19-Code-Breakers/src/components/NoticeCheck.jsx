import { useState } from 'react';
import { ScanText, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { inspectNotice } from '../../shared/journey.js';
import PlaceSearch from './PlaceSearch.jsx';

export default function NoticeCheck({
  initialText,
  origin,
  destination,
  onScan,
  onApply,
  currentNotice,
  onLocalNotice,
}) {
  const [text, setText] = useState(initialText || '');
  const [validUntil, setValidUntil] = useState('');
  const [alternative, setAlternative] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [applied, setApplied] = useState(false);
  const assessment = inspectNotice(text, { validUntil });
  const distinct =
    alternative &&
    origin &&
    destination &&
    alternative.coordinates.some((v, i) => v !== destination.coordinates[i]) &&
    alternative.coordinates.some((v, i) => v !== origin.coordinates[i]);
  function reset() {
    setConfirmed(false);
    setChecked(false);
    setApplied(false);
  }
  return (
    <section className="notice-panel">
      <div className="section-eyebrow">
        <ScanText size={15} /> READ IT. UNDERSTAND IT. ADAPT.
      </div>
      <h2>
        A sign can change
        <br />
        your journey.
      </h2>
      <p className="muted">
        Review a closure or diversion, then choose an alternative place yourself.
      </p>
      <div className="feature-callout">
        <span className="notice-step">01</span>
        <div>
          <strong>Bring the real world into your plan</strong>
          <p>Scan in Translator, review the words, then send them here.</p>
        </div>
      </div>
      <button className="secondary full" onClick={onScan}>
        <ScanText size={17} /> Scan a notice in Translator <ArrowRight size={16} />
      </button>
      <label className="field-label">
        Notice text
        <textarea
          aria-label="Notice text"
          value={text}
          maxLength={3000}
          placeholder="Paste or type the notice here…"
          onChange={(e) => {
            setText(e.target.value);
            reset();
          }}
        />
      </label>
      <button
        className="text-btn"
        onClick={() => {
          setText(
            'Cubbon Park entrance closed. Use the alternative entrance. Confirm the entrance with staff.',
          );
          reset();
        }}
      >
        Try an illustrative closure
      </button>
      <label className="field-label">
        Expiry shown on the notice (optional)
        <input
          aria-label="Notice expiry"
          type="datetime-local"
          value={validUntil}
          onChange={(e) => {
            setValidUntil(e.target.value);
            reset();
          }}
        />
      </label>
      <p className="fine-print">
        Enter the sign’s date and time in your device’s local time. Dates are not extracted
        automatically. Leave blank if unknown.
      </p>
      <button
        className="primary full"
        disabled={!text.trim()}
        onClick={() => {
          setChecked(true);
          setApplied(false);
        }}
      >
        Check notice <ArrowRight size={17} />
      </button>
      {checked && (
        <div className={`notice-assessment ${assessment.expired ? 'expired' : ''}`} role="status">
          <AlertTriangle size={20} />
          <div>
            <strong>{assessment.title}</strong>
            <p>{assessment.detail}</p>
            <small>Local keyword check · no AI or official verification</small>
          </div>
        </div>
      )}
      {checked && assessment.canApply && (
        <div className="adapt-card">
          {onLocalNotice && (
            <div className="notice-handoff">
              <h3>Close a path in your own network</h3>
              <p className="muted small">
                Use Route lab to match this notice to a path and calculate a route around it.
              </p>
              <button className="secondary full" onClick={() => onLocalNotice(text)}>
                Use notice in Route lab <ArrowRight size={15} />
              </button>
            </div>
          )}
          <h3>Adapt your planned trip</h3>
          <p className="muted small">
            Current destination: {destination?.name || 'Not selected'}. A notice does not
            automatically identify a mapped entrance.
          </p>
          <PlaceSearch
            label="Alternative destination"
            value={alternative}
            onChange={(p) => {
              setAlternative(p);
              setConfirmed(false);
              setApplied(false);
            }}
          />
          <label className="check-row">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />{' '}
            I checked the notice’s location, timing and alternative. This is my intended
            destination.
          </label>
          {alternative && !distinct && (
            <p className="error">
              Choose a place different from your start and current destination.
            </p>
          )}
          <button
            className="primary full"
            disabled={!confirmed || !distinct || applied}
            onClick={() => {
              if (!inspectNotice(text, { validUntil }).canApply) {
                setConfirmed(false);
                return;
              }
              onApply(alternative, text);
              setApplied(true);
            }}
          >
            <CheckCircle2 size={17} />{' '}
            {applied ? 'Destination updated' : 'Use alternative destination'}
          </button>
          <p className="fine-print">
            Updates the destination and requests a new route. It does not block a closed road or
            verify access to an entrance.
          </p>
        </div>
      )}
      {currentNotice && (
        <div className="feature-callout">
          <CheckCircle2 size={20} />
          <div>
            <strong>Personal notice attached to trip</strong>
            <p>{currentNotice}</p>
          </div>
        </div>
      )}
    </section>
  );
}
