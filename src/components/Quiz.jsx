import { useEffect, useState } from "react";
import { fetchCards } from "../lib/api.js";
import { shuffle, buildMC, buildOrder, isPureSeq, flatten, norm } from "../lib/quizLogic.js";

const BLANK = {
  screen: "loading", mode: null, mcCount: 12, scope: "all",
  cards: [], queue: [], idx: 0, correct: 0, done: 0, answered: false, pick: null, missed: [], order: null,
};

export default function Quiz() {
  const [s, setS] = useState(BLANK);
  const up = (patch) => setS((p) => ({ ...p, ...patch }));

  useEffect(() => {
    let on = true;
    fetchCards()
      .then((cards) => on && setS((st) => ({ ...st, cards, screen: "home" })))
      .catch(() => on && setS((st) => ({ ...st, screen: "home" })));
    return () => { on = false; };
  }, []);

  const scoped = () => (s.scope === "flows" ? s.cards.filter(isPureSeq) : s.cards);

  function orderSetup(item) {
    let pool = shuffle(item.correct);
    if (pool.join("|") === item.correct.join("|")) pool = shuffle(item.correct);
    return { picked: new Array(item.correct.length).fill(null), pool, checked: false, allCorrect: false };
  }
  function start(mode) {
    const sc = scoped();
    if (mode === "flash") {
      const queue = shuffle(sc);
      if (!queue.length) return alert("Select at least one phase.");
      up({ screen: "flash", mode, queue, idx: 0, correct: 0, done: 0, answered: false, pick: null, missed: [] });
    } else if (mode === "order") {
      const queue = buildOrder(sc);
      if (!queue.length) return alert("No multi-step flow phases available for this mode.");
      up({ screen: "order", mode, queue, idx: 0, correct: 0, done: 0, answered: false, missed: [], order: orderSetup(queue[0]) });
    } else {
      const queue = buildMC(sc, s.mcCount);
      if (!queue.length) return alert("Not enough cards to build questions.");
      up({ screen: "mc", mode, queue, idx: 0, correct: 0, done: 0, answered: false, pick: null, missed: [] });
    }
  }
  function next() {
    const idx = s.idx + 1;
    if (idx >= s.queue.length) return up({ screen: "results" });
    if (s.mode === "order") up({ idx, answered: false, order: orderSetup(s.queue[idx]) });
    else up({ idx, answered: false, pick: null });
  }
  const grade = (ok) => up({ correct: s.correct + (ok ? 1 : 0), done: s.done + 1, missed: ok ? s.missed : [...s.missed, s.queue[s.idx]], idx: s.idx + 1, answered: false, ...afterAdvance(s.idx + 1) });
  function afterAdvance(idx) {
    if (idx >= s.queue.length) return { screen: "results" };
    if (s.mode === "order") return { order: orderSetup(s.queue[idx]) };
    return { pick: null };
  }
  function answerMC(i) {
    if (s.answered) return;
    const ok = i === s.queue[s.idx].correct;
    up({ answered: true, pick: i, correct: s.correct + (ok ? 1 : 0), done: s.done + 1, missed: ok ? s.missed : [...s.missed, s.queue[s.idx]] });
  }
  function pickStep(t) {
    const o = s.order, slot = o.picked.indexOf(null);
    if (slot < 0) return;
    const picked = o.picked.slice(); picked[slot] = t;
    up({ order: { ...o, picked } });
  }
  function unpick(i) {
    const o = s.order; if (o.checked) return;
    const picked = o.picked.slice(); picked.splice(i, 1); picked.push(null);
    up({ order: { ...o, picked } });
  }
  function checkOrder() {
    const o = s.order, item = s.queue[s.idx];
    const allCorrect = item.correct.every((x, i) => o.picked[i] != null && norm(o.picked[i]) === norm(x));
    up({ order: { ...o, checked: true, allCorrect }, correct: s.correct + (allCorrect ? 1 : 0), done: s.done + 1 });
  }
  const retry = () => {
    const queue = shuffle(s.missed);
    up({ queue, idx: 0, correct: 0, done: 0, answered: false, pick: null, missed: [], order: s.mode === "order" ? orderSetup(queue[0]) : null });
  };
  const home = () => up({ screen: "home", mode: null });

  // keyboard
  useEffect(() => {
    const h = (e) => {
      if (s.screen === "flash") {
        if (e.code === "Space") { e.preventDefault(); if (!s.answered) up({ answered: true }); }
        else if (s.answered && (e.key === "1" || e.key === "2")) grade(e.key === "2");
      } else if (s.screen === "mc") {
        if (!s.answered && "1234".includes(e.key)) { const i = +e.key - 1; if (i < s.queue[s.idx].options.length) answerMC(i); }
        else if (s.answered && e.key === "Enter") next();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  if (s.screen === "loading") return <div className="stage"><p className="dim">Loading deck…</p></div>;

  const total = s.queue.length;
  const Progress = () => (
    <>
      <div className="bar"><div className="bar-fill" style={{ width: (total ? (s.idx / total) * 100 : 0) + "%" }} /></div>
      <div className="meta"><span>{Math.min(s.idx + 1, total)} / {total}</span><span className="score">Score {s.correct} / {s.done}</span></div>
    </>
  );

  if (s.screen === "home") return <Home s={s} up={up} start={start} />;
  if (s.screen === "results") {
    const pct = total ? Math.round((s.correct / total) * 100) : 0;
    const msg = pct >= 90 ? "Checkride-ready." : pct >= 70 ? "Solid — tighten the misses." : "Keep flowing it.";
    return (
      <div className="results">
        <div className="ring" style={{ "--p": pct }}><span>{pct}%</span></div>
        <h2>{s.correct} / {total} correct</h2><p className="dim">{msg}</p>
        <div className="res-btns">
          {s.missed.length > 0 && s.mode !== "order" && <button className="btn primary" onClick={retry}>Retry {s.missed.length} missed</button>}
          <button className="btn ghost" onClick={home}>Back to modes</button>
        </div>
      </div>
    );
  }

  const c = s.queue[s.idx];
  if (s.screen === "flash") return (
    <div className="stage"><Progress />
      <div className="flash">
        <div className="eyebrow">{c.eyebrow}</div><h2>{c.title}</h2><div className="sub">{c.subtitle}</div>
        {s.answered ? <StepsList steps={c.steps} /> : <button className="btn primary big" onClick={() => up({ answered: true })}>Reveal steps</button>}
      </div>
      {s.answered && (
        <div className="grade">
          <button className="btn bad" onClick={() => grade(false)}>Missed it</button>
          <button className="btn good" onClick={() => grade(true)}>Knew it</button>
        </div>
      )}
    </div>
  );

  if (s.screen === "mc") return (
    <div className="stage"><Progress />
      <div className="q-type">{c.type === "next" ? "Sequence" : c.type === "notbelong" ? "Odd one out" : "Recognition"}</div>
      <h2 className="q">{c.prompt}</h2>
      <div className="opts">
        {c.options.map((t, i) => {
          let cls = "opt";
          if (s.answered) { if (i === c.correct) cls += " correct"; else if (i === s.pick) cls += " wrong"; }
          return <button key={i} className={cls} disabled={s.answered} onClick={() => answerMC(i)}><span className="k">{i + 1}</span>{t}</button>;
        })}
      </div>
      {s.answered && (
        <>
          <div className={"note " + (s.pick === c.correct ? "ok" : "no")}>
            {s.pick === c.correct ? "✓ Correct. " : <>✗ Correct answer: <b>{c.options[c.correct]}</b>. </>}{c.note}
          </div>
          <button className="btn primary" onClick={next}>{s.idx + 1 < total ? "Next ▶" : "See results"}</button>
        </>
      )}
    </div>
  );

  // order
  const o = s.order, item = s.queue[s.idx];
  const allPlaced = o.picked.filter((x) => x != null).length === item.correct.length;
  return (
    <div className="stage order"><Progress />
      <div className="eyebrow">{item.eyebrow}</div><h2>{item.title}</h2>
      <p className="dim">Click the steps in the correct order.</p>
      <div className="order-grid">
        <div className="col"><div className="col-h">Your order</div>
          {item.correct.map((_, i) => {
            const sel = o.picked[i];
            const right = o.checked && sel != null && norm(sel) === norm(item.correct[i]);
            let cls = "slot" + (o.checked ? (right ? " ok" : " no") : "");
            return (
              <div key={i} className={cls} onClick={() => unpick(i)}>
                <span className="num">{i + 1}</span>
                {o.checked && !right
                  ? <div className="slot-body"><span className="was">{sel ?? "—"}</span><span className="fix">should be: {item.correct[i]}</span></div>
                  : <div className="slot-body">{sel ?? <span className="ph">—</span>}</div>}
              </div>
            );
          })}
        </div>
        <div className="col"><div className="col-h">Steps</div>
          <div className="poolwrap">
            {o.pool.filter((t) => !o.picked.includes(t)).map((t, i) => <button key={i} className="opt" onClick={() => pickStep(t)}>{t}</button>)}
            {o.pool.every((t) => o.picked.includes(t)) && <span className="dim">All placed</span>}
          </div>
        </div>
      </div>
      {o.checked
        ? <>
            <div className={"result-note " + (o.allCorrect ? "good" : "bad")}>{o.allCorrect ? "Perfect sequence!" : "Red rows show your slips — the correct step is noted."}</div>
            <button className="btn primary" onClick={next}>Next ▶</button>
          </>
        : <button className="btn primary" disabled={!allPlaced} onClick={checkOrder}>Check</button>}
    </div>
  );
}

function StepsList({ steps }) {
  return <ul className="steps">{flatten(steps).map((it, i) => <li key={i} className={it.level ? "sub" : "top"}>{it.text}</li>)}</ul>;
}

function Home({ s, up, start }) {
  return (
    <div className="home">
      <p className="lede">Test your recall of the SR20 question-mark flows. Pick a mode.</p>
      <div className="modes">
        <button className="mode" onClick={() => start("flash")}><div className="mi">🃏</div><h3>Flashcards</h3><p>See the phase, recall the steps, flip to check. Self-graded.</p></button>
        <button className="mode" onClick={() => start("order")}><div className="mi">↕</div><h3>Order the Flow</h3><p>Put the steps of a flow back in the right sequence.</p></button>
        <button className="mode" onClick={() => start("mc")}><div className="mi">✓</div><h3>Multiple Choice</h3><p>Auto-graded: what belongs, what doesn’t, what’s next.</p></button>
      </div>
      <div className="opts-row">
        <div className="mc-len">Questions (MC):
          {[8, 12, 20].map((v) => <button key={v} className={"pill" + (s.mcCount === v ? " on" : "")} onClick={() => up({ mcCount: v })}>{v}</button>)}
        </div>
        <div className="mc-len">Scope:
          <button className={"pill" + (s.scope === "all" ? " on" : "")} onClick={() => up({ scope: "all" })}>All</button>
          <button className={"pill" + (s.scope === "flows" ? " on" : "")} onClick={() => up({ scope: "flows" })}>Flows only</button>
        </div>
      </div>
      <p className="dim" style={{ fontSize: 13 }}>{s.cards.length} cards loaded.</p>
    </div>
  );
}
