import { useEffect, useRef, useState } from "react";
import VoiceField from "./VoiceField";
import VoiceChoice from "./VoiceChoice";
import { useApp } from "../context/AppContext";
import { cancelSpeech } from "../utils/speech";

const isEmpty = (v) =>
  Array.isArray(v) ? v.length === 0 : !String(v === undefined || v === null ? "" : v).trim();

/**
 * Asistente pregunta a pregunta.
 * questions: [{ id, type: "text" | "longtext" | "choice" | "multi", label, hint, options, required }]
 * answers / onAnswer(id, valor): estado controlado por la página
 * Atajos: Alt+S siguiente, Alt+A anterior, Alt+R repetir, Alt+M micrófono.
 * Órdenes de voz mientras se dicta: «siguiente», «atrás», «repetir», «borrar».
 */
export default function Wizard({
  questions,
  answers,
  onAnswer,
  onFinish,
  finishLabel = "Generar documento",
}) {
  const { settings, say, notify } = useApp();
  const [step, setStep] = useState(0);
  const headingRef = useRef(null);
  const fieldRef = useRef(null);
  const prevStep = useRef(step);

  const total = questions.length;
  const q = questions[step];
  const isLast = step === total - 1;
  const isChoice = q.type === "choice" || q.type === "multi";
  const value = answers[q.id] === undefined ? (q.type === "multi" ? [] : "") : answers[q.id];

  const spoken =
    `Pregunta ${step + 1} de ${total}. ${q.label}.` +
    (q.options
      ? ` Opciones: ${q.options.map((o, i) => `${i + 1}, ${o}`).join(". ")}.`
      : "");

  const goNext = () => {
    if (q.required && isEmpty(value)) {
      notify("Esta pregunta es obligatoria.");
      return;
    }
    if (isLast) onFinish();
    else setStep((s) => Math.min(s + 1, total - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));
  const repeat = () => {
    if (fieldRef.current) fieldRef.current.stop();
    setTimeout(() => notify(spoken), 400);
  };
  const clearField = () => onAnswer(q.id, q.type === "multi" ? [] : "");

  const commands = {
    siguiente: goNext,
    adelante: goNext,
    continuar: goNext,
    saltar: goNext,
    atras: goBack,
    anterior: goBack,
    volver: goBack,
    repetir: repeat,
    repite: repeat,
    borrar: clearField,
    "borrar todo": clearField,
  };

  // Atajos de teclado globales dentro del asistente
  const latest = useRef({});
  latest.current = { KeyS: goNext, KeyA: goBack, KeyR: repeat };
  useEffect(() => {
    if (!settings.shortcuts) return undefined;
    const onKey = (e) => {
      if (!e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;
      const fn = latest.current[e.code];
      if (!fn) return;
      e.preventDefault();
      fn();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings.shortcuts]);

  // Al cambiar de pregunta: foco en el encabezado y, si procede, lectura con la voz de la app
  useEffect(() => {
    if (prevStep.current !== step) {
      prevStep.current = step;
      if (headingRef.current) headingRef.current.focus();
    }
    if (settings.voiceMode === "app") {
      say(spoken, {
        onEnd: () => {
          if (settings.autoListen && fieldRef.current) fieldRef.current.start();
        },
      });
    }
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const qId = `q-${q.id}`;

  return (
    <section className="wizard">
      <p className="progress">
        Pregunta {step + 1} de {total}
      </p>
      <div className="progress-bar" aria-hidden="true">
        <div style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>

      <h2 id={qId} ref={headingRef} tabIndex={-1}>
        {q.label}
        {q.required ? " (obligatoria)" : ""}
      </h2>

      {isChoice ? (
        <VoiceChoice
          key={q.id}
          ref={fieldRef}
          id={`f-${q.id}`}
          labelledBy={qId}
          hint={q.hint}
          options={q.options}
          multi={q.type === "multi"}
          value={value}
          onChange={(v) => onAnswer(q.id, v)}
          commands={commands}
        />
      ) : (
        <VoiceField
          key={q.id}
          ref={fieldRef}
          id={`f-${q.id}`}
          labelledBy={qId}
          hint={q.hint}
          value={value}
          onChange={(v) => onAnswer(q.id, v)}
          multiline={q.type === "longtext"}
          commands={commands}
          placeholder={q.placeholder}
        />
      )}

      <div className="wizard-nav">
        <button type="button" onClick={goBack} disabled={step === 0} aria-keyshortcuts="Alt+A">
          Anterior
        </button>
        <button type="button" onClick={repeat} aria-keyshortcuts="Alt+R">
          Repetir pregunta
        </button>
        <button type="button" className="primary" onClick={goNext} aria-keyshortcuts="Alt+S">
          {isLast ? finishLabel : "Siguiente"}
        </button>
      </div>

      <p className="help">
        {settings.shortcuts &&
          "Atajos: Alt+M micrófono, Alt+S siguiente, Alt+A anterior, Alt+R repetir pregunta. "}
        {settings.voiceCommands &&
          "Órdenes de voz mientras dictas: «siguiente», «atrás», «repetir» y «borrar»."}
      </p>
    </section>
  );
}
