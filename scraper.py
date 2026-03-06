import json
import requests
from bs4 import BeautifulSoup

def get_article_image(url):
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        og_image = soup.find("meta", property="og:image")
        if og_image:
            return og_image["content"]
                
    except Exception as e:
        print(f"Error: {e}")

    return None

def scrape_aish_articles():
    # headers = {"User-Agent": "Mozilla/5.0"} - don't really need this, but it can help avoid being blocked by some sites
    response = requests.get("https://aish.com/")
    soup = BeautifulSoup(response.text, "html.parser")

    articles = []
    seen = set()
    for article in soup.find_all(class_="oxy-post-title"):
        try:
            category = article.find_parent().find(class_="category-name").get_text(strip=True)
        except AttributeError:
            # just a placeholder for now
            category = "Uncategorized"

        image = get_article_image(article['href'])
        
        link = article['href']
        print(category, link)

        # skip podcast videos - only take written articles
        if category == "Podcasts":
            continue
        elif link not in seen:
            articles.append({"title": article.get_text(strip=True), "url": link, "category": category, "image": image})
          
            seen.add(link)
            # only get the first 20 articles
            if len(articles) >= 20:
                break
        
    return articles


if __name__ == "__main__":
    articles = scrape_aish_articles()

    for article in articles:
        print(f"{article['title']}: {article['url']}: {article['category']}")
    
    with open("./jsons/articles.json", "w") as f:
        json.dump(articles, f, indent=2)