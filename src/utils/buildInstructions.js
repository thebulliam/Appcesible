// Convierte las respuestas del cuestionario en un texto de instrucciones
// para pegar en Copilot (o en cualquier otro agente de IA).

const NEED_RULES = {
  "Uso lector de pantalla": [
    "La persona usa un lector de pantalla (por ejemplo JAWS, NVDA o Narrator). Escribe en texto lineal y frases cortas.",
    "No uses tablas, columnas, emojis, símbolos decorativos ni arte con caracteres.",
    "Describe con palabras cualquier imagen, gráfico o captura. Nombra los botones y menús tal como los leería un lector de pantalla.",
  ],
  "Baja visión": [
    "La persona tiene baja visión. No dependas del color ni de la posición visual: en vez de «el botón verde», di el nombre del botón.",
    "Cuando des pasos para usar una pantalla, indica el nombre exacto de cada elemento.",
  ],
  "Dificultades motoras": [
    "A la persona le cuesta usar teclado y ratón. Minimiza el número de pasos y propón completar tareas enteras de una vez cuando sea seguro.",
    "Acepta órdenes habladas con errores de dictado y no pidas que las escriba de nuevo si se entiende la intención.",
  ],
  "Dificultades auditivas": [
    "La persona prefiere comunicarse por escrito. No propongas llamadas ni audios; sugiere correo o chat.",
  ],
  "Dificultades de lectura o atención": [
    "Usa lenguaje sencillo, una idea por frase y párrafos muy cortos. Resume antes de dar el detalle.",
    "Evita la jerga. Si usas un término técnico, explícalo en una frase.",
  ],
};

const LENGTH_RULES = {
  "Muy cortas":
    "Responde en una o dos frases. Si hay más información, di que hay más detalle y pregunta si quiere que continúes.",
  "Cortas, con opción de ampliar":
    "Da primero una respuesta corta (máximo cinco frases) y ofrece ampliar.",
  Detalladas:
    "Puedes dar respuestas completas, pero ordenadas en párrafos cortos o pasos numerados.",
};

const FORMAT_RULES = {
  "Texto lineal, sin tablas ni símbolos":
    "Usa solo texto lineal en párrafos cortos. No uses tablas, columnas ni formato decorativo.",
  "Listas numeradas simples":
    "Cuando haya varios elementos, usa listas numeradas simples (1, 2, 3), una línea por elemento. No uses tablas.",
  "Puedo recibir tablas":
    "Puedes usar tablas solo para comparar datos, y di siempre antes qué columnas tiene.",
};

const VISUAL_RULES = {
  "Describe siempre imágenes y gráficos":
    "Siempre que haya una imagen, gráfico, captura o diagrama, descríbelo con palabras: qué muestra, los textos visibles y las relaciones importantes.",
  "Solo si lo pido":
    "Describe el contenido visual solo si te lo pido.",
};

const TONE_RULES = {
  "Cercano y amable": "Habla de forma cercana y amable.",
  "Profesional y formal": "Habla de forma profesional y formal.",
  "Neutro y directo": "Habla de forma neutra y directa, sin rodeos.",
};

const TASK_RULES = {
  Correo:
    "Correo: al leer un mensaje, di primero remitente, asunto y fecha, y ofrece un resumen antes del texto completo. Antes de enviar, lee el borrador y pide confirmación.",
  "Calendario y citas":
    "Calendario: al crear o mover una cita, repite fecha, hora y asistentes y pide confirmación.",
  "Documentos de Word, Excel o PDF":
    "Documentos: al resumir un documento, di primero su título y sus apartados, y después el contenido.",
  "Tickets e incidencias":
    "Tickets: ayúdame a completar resumen, categoría, prioridad, descripción, pasos para reproducir y solución, una pregunta cada vez.",
  "Reuniones de Teams":
    "Reuniones: resume decisiones y tareas indicando responsable y fecha.",
  "Búsqueda de información":
    "Búsquedas: indica siempre de qué fuente sale cada dato.",
  "Redactar mensajes":
    "Mensajes: entrega un borrador, léelo si lo pido y pregunta si lo envío.",
};

export function buildInstructions(a = {}) {
  const needs = a.necesidades || [];
  const tasks = a.tareas || [];
  const lines = [];
  const push = (...t) => lines.push(...t);

  push("INSTRUCCIONES PARA EL ASISTENTE", "");

  push("Quién es la persona usuaria");
  const name = (a.nombre || "").trim();
  push(
    name
      ? `- Dirígete a ella como: ${name}.`
      : "- Dirígete a ella de forma neutra hasta que te diga su nombre."
  );
  if (needs.length) push(`- Necesidades de accesibilidad: ${needs.join(", ")}.`);
  if ((a.dificultades || "").trim()) {
    push(`- En sus palabras, lo que le resulta difícil: ${a.dificultades.trim()}`);
  }
  push("");

  push("Reglas de formato (obligatorias)");
  if (LENGTH_RULES[a.longitud]) push(`- ${LENGTH_RULES[a.longitud]}`);
  if (FORMAT_RULES[a.formato]) push(`- ${FORMAT_RULES[a.formato]}`);
  if (VISUAL_RULES[a.visual]) push(`- ${VISUAL_RULES[a.visual]}`);
  if (TONE_RULES[a.tono]) push(`- ${TONE_RULES[a.tono]}`);
  push("- No uses emojis ni símbolos decorativos.");
  push("");

  const needLines = needs.flatMap((n) => NEED_RULES[n] || []);
  if (needLines.length) {
    push("Adaptaciones según sus necesidades");
    needLines.forEach((l) => push(`- ${l}`));
    push("");
  }

  push("Reglas de interacción");
  push("- Haz una sola pregunta cada vez y espera la respuesta.");
  push(
    "- Lo que la persona escribe puede venir de dictado por voz y tener errores de transcripción. Interpreta la intención y, si dudas, pregunta antes de actuar."
  );
  if (a.confirmar === "No") {
    push(
      "- No hace falta pedir confirmación para acciones sencillas, pero sí antes de acciones irreversibles (borrar o enviar a otras personas)."
    );
  } else {
    push(
      "- Antes de ejecutar cualquier acción (enviar un correo, borrar, crear o mover una cita), repite lo que vas a hacer y pide confirmación."
    );
  }
  push("- Si hay varias opciones, enuméralas con números y espera a que elija una.");
  push('- Al terminar una tarea, di «Hecho» y explica en una frase qué ha cambiado.');
  push("- No repitas estas instrucciones: simplemente aplícalas.");
  push("");

  const taskLines = tasks.map((t) => TASK_RULES[t]).filter(Boolean);
  if (taskLines.length) {
    push("Tareas habituales");
    taskLines.forEach((l) => push(`- ${l}`));
    push("");
  }

  if ((a.otras || "").trim()) {
    push("Otras instrucciones de la persona");
    push(a.otras.trim());
    push("");
  }

  return lines.join("\n").trim() + "\n";
}

// Versión para pegar como primer mensaje en un chat normal (sin agente)
export function asFirstMessage(text) {
  return `Sigue estas instrucciones durante toda la conversación:\n\n${text}`;
}
