import { useState, useEffect } from "react";
import articles from "./../articles.json"; // ← your local file in src/

// ── CONFIG ───────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// ─────────────────────────────────────────────────────────────────────────

// ── Derive category chips from your articles ─────────────────────────────
// Picks the 4 most common categories across your articles list
function deriveChips(articleList) {
  const counts = {};
  articleList.forEach((a) => {
    const cat = a.category?.trim();
    if (cat) counts[cat] = (counts[cat] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([cat]) => ({ label: cat, query: cat }));
}

// ── Gemini call ───────────────────────────────────────────────────────────
async function askGemini(query, articleList) {
  const articleContext = articleList
    .map((a, i) => `${i + 1}. TITLE: ${a.title}\n   URL: ${a.url}\n   CATEGORY: ${a.category}`)
    .join("\n\n");

  const prompt = `You are a guide for Aish.com. Given the articles and query below, respond ONLY in valid JSON with no extra text:
{
  "insight": "2-3 sentence Jewish perspective on the query",
  "articles": [
    {"title":"exact title","url":"exact url","description":"one sentence why relevant","category":"category"},
    {"title":"...","url":"...","description":"...","category":"..."},
    {"title":"...","url":"...","description":"...","category":"..."}
  ]
}

Pick the 3 most relevant articles using EXACT titles and URLs from this list. Do not invent any.

Query: "${query}"

Articles:
${articleContext}`;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.4 },
      }),
    }
  );

  const data = await res.json();
  console.log("Gemini raw response:", JSON.stringify(data, null, 2));

  if (data.error) throw new Error(`Gemini error: ${data.error.message}`);

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Strip markdown fences if Gemini wraps the response
  const cleaned = raw.replace(/```json|```/g, "").trim();

  // Extract the JSON object even if there's surrounding text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]);
}

// ── Component ─────────────────────────────────────────────────────────────
export default function AishWidget() {
  const [query,    setQuery]  = useState("");
  const [status,   setStatus] = useState("idle"); // idle|loading|done|error
  const [result,   setResult] = useState(null);
  const [errorMsg, setError]  = useState("");
  const [chips,    setChips]  = useState([]);
  const [reqCount, setReqCount] = useState(0);
  const LIMIT = 3;

  // Derive chips from articles on mount — no API call needed
  useEffect(() => {
    setChips(deriveChips(articles));
  }, []);

  async function search(q) {
    const trimmed = (q || query).trim();
    if (!trimmed) return;
    if (reqCount >= LIMIT) {
      setError(`You've reached the ${LIMIT} search limit for this session.`);
      setStatus("error");
      return;
    }
    setQuery(trimmed);
    setStatus("loading");
    setResult(null);

    try {
      const parsed = await askGemini(trimmed, articles);
      if (parsed?.articles?.length) {
        setReqCount((c) => c + 1);
        setResult(parsed);
        setStatus("done");
      } else {
        throw new Error("No articles returned");
      }
    } catch (err) {
      console.error(err);
      const msg = err.message?.includes("429") || err.message?.includes("quota")
        ? "Rate limit reached — please wait a moment and try again."
        : "Something went wrong. Please try again.";
      setError(msg);
      setStatus("error");
    }
  }

  return (
    <div style={s.widget}>

      {/* Header */}
      <div style={s.header}>
        <span style={s.menorah}>🕎</span>
        <div>
          <div style={s.title}>Explore Aish Wisdom</div>
          <div style={s.subtitle}>AI-POWERED · FROM YOUR AISH COLLECTION</div>
        </div>
      </div>

      {/* Search bar */}
      <div style={s.searchRow}>
        <input
          style={s.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Ask anything… e.g. 'Jewish resilience' or 'meaning in suffering'"
          disabled={reqCount >= LIMIT}
        />
        <button
          style={{ ...s.btn, ...(status === "loading" || reqCount >= LIMIT ? s.btnOff : {}) }}
          onClick={() => search()}
          disabled={status === "loading" || reqCount >= LIMIT}
        >
          Ask
        </button>
      </div>
      {reqCount > 0 && (
        <div style={s.counter}>
          {reqCount >= LIMIT
            ? "Search limit reached for this session."
            : `${LIMIT - reqCount} search${LIMIT - reqCount === 1 ? "" : "es"} remaining`}
        </div>
      )}

      {/* Category chips — derived from your articles */}
      {chips.length > 0 && (
        <div style={s.chipsRow}>
          <span style={s.chipsLabel}>Browse:</span>
          {chips.map((c) => (
            <button key={c.label} style={s.chip} onClick={() => search(c.query)}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div style={s.divider} />

      {/* Results */}
      <div style={s.results}>
        {status === "idle" && (
          <p style={s.placeholder}>
            Search above or tap a category to find relevant articles &amp; insights.
          </p>
        )}

        {status === "loading" && (
          <div style={s.loadingRow}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ ...s.dot, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        )}

        {status === "error" && <p style={s.placeholder}>{errorMsg}</p>}

        {status === "done" && result && (
          <>
            <div style={s.answer}>
              <div style={s.answerLabel}>✦ Jewish Insight</div>
              {result.insight}
            </div>
            <div style={s.cards}>
              {result.articles.map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.card}
                >
                  <div style={s.cardTitle}>{a.title}</div>
                  <div style={s.cardSummary}>{a.description}</div>
                  <div style={s.cardMeta}>{a.category} · aish.com ↗</div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span style={s.powered}>
          Powered by{" "}
          <a href="https://aish.com" target="_blank" rel="noopener noreferrer" style={s.poweredLink}>
            Aish.com
          </a>{" "}
          &amp; Gemini AI
        </span>
      </div>

      <style>{dotAnim}</style>
    </div>
  );
}

// ── Design tokens ─────────────────────────────────────────────────────────
const gold      = "#b8892a";
const goldLight = "#d4a843";
const ink       = "#1a1208";
const border    = "#d4c4a0";
const parchment = "#f0e8d8";

const s = {
  widget: {
  fontFamily: "Georgia, 'Times New Roman', serif",
  width: "100%",
  maxWidth: "90%",
  // remove maxHeight entirely
  background: "radial-gradient(circle at top, #a81ac4, #1ad0e4)",
  border: `1px solid ${border}`,
  borderRadius: 4,
  boxShadow: `0 2px 24px rgba(26,18,8,0.10), 0 0 0 4px ${parchment}, 0 0 0 5px ${border}`,
  overflow: "visible", // ← changed from "hidden"
},
  header: {
    background: ink,
    padding: "18px 24px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  menorah:  { fontSize: 22 },
  title:    { color: goldLight, fontSize: 17, fontWeight: 700 },
  subtitle: { color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "1.5px", marginTop: 2 },

  searchRow: { padding: "20px 24px 0", display: "flex", gap: 8 },
  input: {
    flex: 1, padding: "10px 14px",
    border: `1px solid ${border}`, borderRadius: 3,
    background: "white", fontFamily: "Georgia, serif",
    fontSize: 14, color: ink, outline: "none",
  },
  btn: {
    padding: "10px 18px", background: gold,
    color: "white", border: "none", borderRadius: 3,
    fontFamily: "Georgia, serif", fontSize: 13,
    fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
  },
  btnOff: { background: "#f0bb1a", cursor: "not-allowed" },

  chipsRow: {
    padding: "12px 24px 18px",
    display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center",
  },
  chipsLabel: { fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#8b7355" },
  chip: {
    padding: "4px 11px", border: `1px solid ${border}`, borderRadius: 20,
    fontSize: 12, color: "#5a4520", background: "white",
    cursor: "pointer", fontFamily: "Georgia, serif",
    maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },

  divider:     { height: 1, background: border, margin: "0 24px" },
  results:     { minHeight: 80, padding: "20px 24px" },
  placeholder: { color: "#a09070", fontStyle: "italic", fontSize: 14, textAlign: "center", padding: "16px 0 8px" },

  loadingRow: { display: "flex", gap: 6, justifyContent: "center", padding: "16px 0" },
  dot: {
    display: "inline-block", width: 7, height: 7,
    borderRadius: "50%", background: gold,
    animation: "awBounce 1.2s ease-in-out infinite",
  },

  answer: {
    background: "white", borderRadius: 3, padding: "14px 16px",
    border: `1px solid ${border}`, fontSize: 14, lineHeight: 1.7,
    color: "#2a1e0a", marginBottom: 16,
  },
  answerLabel: { fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: gold, marginBottom: 8, fontWeight: 600 },

  cards:       { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    borderLeft: `3px solid ${gold}`, padding: "10px 14px",
    background: "white", borderRadius: "0 3px 3px 0",
    textDecoration: "none", display: "block",
  },
  cardTitle:   { fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: ink, marginBottom: 5, lineHeight: 1.35 },
  cardSummary: { fontSize: 13, color: "#5a4a2a", lineHeight: 1.55, marginBottom: 6 },
  cardMeta:    { fontSize: 11, color: "#9a8560", letterSpacing: "0.5px" },

  counter:     { padding: "4px 24px 0", fontSize: 11, color: "#9a8560", textAlign: "right" },
  footer:      { padding: "10px 24px 14px", display: "flex", justifyContent: "flex-end" },
  powered:     { fontSize: 10, color: "#b0a080", letterSpacing: "1px", textTransform: "uppercase" },
  poweredLink: { color: gold, textDecoration: "none" },
};

const dotAnim = `
  @keyframes awBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40%           { transform: translateY(-8px); opacity: 1; }
  }
`;