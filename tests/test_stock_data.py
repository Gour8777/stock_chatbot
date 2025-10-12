import unittest
from utils.stock_data import fetch_stock_data

class TestStockData(unittest.TestCase):
    def test_fetch_stock_data(self):
        ticker = "AAPL"
        result = fetch_stock_data(ticker)
        
        self.assertIn("ticker", result)
        self.assertIn("price", result)
        self.assertIn("pe_ratio", result)
        self.assertIn("eps", result)
        self.assertIn("de_ratio", result)
        
        self.assertEqual(result["ticker"], ticker)
        self.assertGreater(result["price"], 0)
        self.assertGreater(result["pe_ratio"], 0)
        self.assertGreater(result["eps"], 0)
        self.assertGreaterEqual(result["de_ratio"], 0)

if __name__ == "__main__":
    unittest.main()