/* Mapping between Supabase rows and the app's card shape, plus step cleanup. Pure. */

export function rowToCard(r) {
  return {
    id: r.id,
    eyebrow: r.eyebrow || "",
    title: r.title || "",
    subtitle: r.subtitle || "",
    columns: !!r.two_col,
    steps: Array.isArray(r.steps) ? r.steps : [],
  };
}

export function cleanStep(s) {
  if (typeof s === "string") { const t = s.trim(); return t ? t : null; }
  const text = (s.text || "").trim();
  const subs = (s.substeps || []).map(x => (x || "").trim()).filter(Boolean);
  if (!text && !subs.length) return null;
  return subs.length ? { text, substeps: subs } : text;
}
export const cleanSteps = steps => (steps || []).map(cleanStep).filter(x => x != null);

export function cardToRow(c, position) {
  return {
    position,
    eyebrow: (c.eyebrow || "").trim(),
    title: (c.title || "").trim(),
    subtitle: (c.subtitle || "").trim(),
    two_col: !!c.columns,
    steps: cleanSteps(c.steps),
  };
}
