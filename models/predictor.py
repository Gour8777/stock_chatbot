from typing import Iterable, Tuple, List
import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA


def predict_stock_prices_arima(
    series: Iterable[float],
    steps: int = 10,
    order: Tuple[int, int, int] = (5, 1, 0)
) -> List[float]:
    """
    ARIMA forecast on a 1D iterable (e.g., pd.Series of Close).
    Returns a Python list of floats (JSON-safe).
    """
    s = pd.Series(series).astype(float).dropna()
    if s.size < 20:
        # ARIMA needs some history—fallback to simple extrapolation
        last = float(s.iloc[-1]) if s.size else 0.0
        return [last for _ in range(steps)]

    model = ARIMA(s.values, order=order)
    fit = model.fit()
    fc = fit.forecast(steps=steps)
    return [float(x) for x in fc]
