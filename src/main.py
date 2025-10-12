from fastapi import FastAPI
from fastapi.responses import JSONResponse
from utils.news_fetcher import fetch_stock_news
from utils.stock_data import fetch_stock_data
from google import genai
from google.genai import types
from models.predictor import predict_stock_prices_arima
import requests
import logging
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from utils.stock_data import fetch_stock_data, fetch_history
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # or set to your exact frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables from .env file
load_dotenv()

# Fetch the Gemini API key from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize the Gemini API client
client = genai.Client(api_key=GEMINI_API_KEY)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Stock Chatbot!"}

@app.get("/stock/{ticker}")
def get_stock_report(ticker: str):
    try:
        # Fetch stock data
        stock_data = fetch_stock_data(ticker)

        # Fetch stock news
        stock_news = fetch_stock_news(ticker)

        # Placeholder for prediction (replace with actual data)
        hist_df = fetch_history(ticker, period="2y", interval="1d")
        closes = hist_df["Close"]
        predictions = predict_stock_prices_arima(closes, steps=10)
        history_tail = [float(x) for x in closes.tail(60).tolist()]
        # Generate detailed report using Gemini API
        prompt = (
            f"Generate a detailed stock report for {ticker} including:\n"
            f"1) P/E: {stock_data.get('pe_ratio')}\n"
            f"2) EPS: {stock_data.get('eps')}\n"
            f"3) Debt-to-Equity (%): {stock_data.get('de_ratio')}\n"
            f"4) Interpret the recent revenue and margin trends.\n"
            f"5) Summarize the latest headlines.\n"
            "Make it concise and actionable."
        )
        logging.info("Sending request to Gemini API...")
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
        )
        llm_report = resp.text or ""

        return JSONResponse(
            content={
                "stock_data": stock_data,
                "news": stock_news,
                "history": history_tail,      # ⬅️ optional, handy for frontend chart
                "predictions": predictions,    # real ARIMA on yfinance prices
                "llm_report": llm_report,
            }
        )
    except Exception as e:
        logging.exception("Error generating stock report")
        return JSONResponse(content={"error": str(e)}, status_code=500)