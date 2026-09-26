import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Phase-1 voice input — a thin, dependency-free wrapper around the browser
 * native Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 *
 * It is a pure input/presentation layer: it only produces a text transcript
 * that the caller feeds into the existing `useConversation.send()` flow. It
 * never calls the backend, stores audio, or runs continuously — one
 * user-controlled listening session at a time (Voice Phase-1 plan).
 */

// Map the app's locale codes to BCP-47 tags for the recognizer. Roman Urdu is
// recognized as spoken Urdu (ur-PK); the transcript then flows into the same
// text pipeline — there is no separate Roman Urdu speech engine in Phase 1.
const RECOGNITION_LOCALES = {
  en: 'en-US',
  ur: 'ur-PK',
  'ur-Latn': 'ur-PK',
};

// Normalize the raw SpeechRecognition error codes to stable, UI-mappable keys.
// 'no-speech' and 'aborted' are benign (silence / user stop) → no error shown.
function normalizeError(code) {
  switch (code) {
    case 'not-allowed':
      return 'permission-denied';
    case 'service-not-allowed':
      return 'service-denied';
    case 'audio-capture':
      return 'no-mic';
    case 'network':
      return 'network';
    case 'no-speech':
    case 'aborted':
      return null;
    default:
      return 'error';
  }
}

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * @param {string} lang the application language ('en' | 'ur' | 'ur-Latn').
 * @returns feature flag, listening/transcript state and start/stop/toggle.
 */
export function useSpeechRecognition(lang = 'en') {
  const Ctor = getRecognitionCtor();
  const isSupported = Boolean(Ctor);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const langRef = useRef(lang);
  langRef.current = lang;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  // Detach handlers and drop the instance so the next start() builds a fresh
  // recognizer (prevents duplicate/leaked instances).
  const teardown = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.stop();
    } catch {
      // Already stopped — nothing to do.
    }
    recognitionRef.current = null;
  }, []);

  const start = useCallback(() => {
    if (!isSupported || recognitionRef.current) return; // guard duplicates
    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');

    const recognition = new Ctor();
    recognition.lang = RECOGNITION_LOCALES[langRef.current] || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false; // Phase 1: single, user-controlled session
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) final += text;
        else interim += text;
      }
      if (final) {
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current.trim());
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim.trim());
      }
    };

    recognition.onerror = (event) => {
      setError(normalizeError(event.error));
    };

    // Do NOT auto-restart: one session ends and stays ended until the user
    // presses the mic again.
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      teardown();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      teardown();
      setError('start-failed');
    }
  }, [isSupported, Ctor, teardown]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // Ignore — onend will clean up.
    }
  }, []);

  const toggle = useCallback(() => {
    if (recognitionRef.current) stop();
    else start();
  }, [start, stop]);

  // Let the parent clear the transcript once it has been moved into the
  // composer, so a repeat of the same text can be detected next time.
  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  // Stop cleanly on unmount (e.g. navigating away mid-listening).
  useEffect(() => teardown, [teardown]);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    toggle,
    resetTranscript,
  };
}
