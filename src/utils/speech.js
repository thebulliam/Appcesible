let token = 0;
let audioCtx = null;

export const ttsSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices() || [];
  const exact = voices.find((v) => v.lang === lang);
  if (exact) return exact;
  const prefix = lang.slice(0, 2).toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) || null;
}

// Chrome corta las locuciones largas: se trocea el texto en frases
function toChunks(text, max = 180) {
  const flat = String(text)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (/[.!?:;,]$/.test(l) ? l : `${l}.`))
    .join(" ");
  const parts = flat.match(/[^.!?;:]+[.!?;:]*\s*/g) || [flat];
  const chunks = [];
  let cur = "";
  parts.forEach((p) => {
    if (cur && (cur + p).length > max) {
      chunks.push(cur.trim());
      cur = p;
    } else {
      cur += p;
    }
  });
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

export function speak(text, { rate = 1, lang = "es-ES", onEnd } = {}) {
  if (!ttsSupported() || !text) {
    if (onEnd) onEnd();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  token += 1;
  const myToken = token;
  const chunks = toChunks(text);
  const voice = pickVoice(lang);

  const next = (i) => {
    if (myToken !== token) return;
    if (i >= chunks.length) {
      if (onEnd) onEnd();
      return;
    }
    const u = new SpeechSynthesisUtterance(chunks[i]);
    u.lang = lang;
    u.rate = rate;
    if (voice) u.voice = voice;
    u.onend = () => next(i + 1);
    u.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      next(i + 1);
    };
    synth.speak(u);
  };
  next(0);
}

export function cancelSpeech() {
  token += 1;
  if (ttsSupported()) window.speechSynthesis.cancel();
}

export function beep(freq = 660, ms = 120) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx || new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + ms / 1000);
  } catch (e) {
    /* sin sonido */
  }
}

export function describeSpeechError(code) {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "El navegador no tiene permiso para usar el micrófono. Actívalo en la barra de direcciones.";
    case "no-speech":
      return "No se ha oído nada.";
    case "audio-capture":
      return "No se encuentra ningún micrófono.";
    case "network":
      return "El servicio de voz del navegador no responde. Comprueba la conexión.";
    case "aborted":
    case "":
    case undefined:
      return "";
    default:
      return `Error de dictado (${code}).`;
  }
}
