import requests

def fetch_stock_news(ticker):
    """Fetch stock-related news using News API."""
    api_key = "e478571537b147228a4842c23a64979a"  # Updated with the provided News API key
    url = f"https://newsapi.org/v2/everything?q={ticker}&apiKey={api_key}"
    response = requests.get(url)

    if response.status_code == 200:
        news_data = response.json()
        articles = news_data.get("articles", [])
        summarized_news = []

        for article in articles[:5]:  # Limit to top 5 articles
            summarized_news.append({
                "title": article.get("title"),
                "summary": article.get("description")
            })

        return summarized_news
    else:
        raise Exception(f"Failed to fetch news for {ticker}. HTTP Status: {response.status_code}")