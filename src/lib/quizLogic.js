/* Pure quiz logic for the SR20 Flow Trainer. No DOM, no React — unit-testable. */

export function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
export const isFlow = c => !/reference/i.test(c.eyebrow || "");
export const seqSteps = c => (c.steps || []).map(s => (typeof s === "string" ? s : s.text));
export const isPureSeq = c =>
  isFlow(c) && Array.isArray(c.steps) && c.steps.every(s => typeof s === "string") && c.steps.length >= 3;

export function leafItems(c) {
  const out = [];
  (c.steps || []).forEach(s => {
    if (typeof s === "string") out.push(s);
    else (s.substeps || []).forEach(x => out.push(x));
  });
  return out;
}
export function flatten(steps) {
  const out = [];
  (steps || []).forEach(s => {
    if (typeof s === "string") out.push({ level: 0, text: s });
    else {
      out.push({ level: 0, text: s.text });
      (s.substeps || []).forEach(x => out.push({ level: 1, text: x }));
    }
  });
  return out;
}

function poolFrom(cards) {
  const pool = [];
  cards.forEach((c, ci) => leafItems(c).forEach(t => pool.push({ text: t, ci })));
  return pool;
}
function qBelongs(cards, pool) {
  const ci = Math.floor(Math.random() * cards.length), c = cards[ci];
  const items = leafItems(c); if (!items.length) return null;
  const correct = items[Math.floor(Math.random() * items.length)];
  const own = new Set(items.map(norm)); const distr = [];
  for (let g = 0; g < 300 && distr.length < 3; g++) {
    const p = pool[Math.floor(Math.random() * pool.length)];
    if (p.ci === ci || own.has(norm(p.text)) || distr.some(d => norm(d) === norm(p.text))) continue;
    distr.push(p.text);
  }
  if (distr.length < 3) return null;
  const options = shuffle([correct, ...distr]);
  return { type: "belongs", prompt: `Which step belongs to the “${c.title}” flow?`,
    options, correct: options.indexOf(correct), note: `“${correct}” is part of ${c.title}.`, key: "b" + ci + norm(correct) };
}
function qNotBelong(cards, pool) {
  const cands = cards.map((c, ci) => ({ c, ci })).filter(o => leafItems(o.c).length >= 3);
  if (!cands.length) return null;
  const { c, ci } = cands[Math.floor(Math.random() * cands.length)];
  const items = shuffle(leafItems(c)).slice(0, 3);
  const own = new Set(leafItems(c).map(norm));
  let distr = null;
  for (let g = 0; g < 300 && !distr; g++) {
    const p = pool[Math.floor(Math.random() * pool.length)];
    if (p.ci === ci || own.has(norm(p.text))) continue;
    distr = p.text;
  }
  if (!distr) return null;
  const options = shuffle([...items, distr]);
  return { type: "notbelong", prompt: `Which step is NOT part of “${c.title}”?`,
    options, correct: options.indexOf(distr), note: `“${distr}” is not in ${c.title}.`, key: "n" + ci + norm(distr) };
}
function qNext(seqCards, pool) {
  if (!seqCards.length) return null;
  const { c, ci } = seqCards[Math.floor(Math.random() * seqCards.length)];
  const s = seqSteps(c), i = Math.floor(Math.random() * (s.length - 1));
  const correct = s[i + 1];
  const own = new Set(s.map(norm));
  let distr = shuffle(s.filter((x, k) => k !== i && k !== i + 1)).slice(0, 3);
  for (let g = 0; g < 200 && distr.length < 3; g++) {
    const p = pool[Math.floor(Math.random() * pool.length)];
    if (own.has(norm(p.text)) || distr.some(d => norm(d) === norm(p.text))) continue;
    distr.push(p.text);
  }
  const options = shuffle([correct, ...distr].slice(0, 4));
  if (options.indexOf(correct) < 0) options[0] = correct;
  return { type: "next", prompt: `In “${c.title}”, what comes right after “${s[i]}”?`,
    options, correct: options.indexOf(correct), note: `Order: ${s.join("  →  ")}`, key: "x" + ci + i };
}
export function buildMC(cards, n) {
  const pool = poolFrom(cards);
  const seqCards = cards.map((c, ci) => ({ c, ci })).filter(o => isPureSeq(o.c));
  const qs = [];
  for (let g = 0; g < n * 50 && qs.length < n; g++) {
    const r = Math.random();
    const q = r < 0.34 ? qBelongs(cards, pool) : r < 0.67 ? qNotBelong(cards, pool) : (qNext(seqCards, pool) || qBelongs(cards, pool));
    if (q && !qs.some(e => e.key === q.key)) qs.push(q);
  }
  return qs;
}
export function buildOrder(cards) {
  return shuffle(cards.filter(isPureSeq)).map(c => ({
    title: c.title, eyebrow: c.eyebrow, subtitle: c.subtitle, correct: seqSteps(c)
  }));
}
