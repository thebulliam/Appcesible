import PageTitle from "../components/PageTitle";
import { getRecognitionCtor } from "../hooks/useSpeechRecognition";
import { ttsSupported } from "../utils/speech";

const CARDS = [
  {
    id: "perfil",
    title: "Crear mi perfil para Copilot",
    text: "Responde unas preguntas (con voz o teclado) y descarga un texto con instrucciones para tu agente de Copilot u otra IA.",
  },
  {
    id: "tickets",
    title: "Documentar un ticket",
    text: "Asistente guiado para abrir y documentar incidencias de service desk: resumen, prioridad, pasos y solución.",
  },
  {
    id: "documento",
    title: "Dictar un documento",
    text: "Dicta cualquier texto, revísalo con lectura en voz alta y compártelo.",
  },
  {
    id: "ajustes",
    title: "Ajustes de accesibilidad",
    text: "Tamaño de letra, contraste, voz de la app, idioma y atajos.",
  },
];

export default function Inicio({ go }) {
  const hasDictation = Boolean(getRecognitionCtor());
  const hasVoice = ttsSupported();

  return (
    <>
      <PageTitle>Accesible Desk</PageTitle>
      <p className="lead">
        Una app para trabajar con la voz o con el teclado: crea instrucciones para tu
        asistente de IA, documenta tickets y comparte documentos sin depender del ratón.
      </p>

      <ul className="cards">
        {CARDS.map((c) => (
          <li key={c.id}>
            <button type="button" className="card" onClick={() => go(c.id)}>
              <strong>{c.title}</strong>
              <span>{c.text}</span>
            </button>
          </li>
        ))}
      </ul>

      {(!hasDictation || !hasVoice) && (
        <p className="notice" role="note">
          {!hasDictation &&
            "Este navegador no admite dictado por voz: usa Chrome o Edge para dictar. "}
          {!hasVoice && "Este navegador no tiene síntesis de voz. "}
          Todo lo demás funciona con teclado.
        </p>
      )}

      <h2>Antes de empezar</h2>
      <ul className="plain">
        <li>
          Si usas un lector de pantalla (JAWS, NVDA, Narrator), deja la opción «Uso lector
          de pantalla» en Ajustes para que la app no hable a la vez que tu lector.
        </li>
        <li>
          Si no usas lector, elige «Voz de la app» en Ajustes y la app leerá las preguntas
          en voz alta.
        </li>
        <li>
          Lo que escribes se guarda solo en este navegador. La app no envía tus textos a
          ningún servidor propio.
        </li>
        <li>
          El dictado de Chrome y Edge usa el servicio de voz del navegador, que puede
          procesar el audio en servidores externos. No dictes datos muy sensibles.
        </li>
      </ul>
    </>
  );
}
