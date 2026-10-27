import { useState } from "react";
import { useApp } from "../context/AppContext";
import { cancelSpeech } from "../utils/speech";
import { copyText, downloadText } from "../utils/download";

const MAIL_LIMIT = 1800;

/**
 * Botones para sacar un documento de la app:
 * copiar, descargar .txt, descargar .json (opcional), compartir, enviar por correo y leer en voz alta.
 */
export default function ShareBar({ text, filename, json, subject, extraCopy }) {
  const { notify, say } = useApp();
  const [reading, setReading] = useState(false);
  const empty = !text || !text.trim();
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async (content, okMsg) => {
    const ok = await copyText(content);
    notify(
      ok ? okMsg : "No se pudo copiar. Selecciona el texto y copia con Control más C."
    );
  };

  const download = () => {
    downloadText(`${filename}.txt`, text);
    notify(`Archivo descargado: ${filename}.txt`);
  };

  const downloadJson = () => {
    downloadText(`${filename}.json`, JSON.stringify(json, null, 2), "application/json");
    notify(`Archivo descargado: ${filename}.json`);
  };

  const share = async () => {
    try {
      const file = new File([text], `${filename}.txt`, { type: "text/plain" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: subject });
      } else {
        await navigator.share({ title: subject, text });
      }
      notify("Compartido.");
    } catch (e) {
      if (e && e.name !== "AbortError") {
        notify("No se pudo compartir. Descarga el archivo y adjúntalo.");
      }
    }
  };

  const mail = () => {
    let body = text;
    if (body.length > MAIL_LIMIT) {
      body = `${body.slice(0, MAIL_LIMIT)}\n\n[Texto recortado. Adjunta el archivo descargado para enviarlo completo.]`;
    }
    window.location.href = `mailto:?subject=${encodeURIComponent(subject || "Documento")}&body=${encodeURIComponent(body)}`;
  };

  const read = () => {
    if (reading) {
      cancelSpeech();
      setReading(false);
      return;
    }
    setReading(true);
    say(text, { onEnd: () => setReading(false) });
  };

  return (
    <div className="share-bar" role="group" aria-label="Compartir y exportar">
      <button type="button" className="primary" onClick={() => copy(text, "Texto copiado al portapapeles.")} disabled={empty}>
        Copiar texto
      </button>
      <button type="button" onClick={download} disabled={empty}>
        Descargar .txt
      </button>
      {json && (
        <button type="button" onClick={downloadJson} disabled={empty}>
          Descargar copia editable .json
        </button>
      )}
      {extraCopy && (
        <button
          type="button"
          onClick={() => copy(extraCopy.text, extraCopy.message)}
          disabled={empty}
        >
          {extraCopy.label}
        </button>
      )}
      {canShare && (
        <button type="button" onClick={share} disabled={empty}>
          Compartir
        </button>
      )}
      <button type="button" onClick={mail} disabled={empty}>
        Enviar por correo
      </button>
      <button type="button" onClick={read} disabled={empty} aria-pressed={reading}>
        Lectura en voz alta
      </button>
    </div>
  );
}
