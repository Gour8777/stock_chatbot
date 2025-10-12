import React, { useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

/**
 * Drop this component into any React project (Vite/CRA/Next client page).
 * It chats with a FastAPI endpoint: GET `${API_BASE}/stock/{ticker}`.
 * It renders: user prompt, assistant reply with metrics, news, forecast chart, and the LLM report.
 *
 * FastAPI CORS (add to your FastAPI app once):
 * from fastapi.middleware.cors import CORSMiddleware
 * api.add_middleware(
 *   CORSMiddleware,
 *   allow_origins=["*"],  # or your exact frontend origin
 *   allow_credentials=True,
 *   allow_methods=["*"],
 *   allow_headers=["*"],
 * )
 */

const API_BASE =
  import.meta?.env?.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  "http://localhost:8000";

export default function StockChatbot() {
  const [messages, setMessages] = useState([]); // {role: 'user'|'assistant', parts: ReactNode}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const scrollToEnd = () => {
    queueMicrotask(() => listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" }));
  };

  async function handleSend(tickerRaw) {
    const ticker = (tickerRaw || input).trim();
    if (!ticker) return;

    setMessages((m) => [...m, { role: "user", parts: <UserBubble text={`Show ${ticker.toUpperCase()}`} /> }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(ticker)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const assistantCard = (
        <AssistantCard
          payload={data}
          ticker={ticker.toUpperCase()}
        />
      );

      setMessages((m) => [...m, { role: "assistant", parts: assistantCard }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          parts: (
            <ErrorBubble title="Request failed" detail={String(err)} hint="Check backend URL/CORS and make sure the ticker exists." />
          ),
        },
      ]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-4">
        <div className="space-y-3" ref={listRef}>
          {messages.length === 0 && <Welcome />}

          {messages.map((m, i) => (
            <div key={i}>{m.parts}</div>
          ))}

          {loading && <TypingIndicator />}
        </div>
      </main>

      <footer className="w-full border-t bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Type a stock ticker, e.g., AAPL, TSLA, TCS..."
            className="flex-1 rounded-xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Send"}
          </button>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <div className="w-full bg-white border-b">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white grid place-items-center font-bold">Σ</div>
        <div>
          <div className="text-slate-900 font-semibold">Stock Analyst Chat</div>
          <div className="text-slate-500 text-sm">Type a ticker to get metrics, news & a forecast chart.</div>
        </div>
      </div>
    </div>
  );
}

function Welcome() {
  const examples = ["AAPL", "MSFT", "GOOGL", "TSLA", "NFLX", "NVDA", "RELIANCE", "TCS"];
  return (
    <div className="bg-white border rounded-2xl p-5 text-slate-700">
      <div className="text-slate-900 font-semibold mb-2">Try one of these tickers</div>
      <div className="flex flex-wrap gap-2">
        {examples.map((t) => (
          <span key={t} className="text-xs bg-slate-100 border rounded-full px-3 py-1">{t}</span>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-slate-900 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm shadow">
        {text}
      </div>
    </div>
  );
}

function ErrorBubble({ title, detail, hint }) {
  return (
    <div className="flex">
      <div className="max-w-[85%] bg-red-50 text-red-900 border border-red-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm shadow">
        <div className="font-semibold">{title}</div>
        <div className="text-xs mt-1">{detail}</div>
        {hint && <div className="text-xs mt-2 text-red-700">Hint: {hint}</div>}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex">
      <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-slate-500">
        Thinking<span className="animate-pulse">…</span>
      </div>
    </div>
  );
}

function AssistantCard({ payload, ticker }) {
  // Expected payload:
  // {
  //   stock_data: { ticker, price, pe_ratio, eps, de_ratio },
  //   news: [ {title, summary}, ...],
  //   history: [ ... recent closes ... ],
  //   predictions: [ ... 10-step forecast ... ],
  //   llm_report: "markdown"
  // }

  const stock = payload?.stock_data || {};
  const news = Array.isArray(payload?.news) ? payload.news : [];
  const preds = Array.isArray(payload?.predictions) ? payload.predictions : [];
  const history = Array.isArray(payload?.history) ? payload.history : [];
  const report = payload?.llm_report || "";

  const chartData = useMemo(() => {
  const rows = [];

  // history segment
  history.forEach((p, i) =>
    rows.push({ label: `H${i + 1}`, history: Number(p), forecast: null })
  );

  // "Now" point (optional, shown on both to connect)
  if (typeof stock.price === "number") {
    rows.push({
      label: "Now",
      history: Number(stock.price),
      forecast: Number(stock.price),
    });
  }

  // forecast segment
  preds.forEach((p, i) =>
    rows.push({ label: `+${i + 1}`, history: null, forecast: Number(p) })
  );

  return rows;
}, [history, preds, stock.price]);

  return (
    <div className="flex">
      <div className="w-full max-w-[85%] bg-white border rounded-2xl rounded-bl-sm p-4 shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-xl bg-slate-900 text-white grid place-items-center text-xs font-bold">AI</div>
          <div className="font-semibold text-slate-900">{ticker} — Stock Snapshot</div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Price" value={fmtCurrency(stock.price ?? history.at(-1))} />
          <Metric label="P/E" value={fmtNumber(stock.pe_ratio)} />
          <Metric label="EPS" value={fmtNumber(stock.eps)} />
          <Metric label="D/E (%)" value={fmtNumber(stock.de_ratio)} />
        </div>

        {/* Chart */}
        <div className="mt-5">
          <div className="flex items-end justify-between mb-2">
            <div className="text-slate-900 font-medium">10-Step Forecast</div>
            <div className="text-slate-500 text-xs">Client-side chart (Recharts)</div>
          </div>
          {chartData.length > 1 ? (
            <div className="chart-wrap">{/* fixed height container from index.css */}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
  <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
  <Tooltip
    formatter={(v, name) => [fmtCurrency(v), name]}
    labelClassName="text-xs"
  />
  <Legend />

  {/* Solid blue history */}
  <Line
    type="monotone"
    dataKey="history"
    name="History"
    stroke="#2563eb"
    strokeWidth={2}
    dot={false}
    connectNulls
    isAnimationActive={false}
  />

  {/* Dashed orange forecast */}
  <Line
    type="monotone"
    dataKey="forecast"
    name="Forecast"
    stroke="#f97316"
    strokeWidth={2}
    strokeDasharray="6 4"
    dot={false}
    connectNulls
    isAnimationActive={false}
  />
</LineChart>

              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-slate-500 text-sm">No forecast data.</div>
          )}
        </div>

        {/* News */}
        <div className="mt-6">
          <div className="text-slate-900 font-medium mb-2">Latest Headlines</div>
          {news.length === 0 && <div className="text-slate-500 text-sm">No news available.</div>}
          <ul className="space-y-3">
            {news.map((n, i) => (
              <li key={i} className="p-3 border rounded-xl hover:bg-slate-50">
                <div className="text-sm font-medium text-slate-900">{n.title}</div>
                {n.summary && <div className="text-xs text-slate-600 mt-1">{n.summary}</div>}
              </li>
            ))}
          </ul>
        </div>

        {/* LLM Report */}
        {report && (
          <details className="mt-6 group">
            <summary className="cursor-pointer select-none text-slate-900 font-medium">
              Detailed Report <span className="text-slate-500 font-normal">(LLM)</span>
            </summary>
            <MarkdownBlock markdown={report} />
          </details>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-slate-50 border rounded-xl p-3">
      <div className="text-slate-500 text-xs">{label}</div>
      <div className="text-slate-900 font-semibold text-sm">{value ?? "—"}</div>
    </div>
  );
}

function MarkdownBlock({ markdown }) {
  // Minimal markdown rendering (bold, headings, lists). For full MD, plug in react-markdown.
  const html = useMemo(() => {
    let h = markdown
      .replace(/^### (.*$)/gim, '<h3 class="mt-3 mb-2 font-semibold">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="mt-3 mb-2 font-semibold">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="mt-3 mb-2 font-semibold">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/\n\n/g, "<br/><br/>")
      .replace(/\n\* /g, "<br/>• ");
    return h;
  }, [markdown]);

  return (
    <div className="prose prose-slate max-w-none text-sm mt-3" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function fmtCurrency(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(v);
  } catch {
    return v.toFixed(2);
  }
}
function fmtNumber(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  return Math.round((v + Number.EPSILON) * 1000) / 1000; // 3 decimals max
}
