import yfinance as yf
import pandas as pd
def fetch_stock_data(ticker):
    """Fetch stock data using yfinance and calculate metrics."""
    try:
        stock = yf.Ticker(ticker)
        stock_info = stock.info

        price = stock_info.get("regularMarketPrice")
        eps = stock_info.get("trailingEps")
        pe_ratio = stock_info.get("trailingPE")
        de_ratio = stock_info.get("debtToEquity")

        return {
            "ticker": ticker,
            "price": price,
            "pe_ratio": pe_ratio,
            "eps": eps,
            "de_ratio": de_ratio
        }
    except Exception as e:
        raise Exception(f"Failed to fetch data for {ticker}: {e}")
    
    
def fetch_history(ticker: str, period: str = "2y", interval: str = "1d") -> pd.DataFrame:
    """
    Robust single-ticker history fetch that guarantees a 'Close' column
    (falls back to 'Adj Close' if needed) and avoids MultiIndex headaches.
    """
    t = yf.Ticker(ticker)

    # Try progressively smaller periods to avoid empty returns / throttling
    periods = [period, "1y", "6mo", "3mo"]
    for per in periods:
        df = t.history(period=per, interval=interval, auto_adjust=False)
        if isinstance(df, pd.DataFrame) and not df.empty:
            # Normalize columns
            if "Close" not in df.columns and "Adj Close" in df.columns:
                df = df.rename(columns={"Adj Close": "Close"})
            if "Close" not in df.columns:
                # Very rare: unexpected schema
                raise ValueError(f"'Close' column missing for {ticker}. Columns: {list(df.columns)}")

            df = df[["Close"]].dropna()
            df.index = pd.to_datetime(df.index)
            return df

    raise ValueError(
        f"No historical data for {ticker}. Possible causes: invalid/suffixed ticker, "
        f"Yahoo throttling, or network issue."
    )
    """
    Download OHLCV for a single ticker and return a DataFrame with a guaranteed
    'Close' column. Handles MultiIndex columns, Adj Close fallback, and empty results.
    """
    # 1) Force single-column layout to avoid MultiIndex
    df = yf.download(
        ticker,
        period=period,
        interval=interval,
        group_by="column",      # <-- avoids ('Close','AAPL') shape
        progress=False,
        auto_adjust=False,
        actions=False,
        threads=True,
    )

    # 2) If empty, try a smaller period fallback
    if not isinstance(df, pd.DataFrame) or df.empty:
        df = yf.download(
            ticker,
            period="6mo",
            interval=interval,
            group_by="column",
            progress=False,
            auto_adjust=False,
            actions=False,
            threads=True,
        )

    # 3) Still empty? Bail early with a clear error
    if not isinstance(df, pd.DataFrame) or df.empty:
        raise ValueError(f"No historical data returned for {ticker}. "
                         "Possible causes: invalid ticker, Yahoo throttling, or network issue.")

    # 4) Normalize columns: handle 'Adj Close' fallback and unexpected casing
    cols = {c.lower(): c for c in df.columns}  # map lowercase->original
    if "close" in cols:
        close_col = cols["close"]
    elif "adj close" in cols:
        # Use adjusted close if regular close missing
        close_col = cols["adj close"]
        df.rename(columns={close_col: "Close"}, inplace=True)
        close_col = "Close"
    else:
        # Last resort: if MultiIndex slipped in (older yfinance), try to flatten
        if isinstance(df.columns, pd.MultiIndex):
            try:
                # pick the first level matching Close
                if "Close" in df.columns.get_level_values(0):
                    df = df.xs("Close", axis=1, level=0, drop_level=False)
                elif "Adj Close" in df.columns.get_level_values(0):
                    df = df.xs("Adj Close", axis=1, level=0, drop_level=False)
                # after xs, try to pick single column
                if isinstance(df.columns, pd.MultiIndex) and ticker.upper() in df.columns.get_level_values(-1):
                    df = df.xs(ticker.upper(), axis=1, level=-1)
                # rename to Close
                if "Adj Close" in df.columns and "Close" not in df.columns:
                    df.rename(columns={"Adj Close": "Close"}, inplace=True)
                close_col = "Close" if "Close" in df.columns else None
            except Exception:
                close_col = None
        else:
            close_col = None

        if close_col is None:
            raise ValueError(f"'Close' (or 'Adj Close') column not found for {ticker}. "
                             f"Columns present: {list(df.columns)}")

    # 5) Clean index and drop NaNs in Close
    df.index = pd.to_datetime(df.index)
    df = df.dropna(subset=[close_col])

    # 6) Return only a standard single Close column
    out = df[[close_col]].copy()
    if close_col != "Close":
        out.rename(columns={close_col: "Close"}, inplace=True)

    return out