// import articles from "./articles.json";
// import "./App.css";

// export default function App() {
//   return (
//     <div className="page">
//       <header className="header">
//         <h1 className="title">Aish</h1>
//         <p className="subtitle">Smart Reads for Curious Minds</p>
//       </header>

//       <main className="grid">
//         {articles.map((article, i) => (
//           <a
//             key={i}
//             href={article.url}
//             target="_blank"
//             rel="noreferrer"
//             className={`card ${
//               i === 0 ? "card-featured" : i % 4 === 0 ? "card-medium" : "card-small"
//             }`}
//             style={{ animationDelay: `${i * 80}ms` }}
//           >
//             {article.image && (
//               <img
//                 src={article.image}
//                 alt=""
//                 className="thumb"
//                 loading="lazy"
//               />
//             )}

//             <div className="content">
//               {i === 0 && <span className="badge">FEATURED</span>}
//               <h2 className="articleTitle">{article.title}</h2>
//             </div>

//             <span className="arrow">→</span>
//           </a>
//         ))}
//       </main>
//     </div>
//   );
// }
import { useState } from "react";
import articles from "./articles.json";
import "./App.css";

export default function App() {
  const featuredIndex = 1; // second article = most current
  const [summaries, setSummaries] = useState({});

  function handleSummarize(index) {
    const fakeSummary =
      "This article highlights key ideas and meaningful insights in a short, easy-to-read overview.";
    setSummaries(prev => ({ ...prev, [index]: fakeSummary }));
  }

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">Aish</h1>
        <p className="subtitle">Smart Reads for Curious Minds</p>
      </header>

      <main className="grid">
        {articles.map((article, i) => (
          <article
            key={i}
            className={`card ${
              i === featuredIndex
                ? "card-featured"
                : i % 4 === 0
                ? "card-medium"
                : "card-small"
            }`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <a href={article.url} target="_blank" rel="noreferrer">
              {article.image && (
                <img
                  src={article.image}
                  alt={article.title}
                  className="thumb"
                  loading="lazy"
                />
              )}
            </a>

            <div className="content">
              {i === featuredIndex && (
                <span className="badge">FEATURED</span>
              )}

              <div className="tags">
                <span className="tag">{article.category}</span>
              </div>

              <h2 className="articleTitle">{article.title}</h2>

              {/* <button
                className="ai-button"
                onClick={() => handleSummarize(i)}
              >
                ✨ AI Summary
              </button> */}

              {/* {summaries[i] && (
                <p className="summary">{summaries[i]}</p>
              )} */}
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}