import { useEffect, useState } from "react";
import PageTitle from "../components/PageTitle";
import VoiceField from "../components/VoiceField";
import ShareBar from "../components/ShareBar";
import { useApp } from "../context/AppContext";
import { slugify } from "../utils/download";
import { loadJSON, saveJSON } from "../utils/storage";

const KEY = "ad.documento";

export default function Documento() {
  const { notify } = useApp();
  const saved = loadJSON(KEY, { title: "", body: "" });
  const [title, setTitle] = useState(saved.title);
  const [body, setBody] = useState(saved.body);

  useEffect(() => {
    saveJSON(KEY, { title, body });
  }, [title, body]);

  const text = [title.trim(), body.trim()].filter(Boolean).join("\n\n") + (title || body ? "\n" : "");

  const clearAll = () => {
    if (window.confirm("¿Borrar el título y el texto?")) {
      setTitle("");
      setBody("");
      notify("Documento borrado.");
    }
  };

  return (
    <>
      <PageTitle>Dictar un documento</PageTitle>
      <p className="lead">
        Dicta o escribe un texto libre: una nota, un correo, un informe. Se guarda solo en este
        navegador mientras trabajas.
      </p>

      <VoiceField id="doc-titulo" label="Título" value={title} onChange={setTitle} />
      <VoiceField
        id="doc-cuerpo"
        label="Texto del documento"
        hint="Alt+M activa o desactiva el micrófono. En Ajustes puedes activar la puntuación hablada («coma», «punto», «nueva línea»)."
        value={body}
        onChange={setBody}
        multiline
        rows={14}
      />

      <ShareBar
        text={text}
        filename={slugify(title, "documento")}
        subject={title.trim() || "Documento"}
      />

      <div className="wizard-nav">
        <button type="button" onClick={clearAll} disabled={!title && !body}>
          Borrar todo
        </button>
      </div>
    </>
  );
}
