import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Wrench, Music2, LifeBuoy } from "lucide-react";
import { API } from "../lib/api";

const MODES = [
  { id: "support", label: "Support", icon: LifeBuoy, hint: "Ask about the apps, orders, gear or setup." },
  { id: "gear", label: "Gear finder", icon: Wrench, hint: "Tell me your style and budget — I'll pick your rig." },
  { id: "riff", label: "Riff helper", icon: Music2, hint: "Riff ideas, chord progressions, lyrics, practice plans." },
];

const sessionKey = "gl_ai_session";
const getSession = () => {
  let s = localStorage.getItem(sessionKey);
  if (!s) {
    s = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(sessionKey, s);
  }
  return s;
};

export default function AskGroovLabz() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("support");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open || loaded) return;
    fetch(`${API}/ai/history/${getSession()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((h) => setMessages(h.map((m) => ({ role: m.role, content: m.content }))))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [open, loaded]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: getSession(), message: text, mode }),
      });
      if (!res.ok || !res.body) throw new Error("bad response");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line || line === "[DONE]") continue;
          const evt = JSON.parse(line);
          const chunk = evt.delta ?? evt.error ?? "";
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
            return copy;
          });
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "The assistant is unavailable right now. Please try again in a moment." };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  const current = MODES.find((m) => m.id === mode);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 h-14 px-5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold inline-flex items-center gap-2 glow-cyan shadow-xl transition-transform hover:-translate-y-0.5"
        aria-label="Ask GroovLabz"
        data-testid="ai-chat-toggle"
      >
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask GroovLabz"}</span>
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[min(420px,calc(100vw-2.5rem))] h-[min(600px,calc(100vh-8rem))] glass rounded-2xl border border-cyan-500/30 flex flex-col overflow-hidden shadow-2xl" data-testid="ai-chat-panel">
          <div className="px-4 pt-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-cyan-300" />
              <p className="display font-extrabold">Ask GroovLabz</p>
              <span className="ml-auto mono text-[9px] uppercase tracking-widest text-slate-500">GPT‑5.4 mini</span>
            </div>
            <div className="flex gap-1.5" role="tablist">
              {MODES.map((m) => {
                const I = m.icon;
                return (
                  <button
                    key={m.id}
                    role="tab"
                    aria-selected={mode === m.id}
                    onClick={() => setMode(m.id)}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full mono text-[10px] uppercase tracking-widest border transition-colors ${
                      mode === m.id ? "bg-cyan-400 text-slate-950 border-cyan-400" : "border-slate-700 text-slate-300 hover:border-cyan-400/60"
                    }`}
                    data-testid={`ai-mode-${m.id}`}
                  >
                    <I className="w-3 h-3" /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" data-testid="ai-messages">
            {messages.length === 0 && (
              <div className="text-sm text-slate-400 leading-relaxed" data-testid="ai-empty-hint">
                <p className="text-slate-200 font-semibold mb-1">{current.label}</p>
                <p>{current.hint}</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "bg-cyan-400 text-slate-950 rounded-br-md" : "bg-slate-900/80 border border-slate-800 text-slate-200 rounded-bl-md"
                  }`}
                  data-testid={`ai-message-${m.role}`}
                >
                  {m.content || (busy && i === messages.length - 1 ? <span className="inline-block w-2 h-4 bg-cyan-300 animate-pulse rounded-sm" /> : "")}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={send} className="p-3 border-t border-slate-800 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={busy ? "Thinking…" : `Ask ${current.label.toLowerCase()}…`}
              disabled={busy}
              className="flex-1 h-11 px-4 rounded-full bg-slate-900/60 border border-slate-700 focus:border-cyan-400 focus:outline-none text-sm text-slate-100"
              data-testid="ai-chat-input"
            />
            <button type="submit" disabled={busy || !input.trim()} className="w-11 h-11 rounded-full bg-cyan-400 text-slate-950 inline-flex items-center justify-center disabled:opacity-40" aria-label="Send" data-testid="ai-chat-send">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
