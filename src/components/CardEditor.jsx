/* Editable form for a single card, shared by the full Editor and the in-quiz quick edit.
   `onChange(updater)` receives a fn (card) => card so callers stay immutable. */

export const mv = (arr, i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const a = arr.slice(); [a[i], a[j]] = [a[j], a[i]]; return a;
};

export function CardBody({ card, onChange }) {
  const setField = (f, v) => onChange((c) => ({ ...c, [f]: v }));
  const setSteps = (fn) => onChange((c) => ({ ...c, steps: fn((c.steps || []).slice()) }));
  return (
    <div className="cardp-b">
      <div className="row2">
        <div><span className="lbl">Eyebrow</span><input className="f" value={card.eyebrow || ""} onChange={(e) => setField("eyebrow", e.target.value)} /></div>
        <div><span className="lbl">Title</span><input className="f" value={card.title || ""} onChange={(e) => setField("title", e.target.value)} /></div>
      </div>
      <div><span className="lbl">Subtitle</span><input className="f" value={card.subtitle || ""} onChange={(e) => setField("subtitle", e.target.value)} /></div>
      <label className="chk"><input type="checkbox" checked={!!card.columns} onChange={(e) => setField("columns", e.target.checked)} /> Two-column back</label>
      <div className="steps-h">Steps</div>
      {(card.steps || []).map((st, si) => <StepRow key={si} st={st} si={si} setSteps={setSteps} />)}
      <div className="addrow"><button className="btn sm" onClick={() => setSteps((s) => [...s, ""])}>＋ Add step</button></div>
    </div>
  );
}

function StepRow({ st, si, setSteps }) {
  const isStr = typeof st === "string";
  const up = (fn) => setSteps((s) => { s[si] = fn(s[si]); return s; });
  const del = () => setSteps((s) => s.filter((_, i) => i !== si));
  const move = (dir) => setSteps((s) => mv(s, si, dir));
  if (isStr) return (
    <div className="step"><div className="step-main">
      <button className="iconbtn mini" onClick={() => move(-1)}>↑</button>
      <button className="iconbtn mini" onClick={() => move(1)}>↓</button>
      <input className="f grow" value={st} placeholder="Step text" onChange={(e) => up(() => e.target.value)} />
      <button className="iconbtn mini" title="Add sub-steps" onClick={() => up((v) => ({ text: String(v || ""), substeps: [""] }))}>＋ sub</button>
      <button className="iconbtn mini danger" onClick={del}>🗑</button>
    </div></div>
  );
  const setSub = (sj, v) => up((g) => ({ ...g, substeps: g.substeps.map((x, i) => (i === sj ? v : x)) }));
  const addSub = () => up((g) => ({ ...g, substeps: [...g.substeps, ""] }));
  const delSub = (sj) => up((g) => { const subs = g.substeps.filter((_, i) => i !== sj); return subs.length ? { ...g, substeps: subs } : (g.text || ""); });
  const moveSub = (sj, dir) => up((g) => ({ ...g, substeps: mv(g.substeps, sj, dir) }));
  return (
    <div className="step group"><div className="step-main">
      <button className="iconbtn mini" onClick={() => move(-1)}>↑</button>
      <button className="iconbtn mini" onClick={() => move(1)}>↓</button>
      <input className="f grow" value={st.text} placeholder="Heading (e.g. “IFR checks:”)" onChange={(e) => up((g) => ({ ...g, text: e.target.value }))} />
      <button className="iconbtn mini" title="Remove sub-steps" onClick={() => up((g) => g.text || "")}>－ sub</button>
      <button className="iconbtn mini danger" onClick={del}>🗑</button>
    </div>
      <div className="subs">
        {st.substeps.map((x, sj) => (
          <div className="sub" key={sj}>
            <button className="iconbtn mini" onClick={() => moveSub(sj, -1)}>↑</button>
            <button className="iconbtn mini" onClick={() => moveSub(sj, 1)}>↓</button>
            <input className="f grow" value={x} placeholder="Sub-step" onChange={(e) => setSub(sj, e.target.value)} />
            <button className="iconbtn mini danger" onClick={() => delSub(sj)}>🗑</button>
          </div>
        ))}
        <div className="addrow"><button className="btn sm" onClick={addSub}>＋ add sub-step</button></div>
      </div>
    </div>
  );
}
