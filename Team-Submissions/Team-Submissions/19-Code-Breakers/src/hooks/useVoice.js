import { useCallback, useEffect, useRef, useState } from 'react';
export function useVoice(onText, lang = 'en-IN') {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognition = useRef(null);
  const callback = useRef(onText);
  callback.current = onText;
  const cancel = useCallback(() => {
    const instance = recognition.current;
    // Invalidate callbacks before aborting: browsers may deliver a late result or end event.
    recognition.current = null;
    if (instance) {
      instance.onresult = instance.onend = instance.onerror = null;
      instance.abort();
    }
  }, []);
  const stop = useCallback(() => {
    cancel();
    setListening(false);
  }, [cancel]);
  useEffect(() => {
    setListening(false);
    setError('');
    return cancel;
  }, [lang, cancel]);
  function toggle() {
    if (recognition.current) {
      stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not supported here. Try Chrome or Edge, or type your text.');
      return;
    }
    const instance = new SpeechRecognition();
    recognition.current = instance;
    instance.lang = lang;
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    instance.onresult = (event) => {
      if (recognition.current !== instance) return;
      const text = event.results?.[0]?.[0]?.transcript;
      if (typeof text === 'string') callback.current(text);
    };
    instance.onend = () => {
      if (recognition.current !== instance) return;
      recognition.current = null;
      setListening(false);
    };
    instance.onerror = (event) => {
      if (recognition.current !== instance) return;
      stop();
      setError(
        event.error === 'not-allowed'
          ? 'Microphone access was denied. Enable it in browser settings, or type instead.'
          : 'Voice input stopped (' + event.error + '). You can try again or type.',
      );
    };
    setError('');
    try {
      instance.start();
      setListening(true);
    } catch {
      stop();
      setError('Microphone could not start. Please try again.');
    }
  }
  return { listening, error, toggle, stop };
}
export function speak(text, lang) {
  if (!('speechSynthesis' in window))
    throw new Error('Spoken audio is not supported by this browser.');
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  if (voices.length && !voice)
    throw new Error(
      'No voice for this language is installed. Add a matching system voice or read the translation below.',
    );
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}
