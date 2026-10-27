import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { beep, cancelSpeech } from "../utils/speech";

export const getRecognitionCtor = () =>
  typeof window === "undefined"
    ? null
    : window.SpeechRecognition || window.webkitSpeechRecognition || null;

/**
 * Dictado por voz (Web Speech API: Chrome y Edge).
 * onFinal(texto)   -> fragmento ya reconocido
 * onInterim(texto) -> texto provisional mientras se habla
 * onEnd(error)     -> el dictado terminó (error vacío si todo fue bien)
 */
export default function useSpeechRecognition({
  onFinal,
  onInterim,
  onEnd,
  continuous = true,
} = {}) {
  const { settings, micActiveRef } = useApp();
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const handlers = useRef({});
  handlers.current = { onFinal, onInterim, onEnd };
  const supported = Boolean(getRecognitionCtor());
  const { lang, sounds } = settings;

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recRef.current) return;
    cancelSpeech(); // el micrófono no debe oír la voz de la app
    const rec = new Ctor();
    let lastError = "";
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      micActiveRef.current = true;
      setListening(true);
      if (sounds) beep(880);
    };
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (r.isFinal) {
          if (handlers.current.onFinal) handlers.current.onFinal(r[0].transcript.trim());
        } else {
          interim += r[0].transcript;
        }
      }
      if (handlers.current.onInterim) handlers.current.onInterim(interim);
    };
    rec.onerror = (e) => {
      lastError = e.error || "error";
    };
    rec.onend = () => {
      recRef.current = null;
      micActiveRef.current = false;
      setListening(false);
      if (sounds) beep(440);
      if (handlers.current.onInterim) handlers.current.onInterim("");
      if (handlers.current.onEnd) handlers.current.onEnd(lastError);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      recRef.current = null;
      if (handlers.current.onEnd) handlers.current.onEnd("start");
    }
  }, [lang, sounds, continuous, micActiveRef]);

  const stop = useCallback(() => {
    if (recRef.current) recRef.current.stop();
  }, []);

  // Al salir de la pantalla se corta el micrófono
  useEffect(
    () => () => {
      if (recRef.current) {
        recRef.current.onend = null;
        recRef.current.abort();
        recRef.current = null;
        micActiveRef.current = false;
      }
    },
    [micActiveRef]
  );

  return { listening, supported, start, stop };
}
