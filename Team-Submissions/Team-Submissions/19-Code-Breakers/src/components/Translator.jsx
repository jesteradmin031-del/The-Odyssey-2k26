import { useEffect, useRef, useState } from 'react';
import {
  ArrowRightLeft,
  Mic,
  ScanText,
  Volume2,
  Copy,
  LoaderCircle,
  Languages,
  X,
  ArrowRight,
} from 'lucide-react';
import { languages, phrasebook } from '../../shared/data.js';
import { translate } from '../services/api.js';
import { useVoice, speak } from '../hooks/useVoice.js';
export default function Translator({ notify, onCheckNotice, onLocalNotice }) {
  const [from, setFrom] = useState('en'),
    [to, setTo] = useState('kn'),
    [text, setText] = useState('Where is the metro station?');
  const [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [image, setImage] = useState(''),
    [ocrBusy, setOcrBusy] = useState(false),
    [progress, setProgress] = useState(''),
    [ocrLanguage, setOcrLanguage] = useState('eng');
  const worker = useRef(null),
    mounted = useRef(true),
    requestId = useRef(0),
    fileInput = useRef(null);
  const voice = useVoice(
    (value) => {
      setText(value.slice(0, 3000));
      invalidate();
    },
    languages.find((l) => l.code === from).speech,
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current++;
      worker.current?.terminate();
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image);
    },
    [image],
  );
  function invalidate() {
    voice.stop();
    requestId.current++;
    setResult(null);
    setError('');
    setBusy(false);
  }
  async function runTranslate() {
    voice.stop();
    const id = ++requestId.current;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const data = await translate(text.trim(), from, to);
      if (mounted.current && id === requestId.current) setResult(data);
    } catch (e) {
      if (mounted.current && id === requestId.current) setError(e.message);
    } finally {
      if (mounted.current && id === requestId.current) setBusy(false);
    }
  }
  async function scan(file) {
    if (!file) return;
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError('Choose a PNG, JPG or WebP image smaller than 8 MB.');
      return;
    }
    invalidate();
    setFrom(languages.find((l) => l.ocr === ocrLanguage).code);
    setImage(URL.createObjectURL(file));
    setOcrBusy(true);
    setProgress('Loading recognition engine…');
    try {
      const { createWorker } = await import('tesseract.js');
      const w = await createWorker(ocrLanguage, 1, {
        logger: (m) => {
          if (mounted.current) setProgress(`${m.status} ${Math.round((m.progress || 0) * 100)}%`);
        },
      });
      if (!mounted.current) {
        await w.terminate();
        return;
      }
      worker.current = w;
      const { data } = await w.recognize(file);
      if (mounted.current) {
        setText(data.text.trim().slice(0, 3000));
        setResult(null);
        setError(
          data.text.trim() ? '' : 'No text was detected. Try a clear, well-lit photo of the sign.',
        );
        setProgress(
          `Scan complete · ${Math.round(data.confidence)}% OCR confidence. Review the text before translating.`,
        );
      }
    } catch {
      if (mounted.current)
        setError(
          'Scanning could not finish. First use needs internet to download OCR language files. Try again, choose another image, or type the text.',
        );
    } finally {
      await worker.current?.terminate();
      worker.current = null;
      if (mounted.current) setOcrBusy(false);
    }
  }
  return (
    <section className="translator-panel">
      <div className="section-eyebrow">
        <Languages size={15} /> SPEAK LIKE A LOCAL
      </div>
      <h2>
        A little less lost.
        <br />A little more local.
      </h2>
      <p className="muted">
        Translate a conversation, a street sign, or your next small adventure.
      </p>
      <div className="language-row">
        <label>
          From
          <select
            aria-label="Source language"
            value={from}
            disabled={ocrBusy}
            onChange={(e) => {
              setFrom(e.target.value);
              invalidate();
            }}
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="icon-btn swap-language"
          aria-label="Swap languages"
          disabled={ocrBusy}
          onClick={() => {
            setFrom(to);
            setTo(from);
            setText(result?.text ?? text);
            invalidate();
          }}
        >
          <ArrowRightLeft size={18} />
        </button>
        <label>
          To
          <select
            aria-label="Target language"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              invalidate();
            }}
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="translation-input">
        <textarea
          aria-label="Text to translate"
          maxLength={3000}
          value={text}
          disabled={ocrBusy}
          onChange={(e) => {
            setText(e.target.value);
            invalidate();
          }}
          placeholder="Type, speak, or scan text…"
        />
        <div>
          <button
            className={`text-btn ${voice.listening ? 'listening' : ''}`}
            disabled={ocrBusy}
            onClick={voice.toggle}
          >
            <Mic size={16} />
            {voice.listening ? 'Stop listening' : 'Voice input'}
          </button>
          <small>{text.length}/3000</small>
        </div>
      </div>
      <p className="fine-print">Voice uses your browser’s speech service and may need internet.</p>
      <button
        className="primary full"
        onClick={runTranslate}
        disabled={busy || ocrBusy || !text.trim()}
      >
        {busy ? <LoaderCircle className="spin" size={18} /> : <Languages size={18} />}{' '}
        {busy ? 'Translating…' : 'Translate'}
        <ArrowRight size={18} />
      </button>
      {(error || voice.error) && (
        <p role="alert" className="error">
          {error || voice.error}
        </p>
      )}
      {result && (
        <div className="translation-result" aria-live="polite">
          <div className="result-head">
            <span>{languages.find((l) => l.code === to).name}</span>
            <span className="mini-badge">
              {result.source === 'openai'
                ? 'AI translation'
                : result.source === 'phrasebook'
                  ? 'Offline phrasebook'
                  : 'Same language'}
            </span>
          </div>
          <p lang={to}>{result.text}</p>
          <div className="button-row">
            <button
              className="text-btn"
              onClick={() => {
                try {
                  speak(result.text, languages.find((l) => l.code === to).speech);
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              <Volume2 size={16} />
              Listen
            </button>
            <button
              className="text-btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result.text);
                  notify('Translation copied.');
                } catch {
                  setError('Could not copy. Select and copy the translation manually.');
                }
              }}
            >
              <Copy size={15} />
              Copy
            </button>
          </div>
        </div>
      )}
      <div className="scan-card">
        <div className="subheading">
          <ScanText size={20} />
          <strong>Read the world around you</strong>
        </div>
        <p>
          Scan a sign or menu. Text recognition runs in your browser; images stay on this device.
        </p>
        <label className="ocr-label">
          Text in the image
          <select
            aria-label="Scan language"
            value={ocrLanguage}
            disabled={ocrBusy}
            onChange={(e) => setOcrLanguage(e.target.value)}
          >
            {languages.map((l) => (
              <option value={l.ocr} key={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <input
          ref={fileInput}
          className="sr-only"
          type="file"
          aria-label="Upload image to scan"
          accept="image/png,image/jpeg,image/webp"
          capture="environment"
          disabled={ocrBusy}
          onChange={(e) => {
            scan(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <button
          className="secondary full"
          disabled={ocrBusy}
          onClick={() => fileInput.current.click()}
        >
          {ocrBusy ? <LoaderCircle className="spin" size={16} /> : <ScanText size={16} />}{' '}
          {ocrBusy ? 'Reading image…' : 'Scan or upload an image'}
        </button>
        {image && (
          <img className="scan-preview" src={image} alt="Selected sign for text recognition" />
        )}
        {progress && (
          <p className="fine-print" role="status">
            {progress}
          </p>
        )}
        <p className="fine-print">
          PNG, JPG or WebP · up to 8 MB · language files need internet on first use.
        </p>
      </div>
      <div className="phrasebook">
        {onLocalNotice && (
          <div className="notice-handoff">
            <h3>Does this notice close a mapped path?</h3>
            <p className="muted small">
              Send reviewed words to Route lab, match the affected path and recalculate locally.
            </p>
            <button
              className="secondary full"
              disabled={ocrBusy || busy || !text.trim()}
              onClick={() =>
                onLocalNotice(
                  result?.text ? `${text}\n\nReviewed translation:\n${result.text}` : text,
                )
              }
            >
              <ScanText size={16} /> Send notice to Route lab
            </button>
          </div>
        )}
        {onCheckNotice && (
          <div className="notice-handoff">
            <h3>Does this sign affect your trip?</h3>
            <p className="muted small">
              Send reviewed text to Notice check, then choose your next move.
            </p>
            <button
              className="secondary full"
              disabled={ocrBusy || busy || !text.trim()}
              onClick={() => onCheckNotice({ original: text, text: result?.text || text })}
            >
              <ScanText size={16} /> Check this as a travel notice
            </button>
          </div>
        )}
        <h3>Keep these in your pocket</h3>
        <p className="muted small">Try an offline phrase in any of the seven languages.</p>
        {phrasebook.map((p) => (
          <button
            key={p.en}
            disabled={ocrBusy}
            onClick={() => {
              setText(p[from]);
              invalidate();
            }}
          >
            {p[from]}
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
    </section>
  );
}
