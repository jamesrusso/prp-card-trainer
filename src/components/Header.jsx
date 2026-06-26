import logo from "../assets/logo.png";

export default function Header({ view, setView, session, onSignOut }) {
  return (
    <header className="hdr">
      <img className="logo" src={logo} alt="PRP Aviation" />
      <div className="hd-txt">
        <div className="hd-eyebrow">PRP AVIATION · SR20 CIRRUS</div>
        <div className="hd-title">Flow Trainer</div>
      </div>
      <nav className="nav">
        <button className={"pill" + (view === "quiz" ? " on" : "")} onClick={() => setView("quiz")}>Quiz</button>
        <button className={"pill" + (view === "editor" ? " on" : "")} onClick={() => setView("editor")}>Editor</button>
        {session && <button className="pill" onClick={onSignOut}>Sign out</button>}
      </nav>
    </header>
  );
}
