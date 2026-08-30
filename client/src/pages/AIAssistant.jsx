import { useEffect, useRef, useState } from "react";
import { Bot, MapPin, ChevronRight, Send, Sparkles, Plus, ShieldCheck } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { GlassCard, IconBox, SectionTitle, fieldCls } from "../components/ui.jsx";

const QUICK_ACTIONS = [
  "Check cybersecurity level",
  "Show accessible resources",
  "Find denied resources",
  "Generate daily operations report",
  "Summarize resource status",
  "Generate management summary",
];

const WELCOME = {
  role: "assistant",
  text: "Hi, I'm IntelliPath AI. I can look up people and their assignments, check cybersecurity access levels, summarize operations, and surface device status. What would you like to know?",
  ts: Date.now(),
};

const SITES = [
  { name: "Main Gate", zone: "Pioneer Sector 1", note: "Primary access control point" },
  { name: "Workshop A", zone: "Production & fabrication", note: "Pump Unit-A12 maintenance area" },
  { name: "Pump Unit-A12", zone: "Workshop Zone", note: "Maintenance · Level 6 required" },
  { name: "Admin Office", zone: "Operations & HSE", note: "General access" },
  { name: "Dry Dock", zone: "Heavy lift & crane ops", note: "High risk · operator only" },
];

const CHAT_KEY = "intellipath.chat.v1";

function loadChat() {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [WELCOME];
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(loadChat);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [selectedSite, setSelectedSite] = useState(SITES[2]);
  const listRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function ask(text) {
    const q = (text ?? input).trim();
    if (!q || typing) return;

    setMessages((m) => [...m, { role: "user", text: q, ts: Date.now() }]);
    setInput("");
    setTyping(true);

    try {
      const res = await api.askAI(q);
      // brief pause so the reply feels like it was reasoned, not instant
      await new Promise((r) => setTimeout(r, 500));
      setMessages((m) => [
        ...m,
        { role: "assistant", text: res.reply, data: res, ts: Date.now() },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Sorry, something went wrong: ${e.message}`, error: true, ts: Date.now() },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function newChat() {
    setMessages([WELCOME]);
  }

  return (
    <div>
      <SectionTitle
        title="AI Assistant"
        subtitle="Ask questions about people, devices, access rules, and operations — in plain language."
        icon={Bot}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Chat */}
        <GlassCard className="xl:col-span-2 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-white">IntelliPath AI</h2>
                <p className="text-xs text-emerald-300">Online · rule engine</p>
              </div>
            </div>
            <button
              onClick={newChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-soft text-xs text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <Plus className="w-3.5 h-3.5" /> New chat
            </button>
          </div>

          <div ref={listRef} className="flex-1 p-5 space-y-4 overflow-y-auto" style={{ minHeight: 420, maxHeight: 560 }}>
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end gap-2.5 max-w-[85%] ${isUser ? "flex-row-reverse" : ""}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-white/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-cyan-300" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <div
                        className={`px-4 py-3 text-sm leading-relaxed ${
                          isUser
                            ? "bg-gradient-to-r from-cyan-500/80 to-violet-500/80 text-white rounded-2xl rounded-br-md"
                            : m.error
                            ? "bg-rose-400/10 border border-rose-400/20 text-rose-200 rounded-2xl rounded-bl-md"
                            : "glass text-slate-200 rounded-2xl rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-line">{m.text}</p>

                        {!isUser && m.data?.person && (
                          <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                            <span className="text-slate-500">Person:</span>{" "}
                            <span className="text-white font-medium">{m.data.person.name}</span> ·{" "}
                            {m.data.person.type} · {m.data.person.company} · L{m.data.person.cyber_level}
                          </div>
                        )}

                        {!isUser && m.data?.accessChecks?.length > 0 && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {m.data.accessChecks.map((c) => (
                              <div key={c.resourceId} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between gap-2">
                                <span className="text-slate-200">{c.resourceName}</span>
                                <span className={`font-medium ${c.allowed ? "text-emerald-300" : "text-rose-300"}`}>
                                  {c.allowed ? "Allowed" : "Denied"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {!isUser && m.data?.rule && (
                          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">{m.data.rule}</p>
                        )}
                      </div>
                      <span className={`text-[10px] text-slate-600 ${isUser ? "text-right" : "text-left"}`}>
                        {isUser ? "You" : "IntelliPath AI"} · {fmtTime(m.ts)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {typing && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-white/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {QUICK_ACTIONS.slice(0, 4).map((a) => (
                <button
                  key={a}
                  onClick={() => ask(a)}
                  className="px-3 py-1.5 rounded-full glass-soft text-xs text-slate-300 hover:bg-white/10 hover:text-white transition"
                >
                  {a}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-white/5">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask();
                  }
                }}
                rows={1}
                placeholder="Ask about people, devices, access…"
                className={`${fieldCls} flex-1 resize-none`}
                style={{ minHeight: 44 }}
              />
              <button
                onClick={() => ask()}
                disabled={typing || !input.trim()}
                className="w-11 h-11 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 disabled:opacity-40 flex items-center justify-center shrink-0 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5">Enter to send · Shift+Enter for a new line</p>
          </div>
        </GlassCard>

        {/* Quick actions */}
        <GlassCard className="p-6">
          <h2 className="font-display font-semibold text-white mb-4">Quick AI Actions</h2>
          <div className="space-y-2.5">
            {QUICK_ACTIONS.map((item) => (
              <button
                key={item}
                onClick={() => ask(item)}
                className="w-full text-left p-3 rounded-xl glass-soft hover:bg-white/10 text-sm text-slate-300 flex items-center justify-between transition"
              >
                {item}
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 inline mr-1.5" />
            Rule engine + LLM-ready. Swap in Claude / DeepSeek without changing the UI.
          </div>
        </GlassCard>
      </div>

      {/* Map */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        <GlassCard className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-white">Site Location View</h2>
              <p className="text-sm text-slate-500 mt-1">Seatrium Pioneer Yard · live map</p>
            </div>
            <MapPin className="w-5 h-5 text-cyan-300" />
          </div>

          <div className="relative h-96 rounded-2xl overflow-hidden border border-white/10">
            <iframe
              title="Seatrium Pioneer Yard — Google Maps"
              src="https://www.google.com/maps?q=Seatrium%20Pioneer%20Yard%20Singapore&z=15&output=embed"
              className="absolute inset-0 w-full h-full"
              style={{ border: 0, filter: "saturate(0.9)" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="absolute left-4 bottom-4 glass rounded-2xl p-4 w-72 pointer-events-none">
              <p className="text-xs text-slate-500">Selected Location</p>
              <p className="font-medium text-white mt-1">{selectedSite.name} · {selectedSite.zone}</p>
              <p className="text-xs text-slate-500 mt-1">{selectedSite.note}</p>
            </div>
          </div>
        </GlassCard>

        {/* Site locations */}
        <GlassCard className="p-6">
          <h2 className="font-display font-semibold text-white mb-4">Site Locations</h2>
          <div className="space-y-2.5">
            {SITES.map((site) => {
              const active = selectedSite.name === site.name;
              return (
                <button
                  key={site.name}
                  onClick={() => setSelectedSite(site)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    active
                      ? "bg-gradient-to-r from-cyan-500/15 to-violet-500/15 border-white/10"
                      : "glass-soft border-transparent hover:bg-white/10"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{site.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{site.zone}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{site.note}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-emerald-400/10 border border-emerald-400/20">
            <p className="font-medium text-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Access Check
            </p>
            <p className="mt-1 text-xs text-emerald-300/80">
              {user?.name || "Selected user"} (Level {user ? "—" : ""}) can access {selectedSite.name === "Pump Unit-A12" ? "this Level 6 resource" : "general site areas"}.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
