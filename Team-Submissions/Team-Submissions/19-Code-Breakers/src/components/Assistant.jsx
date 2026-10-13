import { useState } from 'react';
import { Sparkles, ArrowUp, LoaderCircle } from 'lucide-react';
import { askAssistant } from '../services/api.js';
import { places } from '../../shared/data.js';
export default function Assistant({ origin, destination, mode, onSelect }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hey, explorer. Tell me what kind of trip you have in mind — a coffee stop, a quieter afternoon, or help finding your way.',
      source: 'demo',
    },
  ]);
  const [input, setInput] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function send(text) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError('');
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    try {
      const result = await askAssistant(text, { origin, destination, mode });
      setMessages((m) => [...m, { role: 'assistant', ...result }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="assistant-panel">
      <div className="assistant-mark">
        <Sparkles size={26} />
      </div>
      <div className="section-eyebrow">YOUR LOCAL SIDEKICK</div>
      <h2>
        Good trips start
        <br />
        with a little curiosity.
      </h2>
      <p className="muted">A travel assistant for the questions between A and B.</p>
      <div className="chat-messages" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            <small>
              {m.role === 'user'
                ? 'You'
                : m.source === 'openai'
                  ? 'LocalRoute AI'
                  : 'LocalRoute · demo helper'}
            </small>
            <p>{m.text}</p>
            {m.notice && <small>{m.notice}</small>}
          </div>
        ))}
        {busy && (
          <p className="loading-line">
            <LoaderCircle size={16} className="spin" /> Thinking about your trip…
          </p>
        )}
      </div>
      <div className="suggested-prompts">
        {['Find a coffee stop', 'What about safety?', 'Help me translate a sign'].map((t) => (
          <button disabled={busy} key={t} onClick={() => send(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="assistant-actions">
        <h3>Turn inspiration into a plan</h3>
        <p className="muted small">Choose from the curated Bengaluru collection.</p>
        {places
          .filter((p) => ['coffee', 'cubbon', 'museum'].includes(p.id))
          .map((p) => (
            <button className="stop-suggestion" key={p.id} onClick={() => onSelect(p)}>
              <span>{p.emoji}</span>
              <span>
                <strong>{p.name}</strong>
                <small>Use as destination</small>
              </span>
              <ArrowUp size={15} />
            </button>
          ))}
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          aria-label="Ask LocalRoute AI"
          maxLength={1000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your local sidekick…"
        />
        <button aria-label="Send message" disabled={busy || !input.trim()}>
          <ArrowUp size={20} />
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="fine-print">
        AI can make mistakes. Verify local conditions and directions. Demo mode uses a small
        rule-based helper.
      </p>
    </section>
  );
}
