import { useEffect, useState } from "react";
import { fetchCards, isEditor, sendMagicLink, saveDeck } from "../lib/api.js";
import { hasSupabase } from "../supabaseClient.js";
import { CardBody, mv } from "./CardEditor.jsx";

let _k = 0;
const key = () => "k" + (++_k);
const withKeys = (cards) => cards.map((c) => ({ ...c, _k: key() }));

export default function Editor({ session }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState("idle"); // idle|checking|allowed|denied
  const [deck, setDeck] = useState(null);
  const [removed, setRemoved] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!session) { setStatus("idle"); setDeck(null); return; }
    setStatus("checking");
    isEditor().then((ok) => {
      setStatus(ok ? "allowed" : "denied");
      if (ok) fetchCards().then((c) => setDeck(withKeys(c))).catch((e) => setMsg(String(e.message || e)));
    });
  }, [session]);

  if (!hasSupabase)
    return <Note>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> (see README), then reload to edit online.</Note>;

  if (!session) {
    return (
      <div className="panel narrow">
        <h2>Editor sign-in</h2>
        <p className="dim">Enter your email; we’ll send a one-time login link. Only allow-listed editors can sign in.</p>
        {sent ? <Note>Check your inbox for the magic link, then come back here.</Note> : (
          <form onSubmit={async (e) => { e.preventDefault(); try { await sendMagicLink(email.trim()); setSent(true); } catch (err) { setMsg(String(err.message || err)); } }}>
            <input className="f" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn primary" style={{ marginTop: 10 }}>Send magic link</button>
          </form>
        )}
        {msg && <Note bad>{msg}</Note>}
      </div>
    );
  }
  if (status === "checking") return <Note>Checking access…</Note>;
  if (status === "denied")
    return <Note bad>This account isn’t on the editors allow-list. Ask an admin to add your email, or sign in with an allowed address.</Note>;
  if (!deck) return <Note>Loading deck… {msg}</Note>;

  // ---- editing helpers (immutable) ----
  const setCard = (ci, fn) => setDeck((d) => d.map((c, i) => (i === ci ? fn({ ...c }) : c)));
  const setField = (ci, f, v) => setCard(ci, (c) => ({ ...c, [f]: v }));

  const addCard = () => setDeck((d) => [...d, { _k: key(), eyebrow: "New", title: "New Card", subtitle: "", steps: [""], _open: true }]);
  const delCard = (ci) => { const c = deck[ci]; if (!confirm(`Delete “${c.title || "card"}”?`)) return; if (c.id) setRemoved((r) => [...r, c.id]); setDeck((d) => d.filter((_, i) => i !== ci)); };
  const dupCard = (ci) => setDeck((d) => { const c = { ...JSON.parse(JSON.stringify(d[ci])), id: undefined, _k: key(), title: (d[ci].title || "") + " (copy)", _open: true }; const n = d.slice(); n.splice(ci + 1, 0, c); return n; });
  const moveCard = (ci, dir) => setDeck((d) => mv(d, ci, dir));

  async function save() {
    setBusy(true); setMsg("");
    try {
      const fresh = await saveDeck(deck, removed);
      setDeck(withKeys(fresh)); setRemoved([]); setMsg("Saved. The live quiz now shows your changes.");
    } catch (e) { setMsg("Save failed: " + (e.message || e)); }
    setBusy(false);
  }

  return (
    <div>
      <div className="toolbar">
        <button className="btn primary sm" onClick={addCard}>+ Add card</button>
        <button className="btn sm" onClick={() => setDeck((d) => d.map((c) => ({ ...c, _open: true })))}>Expand all</button>
        <button className="btn sm" onClick={() => setDeck((d) => d.map((c) => ({ ...c, _open: false })))}>Collapse all</button>
        <span className="spacer" />
        <button className="btn good" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save to cloud"}</button>
      </div>
      {msg && <Note bad={/fail/i.test(msg)}>{msg}</Note>}

      {deck.map((c, ci) => (
        <div className="cardp" key={c._k}>
          <div className="cardp-h">
            <span className="idx">{ci + 1}</span>
            <div className="sum" onClick={() => setField(ci, "_open", !c._open)}>
              <div className="eyb">{c.eyebrow || " "}</div>
              <div className="ttl">{c.title || "(untitled)"}</div>
            </div>
            <button className="iconbtn" onClick={() => moveCard(ci, -1)}>↑</button>
            <button className="iconbtn" onClick={() => moveCard(ci, 1)}>↓</button>
            <button className="iconbtn" onClick={() => dupCard(ci)}>⧉</button>
            <button className="iconbtn danger" onClick={() => delCard(ci)}>🗑</button>
            <button className="iconbtn" onClick={() => setField(ci, "_open", !c._open)}>{c._open ? "▲" : "▼"}</button>
          </div>
          {c._open && <CardBody card={c} onChange={(fn) => setCard(ci, fn)} />}
        </div>
      ))}
      <div className="addrow" style={{ marginTop: 8 }}><button className="btn sm" onClick={addCard}>+ Add card</button></div>
    </div>
  );
}

function Note({ children, bad }) {
  return <div className="note" style={bad ? { borderLeftColor: "var(--bad)" } : null}>{children}</div>;
}
