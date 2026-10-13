import { useEffect, useRef, useState } from 'react';
import { MapPin, Mic, LoaderCircle, LocateFixed, X } from 'lucide-react';
import { searchPlaces } from '../services/api.js';
import { useVoice } from '../hooks/useVoice.js';
export default function PlaceSearch({ label, value, onChange, onLocate }) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(-1);
  const box = useRef(null);
  const id = label.toLowerCase().replaceAll(' ', '-');
  const voice = useVoice((text) => {
    setQuery(text);
    onChange(null);
    setOpen(true);
  });
  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value]);
  useEffect(() => {
    setResults([]);
    setActive(-1);
    setError('');
    if (!open || query.trim().length < 2) {
      setResults([]);
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    setError('');
    setActive(-1);
    const timer = setTimeout(async () => {
      try {
        const data = await searchPlaces(query.trim(), controller.signal);
        if (!controller.signal.aborted) {
          setResults(data.places);
          setError(data.notice || '');
        }
      } catch (e) {
        if (!controller.signal.aborted) setError(e.message);
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);
  useEffect(() => {
    const close = (e) => {
      if (!box.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const select = (p) => {
    if (!p) return;
    voice.stop();
    onChange(p);
    setQuery(p.name);
    setOpen(false);
  };
  return (
    <div className="place-field" ref={box}>
      <label htmlFor={id}>{label}</label>
      <div className="search-input">
        <MapPin size={17} />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-results`}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${id}-${active}` : undefined}
          value={query}
          autoComplete="off"
          placeholder="Search a place"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(null);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (!open || busy || !results.length) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            }
            if (e.key === 'Enter' && active >= 0) {
              e.preventDefault();
              select(results[active]);
            }
          }}
        />
        <button
          className={`icon-btn ${voice.listening ? 'listening' : ''}`}
          type="button"
          aria-label={`Voice search ${label}`}
          onClick={voice.toggle}
        >
          <Mic size={16} />
        </button>
        {onLocate && (
          <button
            type="button"
            className="icon-btn"
            title="Use my location"
            aria-label="Use my location"
            onClick={onLocate}
          >
            <LocateFixed size={16} />
          </button>
        )}
      </div>
      {voice.error && (
        <p className="error small" role="alert">
          {voice.error}
        </p>
      )}
      {open && query.trim().length >= 2 && (
        <div
          className="search-results"
          id={`${id}-results`}
          role="listbox"
          aria-label={`${label} results`}
        >
          {busy ? (
            <div className="search-note">
              <LoaderCircle className="spin" size={16} /> Finding places…
            </div>
          ) : results.length ? (
            results.map((p, i) => (
              <button
                type="button"
                role="option"
                aria-selected={active === i}
                id={`${id}-${i}`}
                key={p.id}
                onClick={() => select(p)}
                className={active === i ? 'highlight' : ''}
              >
                <span>{p.emoji || '📍'}</span>
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.area}</small>
                </span>
              </button>
            ))
          ) : (
            <p className="search-note">
              No places found. In demo mode, try Cubbon Park, MG Road or Church Street.
            </p>
          )}
          {error && <p className="search-note">{error}</p>}
        </div>
      )}
    </div>
  );
}
