import { forwardRef, useImperativeHandle, useRef } from "react";
import { useApp } from "../context/AppContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { describeSpeechError } from "../utils/speech";
import { matchOptions, normalize } from "../utils/speechCommands";

/**
 * Pregunta de opciones (una o varias) que se puede responder con teclado o por voz
 * diciendo el número o el nombre de la opción.
 * - value: texto de la opción (una) o array de textos (varias)
 */
const VoiceChoice = forwardRef(function VoiceChoice(
  { id, labelledBy, hint, options, multi = false, value, onChange, commands },
  ref
) {
  const { settings, notify } = useApp();
  const pending = useRef("");
  const valueRef = useRef(value);
  valueRef.current = value;

  const { listening, supported, start, stop } = useSpeechRecognition({
    continuous: false,
    onFinal: (chunk) => {
      if (!chunk) return;
      const key = normalize(chunk);
      if (settings.voiceCommands && commands && commands[key]) {
        commands[key]();
        return;
      }
      if (multi && /^(ninguna|ninguno|nada)$/.test(key)) {
        onChange([]);
        pending.current = "No hay ninguna opción seleccionada.";
        return;
      }
      const idx = matchOptions(chunk, options, multi);
      if (!idx.length) {
        pending.current = "No he entendido la opción. Di el número o el nombre.";
        return;
      }
      if (multi) {
        const set = new Set([...(valueRef.current || []), ...idx.map((i) => options[i])]);
        const next = options.filter((o) => set.has(o));
        valueRef.current = next;
        onChange(next);
        pending.current = `Seleccionadas: ${next.join(", ")}.`;
      } else {
        valueRef.current = options[idx[0]];
        onChange(options[idx[0]]);
        pending.current = `Elegida: ${options[idx[0]]}.`;
      }
    },
    onEnd: (err) => {
      const msg = describeSpeechError(err) || pending.current;
      pending.current = "";
      if (msg) notify(msg);
    },
  });

  useImperativeHandle(ref, () => ({ start, stop }), [start, stop]);

  const toggle = () => {
    if (listening) {
      stop();
    } else {
      notify("Escuchando. Di el número o el nombre de la opción.", { speak: false });
      start();
    }
  };

  const onKeyDown = (e) => {
    if (
      settings.shortcuts &&
      e.altKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.metaKey &&
      e.code === "KeyM"
    ) {
      e.preventDefault();
      toggle();
    }
  };

  const hintId = hint ? `${id}-hint` : undefined;
  const selected = multi ? value || [] : value;

  const choose = (opt) => {
    if (multi) {
      const has = selected.includes(opt);
      onChange(
        options.filter((o) => (o === opt ? !has : selected.includes(o)))
      );
    } else {
      onChange(opt);
    }
  };

  return (
    <div className="field">
      {hint && (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      )}
      <fieldset
        className="choices"
        aria-labelledby={labelledBy}
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
      >
        {options.map((opt, i) => (
          <label className="choice" key={opt}>
            <input
              type={multi ? "checkbox" : "radio"}
              name={id}
              checked={multi ? selected.includes(opt) : selected === opt}
              onChange={() => choose(opt)}
            />
            <span>
              {i + 1}. {opt}
            </span>
          </label>
        ))}
      </fieldset>
      <div className="field-actions">
        {supported ? (
          <>
            <button
              type="button"
              onClick={toggle}
              aria-pressed={listening}
              aria-keyshortcuts="Alt+M"
              className={listening ? "listening" : ""}
            >
              Responder por voz
            </button>
            <span className="mic-state" aria-hidden="true">
              {listening ? "● Escuchando" : "Micrófono apagado"}
            </span>
          </>
        ) : (
          <p className="notice">
            Tu navegador no admite voz. Elige la opción con el teclado o usa Chrome o Edge.
          </p>
        )}
      </div>
    </div>
  );
});

export default VoiceChoice;
