"use client";
import { useState } from "react";

type Panel = { provider: "openai" | "deepseek"; model?: string; answer?: string };

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [panels, setPanels] = useState<Panel[]>([
    { provider: "openai", model: "gpt-4o-mini" },
    { provider: "deepseek", model: "deepseek-chat" },
  ]);

  async function compare() {
    setLoading(true);
    try {
      const results = await Promise.all(
        panels.map(async (p) => {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, provider: p.provider, model: p.model }),
          });
          const data = await res.json();
          return { ...p, answer: data.answer ?? "(no answer)" };
        })
      );
      setPanels(results);
    } finally {
      setLoading(false);
    }
  }

  function updatePanel(idx: number, np: Partial<Panel>) {
    setPanels((prev) => prev.map((p, i) => (i === idx ? { ...p, ...np } : p)));
  }

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Hub – Side-by-Side</h1>

      <textarea
        className="border rounded p-2 w-full"
        rows={4}
        placeholder="Ask something…"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="flex flex-wrap gap-2 my-3">
        {panels.map((p, i) => (
          <div key={i} className="flex items-center gap-2 border rounded px-3 py-2">
            <select
              value={p.provider}
              onChange={(e) => updatePanel(i, { provider: e.target.value as Panel["provider"] })}
              className="border rounded px-2 py-1"
            >
              <option value="openai">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
            </select>
            <input
              className="border rounded px-2 py-1 w-44"
              placeholder="model (optional)"
              value={p.model ?? ""}
              onChange={(e) => updatePanel(i, { model: e.target.value })}
            />
          </div>
        ))}
        {panels.length < 3 && (
          <button
            className="border rounded px-3 py-2"
            onClick={() => setPanels([...panels, { provider: "openai", model: "gpt-4o-mini" }])}
          >
            + Panel
          </button>
        )}
      </div>

      <button
        onClick={compare}
        disabled={loading || !question.trim()}
        className="px-4 py-2 bg-black text-white rounded"
      >
        {loading ? "Comparing…" : "Compare"}
      </button>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {panels.map((p, i) => (
          <div key={i} className="border rounded p-3 whitespace-pre-wrap min-h-[120px]">
            <div className="text-sm opacity-70 mb-2">
              {p.provider} {p.model ? `• ${p.model}` : ""}
            </div>
            {p.answer ?? ""}
          </div>
        ))}
      </div>
    </main>
  );
}
