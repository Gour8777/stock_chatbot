import unittest
from utils.news_fetcher import fetch_stock_news

class TestNewsFetcher(unittest.TestCase):
    def test_fetch_stock_news(self):
        ticker = "AAPL"
        result = fetch_stock_news(ticker)
        
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
        
        for article in result:
            self.assertIn("title", article)
            self.assertIn("summary", article)
            self.assertIsInstance(article["title"], str)
            self.assertIsInstance(article["summary"], str)

if __name__ == "__main__":
    unittest.main()