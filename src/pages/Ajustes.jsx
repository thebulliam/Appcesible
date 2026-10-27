import PageTitle from "../components/PageTitle";
import { useApp } from "../context/AppContext";
import { clearAllData } from "../utils/storage";

const LANGS = [
  ["es-ES", "Español (España)"],
  ["ca-ES", "Català"],
  ["gl-ES", "Galego"],
  ["eu-ES", "Euskara"],
  ["en-GB", "English (UK)"],
  ["en-US", "English (US)"],
  ["fr-FR", "Français"],
  ["pt-PT", "Português"],
];

export default function Ajustes() {
  const { settings, setSetting, resetSettings, say, notify } = useApp();

  const check = (key, label, hint) => (
    <label className="choice">
      <input
        type="checkbox"
        checked={settings[key]}
        onChange={(e) => setSetting(key, e.target.checked)}
      />
      <span>
        {label}
        {hint && <small> {hint}</small>}
      </span>
    </label>
  );

  const wipe = () => {
    if (
      window.confirm(
        "Se borrarán los perfiles, tickets y documentos guardados en este navegador. ¿Continuar?"
      )
    ) {
      clearAllData();
      resetSettings();
      notify("Se han borrado todos los datos guardados en este navegador.");
    }
  };

  return (
    <>
      <PageTitle>Ajustes de accesibilidad</PageTitle>

      <form className="settings" onSubmit={(e) => e.preventDefault()}>
        <h2>Pantalla</h2>
        <div className="field">
          <label htmlFor="theme">Tema de colores</label>
          <select id="theme" value={settings.theme} onChange={(e) => setSetting("theme", e.target.value)}>
            <option value="auto">Automático (el del sistema)</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="contrast">Alto contraste (amarillo sobre negro)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="fontScale">Tamaño del texto</label>
          <select
            id="fontScale"
            value={settings.fontScale}
            onChange={(e) => setSetting("fontScale", Number(e.target.value))}
          >
            <option value={100}>100 % (normal)</option>
            <option value={125}>125 %</option>
            <option value={150}>150 %</option>
            <option value={175}>175 %</option>
            <option value={200}>200 %</option>
          </select>
        </div>

        <h2>Voz</h2>
        <fieldset>
          <legend>Cómo quiero oír la app</legend>
          <label className="choice">
            <input
              type="radio"
              name="voiceMode"
              checked={settings.voiceMode === "reader"}
              onChange={() => setSetting("voiceMode", "reader")}
            />
            <span>
              Uso lector de pantalla (JAWS, NVDA, Narrator)
              <small> La app no habla: lo lee mi lector.</small>
            </span>
          </label>
          <label className="choice">
            <input
              type="radio"
              name="voiceMode"
              checked={settings.voiceMode === "app"}
              onChange={() => setSetting("voiceMode", "app")}
            />
            <span>
              Voz de la app
              <small> La app lee las preguntas y los avisos en voz alta. No la actives si ya usas un lector.</small>
            </span>
          </label>
          <label className="choice">
            <input
              type="radio"
              name="voiceMode"
              checked={settings.voiceMode === "silent"}
              onChange={() => setSetting("voiceMode", "silent")}
            />
            <span>Sin voz, solo texto</span>
          </label>
        </fieldset>

        <div className="field">
          <label htmlFor="rate">Velocidad de la voz de la app: {settings.rate.toFixed(1)}×</label>
          <input
            id="rate"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.rate}
            aria-valuetext={`${settings.rate.toFixed(1)} veces la velocidad normal`}
            onChange={(e) => setSetting("rate", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="lang">Idioma del dictado y de la voz</label>
          <select id="lang" value={settings.lang} onChange={(e) => setSetting("lang", e.target.value)}>
            {LANGS.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={() => say("Hola. Así suena la voz de la aplicación.")}>
          Probar la voz de la app
        </button>

        <h2>Dictado y atajos</h2>
        <fieldset>
          <legend>Opciones</legend>
          {check(
            "autoListen",
            "Activar el micrófono solo tras leer cada pregunta",
            "(solo con «Voz de la app»; permite trabajar sin tocar nada)"
          )}
          {check(
            "voiceCommands",
            "Órdenes de voz al dictar",
            "(«siguiente», «atrás», «repetir», «borrar»)"
          )}
          {check(
            "spokenPunctuation",
            "Puntuación hablada",
            "(«coma», «punto», «nueva línea» se convierten en signos)"
          )}
          {check("sounds", "Pitidos al empezar y terminar el dictado")}
          {check(
            "shortcuts",
            "Atajos de teclado",
            "(Alt+M micrófono, Alt+S siguiente, Alt+A anterior, Alt+R repetir)"
          )}
        </fieldset>

        <h2>Datos</h2>
        <p>
          Tus ajustes, perfiles, tickets y documentos se guardan solo en este navegador.
        </p>
        <div className="wizard-nav">
          <button type="button" onClick={resetSettings}>
            Restablecer ajustes
          </button>
          <button type="button" onClick={wipe}>
            Borrar todos mis datos guardados
          </button>
        </div>
      </form>
    </>
  );
}
