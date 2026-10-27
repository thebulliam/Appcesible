import { useEffect, useRef, useState } from "react";
import PageTitle from "../components/PageTitle";
import Wizard from "../components/Wizard";
import ShareBar from "../components/ShareBar";
import VoiceField from "../components/VoiceField";
import useFocusOnMount from "../hooks/useFocusOnMount";
import { useApp } from "../context/AppContext";
import { buildInstructions, asFirstMessage } from "../utils/buildInstructions";
import { loadJSON, saveJSON } from "../utils/storage";

const KEY = "ad.perfil";

const QUESTIONS = [
  {
    id: "nombre",
    type: "text",
    label: "¿Cómo te llamas o cómo quieres que te llame el asistente?",
  },
  {
    id: "necesidades",
    type: "multi",
    label: "¿Qué necesidades de accesibilidad tienes?",
    hint: "Puedes elegir varias. Por voz di los números, por ejemplo «uno y tres». Di «ninguna» para vaciar.",
    options: [
      "Uso lector de pantalla",
      "Baja visión",
      "Dificultades motoras",
      "Dificultades auditivas",
      "Dificultades de lectura o atención",
    ],
  },
  {
    id: "dificultades",
    type: "longtext",
    label: "Cuéntame con tus palabras qué te resulta difícil al trabajar con el ordenador (opcional).",
    hint: "Por ejemplo: los menús desplegables, los formularios largos o las ventanas emergentes.",
  },
  {
    id: "longitud",
    type: "choice",
    label: "¿Cómo quieres la longitud de las respuestas?",
    options: ["Muy cortas", "Cortas, con opción de ampliar", "Detalladas"],
  },
  {
    id: "formato",
    type: "choice",
    label: "¿Qué formato prefieres para las respuestas?",
    options: [
      "Texto lineal, sin tablas ni símbolos",
      "Listas numeradas simples",
      "Puedo recibir tablas",
    ],
  },
  {
    id: "visual",
    type: "choice",
    label: "¿Quieres que el asistente describa imágenes, gráficos y capturas?",
    options: ["Describe siempre imágenes y gráficos", "Solo si lo pido"],
  },
  {
    id: "tono",
    type: "choice",
    label: "¿Qué tono prefieres?",
    options: ["Cercano y amable", "Profesional y formal", "Neutro y directo"],
  },
  {
    id: "tareas",
    type: "multi",
    label: "¿Qué tareas quieres hacer con el asistente cada día?",
    hint: "Puedes elegir varias.",
    options: [
      "Correo",
      "Calendario y citas",
      "Documentos de Word, Excel o PDF",
      "Tickets e incidencias",
      "Reuniones de Teams",
      "Búsqueda de información",
      "Redactar mensajes",
    ],
  },
  {
    id: "confirmar",
    type: "choice",
    label: "¿Quieres que el asistente te pida confirmación antes de ejecutar acciones, como enviar un correo o borrar algo?",
    options: ["Sí", "No"],
  },
  {
    id: "otras",
    type: "longtext",
    label: "¿Alguna otra instrucción para el asistente? (opcional)",
  },
];

function Result({ doc, setDoc, answers, onEdit, onRestart }) {
  const headingRef = useFocusOnMount();
  const { notify } = useApp();

  useEffect(() => {
    notify("Documento generado. Revísalo y cópialo o descárgalo.", { speak: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const json = { app: "accesible-desk", tipo: "perfil-copilot", version: 1, answers };

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        Tu documento está listo
      </h2>
      <p>
        Revisa el texto, cámbialo si quieres y luego cópialo o descárgalo para pegarlo en Copilot.
      </p>

      <VoiceField
        id="doc-perfil"
        label="Instrucciones para el asistente (puedes editarlas)"
        value={doc}
        onChange={setDoc}
        multiline
        rows={16}
      />

      <ShareBar
        text={doc}
        filename="instrucciones-copilot"
        json={json}
        subject="Instrucciones para mi asistente de IA"
        extraCopy={{
          label: "Copiar como primer mensaje de chat",
          text: asFirstMessage(doc),
          message: "Copiado con la frase inicial para pegar en un chat normal.",
        }}
      />

      <h3>Cómo usarlo en Copilot</h3>
      <ol className="steps">
        <li>Copia el texto o descarga el archivo .txt.</li>
        <li>
          Si creas un agente (Agent Builder o Copilot Studio), pega el texto en el campo de
          instrucciones del agente.
        </li>
        <li>
          Si usas Copilot sin agente, usa «Copiar como primer mensaje de chat» y pégalo al
          empezar una conversación.
        </li>
        <li>
          Guarda el archivo .json: te permite volver a cargar tus respuestas aquí y cambiarlas
          sin empezar de cero.
        </li>
      </ol>

      <div className="wizard-nav">
        <button type="button" onClick={onEdit}>
          Cambiar mis respuestas
        </button>
        <button type="button" onClick={onRestart}>
          Empezar de nuevo
        </button>
      </div>
    </section>
  );
}

export default function PerfilCopilot() {
  const { notify } = useApp();
  const [answers, setAnswers] = useState(() => loadJSON(KEY, {}));
  const [phase, setPhase] = useState("form");
  const [doc, setDoc] = useState("");
  const [wizardKey, setWizardKey] = useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    saveJSON(KEY, answers);
  }, [answers]);

  const onAnswer = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));

  const finish = () => {
    setDoc(buildInstructions(answers));
    setPhase("result");
  };

  const restart = () => {
    if (window.confirm("¿Seguro que quieres borrar tus respuestas y empezar de nuevo?")) {
      setAnswers({});
      setWizardKey((k) => k + 1);
      setPhase("form");
      notify("Respuestas borradas. Empiezas desde la primera pregunta.");
    }
  };

  const loadFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data.answers !== "object") throw new Error("formato");
      setAnswers(data.answers);
      setWizardKey((k) => k + 1);
      setPhase("form");
      notify("Perfil cargado. Puedes revisar y cambiar tus respuestas.");
    } catch (err) {
      notify("El archivo no es un perfil válido de Accesible Desk.");
    }
    e.target.value = "";
  };

  return (
    <>
      <PageTitle>Perfil para Copilot</PageTitle>

      {phase === "form" && (
        <>
          <p className="lead">
            Contesta unas preguntas y la app creará un texto de instrucciones adaptado a ti.
            Puedes responder por voz o con el teclado.
          </p>
          <Wizard
            key={wizardKey}
            questions={QUESTIONS}
            answers={answers}
            onAnswer={onAnswer}
            onFinish={finish}
            finishLabel="Generar mis instrucciones"
          />
          <div className="load-box">
            <label htmlFor="perfil-file">Cargar un perfil guardado (.json)</label>
            <input
              id="perfil-file"
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={loadFile}
            />
          </div>
        </>
      )}

      {phase === "result" && (
        <Result
          doc={doc}
          setDoc={setDoc}
          answers={answers}
          onEdit={() => {
            setWizardKey((k) => k + 1);
            setPhase("form");
          }}
          onRestart={restart}
        />
      )}
    </>
  );
}
