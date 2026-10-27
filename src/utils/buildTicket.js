import { formatDate } from "./download";

const clean = (v) => (v && String(v).trim() ? String(v).trim() : "No indicado");

export function buildTicket(a = {}, meta = {}) {
  const created = meta.createdAt ? new Date(meta.createdAt) : new Date();
  const lines = [
    `TICKET ${meta.id || "SIN-ID"}`,
    `Fecha de creación: ${formatDate(created)}`,
    `Tipo: ${clean(a.tipo)}`,
    `Estado: ${clean(a.estado)}`,
    `Prioridad: ${clean(a.prioridad)}`,
    `Categoría: ${clean(a.categoria)}`,
    `Impacto: ${clean(a.impacto)}`,
    "",
    "RESUMEN",
    clean(a.resumen),
    "",
    "SOLICITANTE",
    `Nombre: ${clean(a.solicitante)}`,
    `Contacto: ${clean(a.contacto)}`,
    "",
    "DESCRIPCIÓN DEL PROBLEMA",
    clean(a.descripcion),
    "",
    "PASOS PARA REPRODUCIRLO",
    clean(a.pasos),
    "",
    "ACCIONES YA INTENTADAS",
    clean(a.intentado),
    "",
    "SOLUCIÓN O ACCIONES REALIZADAS",
    clean(a.solucion),
    "",
    "NOTAS",
    clean(a.notas),
  ];
  return lines.join("\n") + "\n";
}
