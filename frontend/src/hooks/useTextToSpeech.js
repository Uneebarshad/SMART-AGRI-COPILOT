import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Phase-1 voice output — a thin, dependency-free wrapper around the browser
 * native SpeechSynthesis API. It speaks an assistant text response in the
 * current application language. No server TTS, no audio storage, no growing
 * queue (Voice Phase-1 plan).
 */

// App locale → BCP-47 voice tag. Roman Urdu uses the Urdu (ur-PK) voice where
// the device supports it; never hardcode a single language for every user.
const SPEECH_LOCALES = {
  en: 'en-US',
  ur: 'ur-PK',
  'ur-Latn': 'ur-PK',
};

function getSynth() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
}

// Light markdown/formatting cleanup so the spoken output sounds natural,
// without altering the visible assistant message (pass a copy, not the
// rendered text). Assistant content is plain text today, so this is defensive.
function stripForSpeech(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → label text
    .replace(/[*_~#>|]+/g, ' ') // emphasis / heading / table markers
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} lang the application language ('en' | 'ur' | 'ur-Latn').
 * @returns feature flag, isSpeaking state and speak/stop/pause/resume.
 */
export function useTextToSpeech(lang = 'en') {
  const synth = getSynth();
  const isSupported = Boolean(synth);

  const langRef = useRef(lang);
  langRef.current = lang;

  const [isSpeaking, setIsSpeaking] = useState(false);

  const stop = useCallback(() => {
    if (!synth) return;
    try {
      synth.cancel();
    } catch {
      // Ignore — nothing playing.
    }
    setIsSpeaking(false);
  }, [synth]);

  const speak = useCallback(
    (text) => {
      if (!synth) return;
      const cleaned = stripForSpeech(text);
      if (!cleaned) return; // never speak empty strings

      try {
        synth.cancel(); // drop any previous utterance — no growing queue
      } catch {
        // Ignore and try to speak anyway.
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = SPEECH_LOCALES[langRef.current] || 'en-US';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      try {
        synth.speak(utterance);
      } catch {
        setIsSpeaking(false);
      }
    },
    [synth],
  );

  const pause = useCallback(() => {
    if (!synth) return;
    try {
      synth.pause();
    } catch {
      // Not always supported — ignore.
    }
  }, [synth]);

  const resume = useCallback(() => {
    if (!synth) return;
    try {
      synth.resume();
    } catch {
      // Not always supported — ignore.
    }
  }, [synth]);

  // Cancel any playback on unmount (e.g. navigating away while speaking).
  useEffect(
    () => () => {
      if (!synth) return;
      try {
        synth.cancel();
      } catch {
        // Ignore.
      }
    },
    [synth],
  );

  return { isSupported, isSpeaking, speak, stop, pause, resume };
}
