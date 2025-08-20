import { useState } from "react";
import { Navbar, Footer, NoteBoard, CalendarWidget, NoteEditorModal } from "./components";

const App = () => {
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div className="container">
      <div className="card navbar" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,246,250,0.9))' }}>
        <Navbar onAdd={() => setEditorOpen(true)} />
      </div>
      <div className="layout" style={{ marginTop: 16 }}>
        <div>
          <NoteBoard onAdd={() => setEditorOpen(true)} />
        </div>
        <aside>
          <div className="card" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,244,248,0.92))' }}>
            <CalendarWidget />
          </div>
        </aside>
      </div>
      <div className="card footer" style={{ marginTop: 20, background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,244,248,0.9))' }}>
        <Footer />
      </div>
      {editorOpen && (
        <NoteEditorModal onClose={() => setEditorOpen(false)} />
      )}
    </div>
  )
}

export default App
