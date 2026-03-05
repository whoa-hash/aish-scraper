import articles from "./jsons/articles.json";
import AishWidget from "./components/AishWidget";
import "./App.css";

export default function App() {
  const featuredIndex = 0; // first article = most current

  return (
    <div className="page">
      <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      padding: "40px 20px 40px 20px" 
}   }>
    <AishWidget />
    </div>
      <main className="grid">
        
        {articles.slice(0, 10).map((article, i) => (
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

           
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}