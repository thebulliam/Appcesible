import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { loadJSON, saveJSON } from "../utils/storage";
import { speak } from "../utils/speech";

const KEY = "ad.settings";

export const DEFAULT_SETTINGS = {
  theme: "auto", // auto | light | dark | contrast
  fontScale: 100, // % del tamaño de letra base
  voiceMode: "reader", // reader (lector de pantalla) | app (voz de la app) | silent
  rate: 1,
  lang: "es-ES",
  autoListen: false,
  voiceCommands: true,
  shortcuts: true,
  sounds: true,
  spokenPunctuation: false,
};

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...loadJSON(KEY, {}),
  }));
  const [status, setStatus] = useState("");
  const flip = useRef(false);
  const micActiveRef = useRef(false);

  useEffect(() => {
    saveJSON(KEY, settings);
    const root = document.documentElement;
    root.style.fontSize = `${settings.fontScale}%`;
    if (settings.theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", settings.theme);
  }, [settings]);

  const setSetting = useCallback(
    (key, value) => setSettings((s) => ({ ...s, [key]: value })),
    []
  );
  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  // Voz de la app (síntesis del navegador) con los ajustes de la persona
  const say = useCallback(
    (text, opts = {}) =>
      speak(text, { rate: settings.rate, lang: settings.lang, ...opts }),
    [settings.rate, settings.lang]
  );

  // Mensaje de estado: se ve siempre; lo lee el lector de pantalla (aria-live)
  // o la voz de la app según el modo elegido. Nunca habla mientras el micrófono escucha.
  const notify = useCallback(
    (message, { speak: doSpeak = true } = {}) => {
      flip.current = !flip.current;
      setStatus(message + (flip.current ? "​" : ""));
      if (doSpeak && settings.voiceMode === "app" && !micActiveRef.current) {
        say(message);
      }
    },
    [settings.voiceMode, say]
  );

  const value = useMemo(
    () => ({
      settings,
      setSetting,
      resetSettings,
      status,
      notify,
      say,
      micActiveRef,
    }),
    [settings, setSetting, resetSettings, status, notify, say]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
