import { useState } from "react";
import { useApp } from "./context/AppContext";
import Inicio from "./pages/Inicio";
import PerfilCopilot from "./pages/PerfilCopilot";
import TicketAssistant from "./pages/TicketAssistant";
import Documento from "./pages/Documento";
import Ajustes from "./pages/Ajustes";
import { cancelSpeech } from "./utils/speech";

const PAGES = [
  { id: "inicio", label: "Inicio" },
  { id: "perfil", label: "Perfil para Copilot" },
  { id: "tickets", label: "Tickets" },
  { id: "documento", label: "Dictar documento" },
  { id: "ajustes", label: "Ajustes" },
];

export default function App() {
  const { settings, status } = useApp();
  const [page, setPage] = useState("inicio");

  const go = (id) => {
    cancelSpeech();
    setPage(id);
  };

  let view;
  switch (page) {
    case "perfil":
      view = <PerfilCopilot />;
      break;
    case "tickets":
      view = <TicketAssistant />;
      break;
    case "documento":
      view = <Documento />;
      break;
    case "ajustes":
      view = <Ajustes />;
      break;
    default:
      view = <Inicio go={go} />;
  }

  return (
    <>
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <header className="app-header">
        <p className="brand">Accesible Desk</p>
        <nav aria-label="Principal">
          <ul>
            {PAGES.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => go(p.id)}
                  aria-current={page === p.id ? "page" : undefined}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="contenido" tabIndex={-1}>
        {view}
      </main>

      <div
        className="status-bar"
        aria-live={settings.voiceMode === "reader" ? "polite" : "off"}
        aria-atomic="true"
      >
        {status}
      </div>
    </>
  );
}
