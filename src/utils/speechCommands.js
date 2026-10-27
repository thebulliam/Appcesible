// Quita acentos, signos y mayúsculas para comparar frases dictadas
export function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NUM = {
  uno: 1, una: 1, primero: 1, primera: 1, 1: 1,
  dos: 2, segundo: 2, segunda: 2, 2: 2,
  tres: 3, tercero: 3, tercera: 3, 3: 3,
  cuatro: 4, cuarto: 4, cuarta: 4, 4: 4,
  cinco: 5, quinto: 5, quinta: 5, 5: 5,
  seis: 6, sexto: 6, sexta: 6, 6: 6,
  siete: 7, septimo: 7, septima: 7, 7: 7,
  ocho: 8, octavo: 8, octava: 8, 8: 8,
  nueve: 9, noveno: 9, novena: 9, 9: 9,
  diez: 10, decimo: 10, decima: 10, 10: 10,
};

// Devuelve los índices de las opciones que coinciden con lo dictado
export function matchOptions(text, options, multi) {
  const tokens = normalize(text).split(" ").filter(Boolean);

  const byNumber = [];
  tokens.forEach((tok) => {
    const n = NUM[tok];
    if (n && n <= options.length && !byNumber.includes(n - 1)) byNumber.push(n - 1);
  });
  if (byNumber.length) return multi ? byNumber : [byNumber[0]];

  const tokenSet = new Set(tokens);
  const scored = options.map((opt, i) => {
    const words = normalize(opt).split(" ").filter(Boolean);
    const significant = words.filter((w) => w.length > 3);
    const use = significant.length ? significant : words;
    const hits = use.filter((w) => tokenSet.has(w)).length;
    return { i, score: use.length ? hits / use.length : 0 };
  });

  if (multi) return scored.filter((s) => s.score >= 0.5).map((s) => s.i);
  const best = [...scored].sort((a, b) => b.score - a.score)[0];
  return best && best.score >= 0.4 ? [best.i] : [];
}

export function capitalizeStart(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

// Opcional: convierte "coma", "punto", "nueva línea"... en signos
export function applySpokenPunctuation(text) {
  return text
    .replace(/\s*\b(punto y aparte)\b\s*/gi, ".\n")
    .replace(/\s*\b(nueva l[ií]nea|salto de l[ií]nea)\b\s*/gi, "\n")
    .replace(/\s*\b(punto y coma)\b\s*/gi, "; ")
    .replace(/\s*\b(dos puntos)\b\s*/gi, ": ")
    .replace(/\s*\bcoma\b\s*/gi, ", ")
    .replace(/\s*\bpunto\b\s*/gi, ". ")
    .replace(/\s+$/g, "");
}
