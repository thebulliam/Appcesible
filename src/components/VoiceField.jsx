import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { describeSpeechError } from "../utils/speech";
import {
  applySpokenPunctuation,
  capitalizeStart,
  normalize,
} from "../utils/speechCommands";

/**
 * Campo de texto con dictado por voz.
 * - "label" muestra una etiqueta; "labelledBy" usa otro elemento (por ejemplo, el encabezado de la pregunta).
 * - "commands" es un objeto { "frase normalizada": función } para órdenes de voz.
 * - Atajo Alt+M dentro del campo: activar/desactivar el micrófono.
 */
const VoiceField = forwardRef(function VoiceField(
  {
    id,
    label,
    labelledBy,
    hint,
    value,
    onChange,
    multiline = false,
    rows = 6,
    commands,
    placeholder,
  },
  ref
) {
  const { settings, notify, say } = useApp();
  const [interim, setInterim] = useState("");
  const valueRef = useRef(value);
  valueRef.current = value;

  const { listening, supported, start, stop } = useSpeechRecognition({
    onInterim: setInterim,
    onFinal: (chunk) => {
      if (!chunk) return;
      if (settings.voiceCommands && commands) {
        const fn = commands[normalize(chunk)];
        if (fn) {
          fn();
          return;
        }
      }
      const prev = valueRef.current || "";
      let piece = settings.spokenPunctuation ? applySpokenPunctuation(chunk) : chunk;
      if (!prev || /[.!?]\s*$/.test(prev) || /\n$/.test(prev)) piece = capitalizeStart(piece);
      const glue = !prev || /\s$/.test(prev) || /^[.,:;\n]/.test(piece) ? "" : " ";
      const next = prev + glue + piece;
      valueRef.current = next;
      onChange(next);
    },
    onEnd: (err) =>
      notify(describeSpeechError(err) || "Dictado detenido.", { speak: false }),
  });

  const toggle = () => {
    if (listening) {
      stop();
    } else {
      notify("Escuchando. Habla ahora.", { speak: false });
      start();
    }
  };

  useImperativeHandle(ref, () => ({ start, stop }), [start, stop]);

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

  const clear = () => {
    valueRef.current = "";
    onChange("");
    notify("Campo borrado.");
  };

  const readAloud = () => {
    stop();
    say(value && value.trim() ? value : "El campo está vacío.");
  };

  const hintId = hint ? `${id}-hint` : undefined;
  const controlProps = {
    id,
    value: value || "",
    onChange: (e) => {
      valueRef.current = e.target.value;
      onChange(e.target.value);
    },
    onKeyDown,
    placeholder,
    autoComplete: "off",
    "aria-describedby": hintId,
    "aria-labelledby": labelledBy,
  };

  return (
    <div className="field">
      {!labelledBy && label && <label htmlFor={id}>{label}</label>}
      {hint && (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      )}
      {multiline ? (
        <textarea rows={rows} {...controlProps} />
      ) : (
        <input type="text" {...controlProps} />
      )}
      <p className="interim" aria-hidden="true">
        {interim ? `… ${interim}` : ""}
      </p>
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
              Dictado por voz
            </button>
            <span className="mic-state" aria-hidden="true">
              {listening ? "● Escuchando" : "Micrófono apagado"}
            </span>
          </>
        ) : (
          <p className="notice">
            Tu navegador no admite dictado por voz. Usa Chrome o Edge, o el dictado de
            Windows (tecla Windows + H) dentro del campo.
          </p>
        )}
        <button type="button" onClick={readAloud} disabled={!value}>
          Leer en voz alta
        </button>
        <button type="button" onClick={clear} disabled={!value}>
          Borrar
        </button>
      </div>
    </div>
  );
});

export default VoiceField;
