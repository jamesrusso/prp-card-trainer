import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Quiz from "./components/Quiz.jsx";
import Editor from "./components/Editor.jsx";
import { getSession, onAuthChange, signOut } from "./lib/api.js";
import { hasSupabase } from "./supabaseClient.js";

export default function App() {
  const [view, setView] = useState("quiz");
  const [session, setSession] = useState(null);

  useEffect(() => {
    getSession().then(setSession);
    return onAuthChange(setSession);
  }, []);

  const handleSignOut = async () => { await signOut(); setSession(null); setView("quiz"); };

  return (
    <div className="wrap">
      <Header view={view} setView={setView} session={session} onSignOut={handleSignOut} />
      {!hasSupabase && view === "quiz" && (
        <div className="note">Running on the bundled deck. Add your Supabase keys (see README) to go live and enable editing.</div>
      )}
      {view === "quiz" ? <Quiz /> : <Editor session={session} />}
      <footer className="ft">PRP Aviation · Personal · Reliable · Professional</footer>
    </div>
  );
}
