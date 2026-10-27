import { useEffect, useState } from "react";
import PageTitle from "../components/PageTitle";
import Wizard from "../components/Wizard";
import ShareBar from "../components/ShareBar";
import VoiceField from "../components/VoiceField";
import useFocusOnMount from "../hooks/useFocusOnMount";
import { useApp } from "../context/AppContext";
import { buildTicket } from "../utils/buildTicket";
import { formatDate, stamp } from "../utils/download";
import { loadJSON, saveJSON } from "../utils/storage";

const KEY = "ad.tickets";
const MAX_TICKETS = 50;

const QUESTIONS = [
  {
    id: "tipo",
    type: "choice",
    label: "¿Qué tipo de ticket es?",
    options: ["Incidencia", "Petición de servicio", "Consulta", "Cambio"],
  },
  {
    id: "resumen",
    type: "text",
    label: "Resume el problema o la petición en una frase.",
    required: true,
  },
  { id: "solicitante", type: "text", label: "¿Quién es la persona solicitante?" },
  {
    id: "contacto",
    type: "text",
    label: "¿Cómo se la puede contactar? Correo o teléfono.",
  },
  {
    id: "categoria",
    type: "choice",
    label: "¿Qué categoría tiene?",
    options: [
      "Hardware",
      "Software",
      "Red y conectividad",
      "Cuentas y accesos",
      "Correo",
      "Impresión",
      "Otra",
    ],
  },
  {
    id: "prioridad",
    type: "choice",
    label: "¿Qué prioridad tiene?",
    options: ["Baja", "Media", "Alta", "Crítica"],
  },
  {
    id: "impacto",
    type: "choice",
    label: "¿A cuántas personas afecta?",
    options: ["Una persona", "Varias personas", "Un departamento entero", "Toda la organización"],
  },
  {
    id: "descripcion",
    type: "longtext",
    label: "Describe el problema con detalle.",
    required: true,
  },
  {
    id: "pasos",
    type: "longtext",
    label: "¿Qué pasos hay que seguir para reproducir el problema? (opcional)",
  },
  {
    id: "intentado",
    type: "longtext",
    label: "¿Qué se ha intentado ya para resolverlo? (opcional)",
  },
  {
    id: "solucion",
    type: "longtext",
    label: "¿Cuál es la solución o qué acciones se han realizado? (opcional)",
  },
  {
    id: "estado",
    type: "choice",
    label: "¿En qué estado está el ticket?",
    options: ["Abierto", "En curso", "Pendiente de la persona usuaria", "Resuelto", "Cerrado"],
  },
  { id: "notas", type: "longtext", label: "¿Alguna nota adicional? (opcional)" },
];

function Result({ ticket, setText, onSaveText, onEdit, onNew, onBack }) {
  const headingRef = useFocusOnMount();
  const { notify } = useApp();

  useEffect(() => {
    notify(`Ticket ${ticket.id} generado.`, { speak: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const json = { app: "accesible-desk", tipo: "ticket", version: 1, ...ticket };

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        Ticket {ticket.id}
      </h2>
      <p>
        Revisa el documento, edítalo si hace falta y cópialo a tu herramienta de tickets o
        compártelo.
      </p>

      <VoiceField
        id="doc-ticket"
        label="Documento del ticket (puedes editarlo)"
        value={ticket.text}
        onChange={setText}
        multiline
        rows={18}
      />

      <ShareBar
        text={ticket.text}
        filename={`ticket-${ticket.id.toLowerCase()}`}
        json={json}
        subject={`Ticket ${ticket.id}`}
      />

      <div className="wizard-nav">
        <button type="button" onClick={onSaveText}>
          Guardar cambios en el historial
        </button>
        <button type="button" onClick={onEdit}>
          Cambiar respuestas
        </button>
        <button type="button" onClick={onNew}>
          Ticket nuevo
        </button>
        <button type="button" onClick={onBack}>
          Ver historial
        </button>
      </div>
    </section>
  );
}

export default function TicketAssistant() {
  const { notify } = useApp();
  const [tickets, setTickets] = useState(() => loadJSON(KEY, []));
  const [phase, setPhase] = useState("menu"); // menu | form | result
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(null); // { id, createdAt, answers, text }
  const [wizardKey, setWizardKey] = useState(0);

  useEffect(() => {
    saveJSON(KEY, tickets);
  }, [tickets]);

  const onAnswer = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));

  const startNew = () => {
    setAnswers({});
    setCurrent(null);
    setWizardKey((k) => k + 1);
    setPhase("form");
  };

  const finish = () => {
    const now = new Date();
    const id = current ? current.id : `TCK-${stamp(now)}`;
    const createdAt = current ? current.createdAt : now.toISOString();
    const text = buildTicket(answers, { id, createdAt });
    const ticket = { id, createdAt, answers, text };
    setCurrent(ticket);
    setTickets((list) => [ticket, ...list.filter((t) => t.id !== id)].slice(0, MAX_TICKETS));
    setPhase("result");
  };

  const setText = (text) => setCurrent((c) => ({ ...c, text }));

  const saveText = () => {
    setTickets((list) => list.map((t) => (t.id === current.id ? { ...t, text: current.text } : t)));
    notify("Cambios guardados en el historial.");
  };

  const open = (t) => {
    setCurrent(t);
    setAnswers(t.answers || {});
    setPhase("result");
  };

  const remove = (t) => {
    if (window.confirm(`¿Eliminar el ticket ${t.id}?`)) {
      setTickets((list) => list.filter((x) => x.id !== t.id));
      notify(`Ticket ${t.id} eliminado.`);
    }
  };

  return (
    <>
      <PageTitle>Asistente de tickets</PageTitle>

      {phase === "menu" && (
        <>
          <p className="lead">
            Crea la documentación de un ticket de service desk contestando preguntas. Al final
            obtienes un texto listo para pegar en tu herramienta de tickets.
          </p>
          <button type="button" className="primary big" onClick={startNew}>
            Crear ticket nuevo
          </button>

          <h2>Historial en este navegador ({tickets.length})</h2>
          {tickets.length === 0 ? (
            <p>Todavía no hay tickets guardados.</p>
          ) : (
            <ul className="history">
              {tickets.map((t) => (
                <li key={t.id}>
                  <span>
                    <strong>{t.id}</strong> · {formatDate(new Date(t.createdAt))} ·{" "}
                    {(t.answers && t.answers.resumen) || "Sin resumen"}
                  </span>
                  <span className="row-actions">
                    <button type="button" onClick={() => open(t)}>
                      Abrir<span className="sr-only"> {t.id}</span>
                    </button>
                    <button type="button" onClick={() => remove(t)}>
                      Eliminar<span className="sr-only"> {t.id}</span>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {phase === "form" && (
        <Wizard
          key={wizardKey}
          questions={QUESTIONS}
          answers={answers}
          onAnswer={onAnswer}
          onFinish={finish}
          finishLabel="Generar ticket"
        />
      )}

      {phase === "result" && current && (
        <Result
          ticket={current}
          setText={setText}
          onSaveText={saveText}
          onEdit={() => {
            setWizardKey((k) => k + 1);
            setPhase("form");
          }}
          onNew={startNew}
          onBack={() => setPhase("menu")}
        />
      )}
    </>
  );
}
