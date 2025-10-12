# 📈 Stock Chatbot – FastAPI + React (Vite)
AI-powered stock analysis chatbot with live metrics, news, and a 10-step ARIMA forecast.
Backend: **FastAPI (Python)** · Frontend: **React (Vite)**

---

## 🗂 Project Structure
stock_chatbot/
├─ data/ # optional local data

├─ models/ # ML code (ARIMA predictor)

├─ src/ # FastAPI app (main.py)

├─ utils/ # yfinance, news fetchers, helpers

├─ tests/ # (optional) tests

├─ stock-chat-frontend/ # React UI (Vite)

├─ .env # backend secrets (NOT committed)

├─ .gitignore

├─ requirements.txt

└─ README.md


🐍 Backend (FastAPI)
1) Install Python deps
# from project root
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt


Required libs include: fastapi, uvicorn, yfinance, pandas, numpy, statsmodels, python-dotenv, and Google Gemini client.

2) Run the API
uvicorn src.main:app --reload


API root: http://localhost:8000

Swagger docs: http://localhost:8000/docs

3) What the API returns (contract)

GET /stock/{ticker} → JSON:

{
  "stock_data": {
    "ticker": "AAPL",
    "price": 245.27,
    "pe_ratio": 37.16212,
    "eps": 6.6,
    "de_ratio": 154.486
  },
  "news": [{ "title": "...", "summary": "..." }],
  "history": [211.17, 212.48, ...],             // recent closes (e.g., last ~60)
  "predictions": [244.33, 243.75, ...],         // 10-step ARIMA forecast
  "llm_report": "## Markdown report ..."
}


The backend:

pulls metrics & history via yfinance

forecasts with ARIMA (statsmodels)

generates a concise report via Gemini (uses GEMINI_API_KEY)

includes CORS middleware enabled for the frontend

⚛️ Frontend (React + Vite)
1) Install deps
cd stock-chat-frontend
npm install

2) Configure API base URL

Create stock-chat-frontend/.env (Vite uses VITE_ prefix):

VITE_API_BASE=http://localhost:8000

3) Run the dev server
npm run dev


Vite dev URL shows in terminal (usually http://localhost:5173
)

4) Build for production
npm run build
npm run preview   # optional local preview of the built app

🔗 Frontend ↔ Backend

The frontend calls: GET {VITE_API_BASE}/stock/{ticker}

The chart is rendered client-side from:

history (blue, solid)

predictions (orange, dashed)
