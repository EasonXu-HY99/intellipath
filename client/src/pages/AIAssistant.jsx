import { useEffect, useRef, useState } from "react";
import { Bot, Send, Plus, FileText } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useApi } from "../hooks.js";
import { GlassCard, SectionTitle, fieldCls } from "../components/ui.jsx";
import SiteMap from "../components/SiteMap.jsx";

const QUICK = [
  "Summarize incidents and prioritize remediation",
  "Find high severity alerts",
  "Show maintenance procedures for Pioneer Yard",
  "Explain my cybersecurity clearance",
];
const WELCOME = {
  role: "assistant",
  text: "Ask about incidents, alerts, remediation, documents, people or devices. Answers use records within your clearance. You can ask follow-up questions.",
};
export default function AIAssistant() {
  const { user } = useAuth(),
    status = useApi(api.aiStatus);
  const [messages, setMessages] = useState([WELCOME]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [conversationId, setConversationId] = useState(null);
  const list = useRef(null);
  useEffect(() => {
    localStorage.removeItem("intellipath.chat.v1");
  }, []);
  useEffect(() => {
    list.current?.scrollTo({
      top: list.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);
  async function ask(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const r = await api.askAI(q, conversationId);
      setConversationId(r.conversationId);
      setMessages((m) => [...m, { role: "assistant", text: r.reply, ...r }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: e.message, error: true },
      ]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <SectionTitle
        title="AI Assistant"
        subtitle="Investigate with evidence. Prioritize the next action. Keep every answer within your clearance."
        icon={Bot}
      />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_250px] gap-5">
        <GlassCard className="flex flex-col min-w-0 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center gap-3">
            <div>
              <h2 className="font-semibold">IntelliPath AI</h2>
              <p className="text-xs text-cyan-700">
                {status.data?.provider === "groq"
                  ? "Groq · grounded answers"
                  : "Local retrieval"}{" "}
                · L1–L{user.cyber_level}
              </p>
            </div>
            <button
              disabled={busy}
              className="small-button"
              onClick={() => {
                setMessages([WELCOME]);
                setConversationId(null);
              }}
            >
              <Plus size={14} /> New chat
            </button>
          </div>
          <div
            ref={list}
            className="chat-scroll p-4 sm:p-6 space-y-5"
            aria-live="polite"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : ""}`}
              >
                <div
                  className={`chat-bubble ${m.role === "user" ? "user-bubble" : ""} ${m.error ? "text-rose-700" : ""}`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  {m.notice && (
                    <p className="text-xs text-slate-600 mt-3 border-t border-slate-200 pt-2">
                      {m.provider === "groq" ? "Groq" : "Local"} ·{" "}
                      {m.notice}
                    </p>
                  )}
                  {m.sources?.length > 0 && (
                    <details className="text-xs mt-3">
                      <summary className="cursor-pointer text-cyan-700">
                        {m.sources.length} supporting records
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {m.sources.map((s) => (
                          <li key={s.id}>
                            <FileText size={12} className="inline mr-1" />
                            {s.id} · {s.title}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <p className="text-sm text-cyan-700 animate-pulse">
                Reviewing authorized evidence…
              </p>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
            className="p-4 border-t border-slate-200"
          >
            <div className="flex gap-2 items-end">
              <textarea
                aria-label="Ask AI"
                maxLength={4000}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask();
                  }
                }}
                rows={2}
                className={`${fieldCls} resize-none`}
                placeholder="What should we investigate first?"
              />
              <button
                aria-label="Send question"
                disabled={busy || !input.trim()}
                className="p-3 rounded-xl brand-fill disabled:opacity-40"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Enter to send · Shift+Enter for a new line · Advice requires human
              review
            </p>
          </form>
        </GlassCard>
        <GlassCard className="p-5 self-start">
          <h2 className="font-semibold mb-4">Start an investigation</h2>
          <div className="space-y-3">
            {QUICK.map((q) => (
              <button
                key={q}
                disabled={busy}
                onClick={() => ask(q)}
                className="site-button"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="mt-5 text-xs text-slate-600 leading-relaxed">
            Conversation context stays in this session and expires after
            inactivity. Sensitive chat history is not saved in browser storage.
            Demo records describe simulated events.
          </div>
        </GlassCard>
      </div>
      <SiteMap />
    </div>
  );
}
