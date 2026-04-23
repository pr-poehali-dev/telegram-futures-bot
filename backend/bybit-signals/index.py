"""
Bybit Signals — генерация торговых сигналов на основе реальных индикаторов RSI/MACD/EMA.
Анализирует все заданные пары и возвращает список активных сигналов с уровнями SL/TP.
"""
import json
import urllib.request
import urllib.parse
import time
import math

BYBIT_BASE = "https://api.bybit.com"

SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT",
    "ADAUSDT", "TONUSDT", "SUIUSDT", "APTUSDT", "ARBUSDT"
]

SYMBOL_LABELS = {
    "BTCUSDT": "BTC/USDT", "ETHUSDT": "ETH/USDT", "SOLUSDT": "SOL/USDT",
    "BNBUSDT": "BNB/USDT", "XRPUSDT": "XRP/USDT", "ADAUSDT": "ADA/USDT",
    "TONUSDT": "TON/USDT", "SUIUSDT": "SUI/USDT", "APTUSDT": "APT/USDT",
    "ARBUSDT": "ARB/USDT"
}


def fetch_klines(symbol: str, interval: str = "240", limit: int = 100) -> list:
    params = urllib.parse.urlencode({
        "category": "linear", "symbol": symbol,
        "interval": interval, "limit": limit
    })
    url = f"{BYBIT_BASE}/v5/market/kline?{params}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
    raw = data.get("result", {}).get("list", [])
    raw.reverse()
    return [{"time": int(k[0]), "open": float(k[1]), "high": float(k[2]),
             "low": float(k[3]), "close": float(k[4]), "volume": float(k[5])} for k in raw]


def calc_rsi(closes: list, period: int = 14) -> float:
    if len(closes) < period + 1:
        return 50.0
    gains, losses = [], []
    for i in range(1, len(closes)):
        d = closes[i] - closes[i - 1]
        gains.append(max(d, 0))
        losses.append(max(-d, 0))
    ag = sum(gains[-period:]) / period
    al = sum(losses[-period:]) / period
    if al == 0:
        return 100.0
    return round(100 - (100 / (1 + ag / al)), 2)


def calc_ema(values: list, period: int) -> list:
    if len(values) < period:
        return values[:]
    k = 2 / (period + 1)
    ema = [sum(values[:period]) / period]
    for v in values[period:]:
        ema.append(v * k + ema[-1] * (1 - k))
    return ema


def calc_macd(closes: list) -> dict:
    if len(closes) < 35:
        return {"trend": "neutral", "histogram": 0}
    ema12 = calc_ema(closes, 12)
    ema26 = calc_ema(closes, 26)
    min_len = min(len(ema12), len(ema26))
    macd_line = [ema12[-min_len + i] - ema26[-min_len + i] for i in range(min_len)]
    signal_line = calc_ema(macd_line, 9)
    hist = macd_line[-1] - (signal_line[-1] if signal_line else 0)
    trend = "bullish" if hist > 0 else ("bearish" if hist < 0 else "neutral")
    return {"trend": trend, "histogram": round(hist, 4), "macd": round(macd_line[-1], 4)}


def calc_atr(candles: list, period: int = 14) -> float:
    if len(candles) < period + 1:
        return 0
    trs = []
    for i in range(1, len(candles)):
        h, l, pc = candles[i]["high"], candles[i]["low"], candles[i - 1]["close"]
        trs.append(max(h - l, abs(h - pc), abs(l - pc)))
    return sum(trs[-period:]) / period


def analyze_symbol(symbol: str, interval: str = "240") -> dict | None:
    try:
        candles = fetch_klines(symbol, interval, 120)
        if len(candles) < 50:
            return None

        closes = [c["close"] for c in candles]
        current_price = closes[-1]
        rsi = calc_rsi(closes)
        macd = calc_macd(closes)
        ema50 = calc_ema(closes, 50)[-1]
        ema200 = calc_ema(closes, 200)[-1] if len(closes) >= 200 else None
        atr = calc_atr(candles)

        signal_type = None
        reason_parts = []
        confidence = 50

        # BUY условия
        if rsi < 38:
            signal_type = "buy"
            reason_parts.append(f"RSI={rsi} перепроданность")
            confidence += 20
        if macd["trend"] == "bullish":
            if signal_type == "buy":
                reason_parts.append("MACD бычий")
                confidence += 15
            elif signal_type is None and rsi < 50:
                signal_type = "buy"
                reason_parts.append(f"MACD бычий кросс, RSI={rsi}")
                confidence += 25

        if current_price > ema50 and signal_type == "buy":
            reason_parts.append("цена выше EMA50")
            confidence += 10

        # SELL условия
        if rsi > 62:
            signal_type = "sell"
            reason_parts = [f"RSI={rsi} перекупленность"]
            confidence = 50 + 20
        if macd["trend"] == "bearish":
            if signal_type == "sell":
                reason_parts.append("MACD медвежий")
                confidence += 15
            elif signal_type is None and rsi > 50:
                signal_type = "sell"
                reason_parts = [f"MACD медвежий кросс, RSI={rsi}"]
                confidence = 50 + 25

        if current_price < ema50 and signal_type == "sell":
            reason_parts.append("цена ниже EMA50")
            confidence += 10

        if ema200:
            if signal_type == "buy" and current_price > ema200:
                reason_parts.append("выше EMA200")
                confidence += 5
            elif signal_type == "sell" and current_price < ema200:
                reason_parts.append("ниже EMA200")
                confidence += 5

        if signal_type is None:
            return None

        confidence = min(confidence, 97)

        # SL/TP на основе ATR
        atr_mult_sl = 1.5
        atr_mult_tp1 = 2.0
        atr_mult_tp2 = 3.5

        if signal_type == "buy":
            sl = round(current_price - atr * atr_mult_sl, 6 if current_price < 1 else 2)
            tp1 = round(current_price + atr * atr_mult_tp1, 6 if current_price < 1 else 2)
            tp2 = round(current_price + atr * atr_mult_tp2, 6 if current_price < 1 else 2)
        else:
            sl = round(current_price + atr * atr_mult_sl, 6 if current_price < 1 else 2)
            tp1 = round(current_price - atr * atr_mult_tp1, 6 if current_price < 1 else 2)
            tp2 = round(current_price - atr * atr_mult_tp2, 6 if current_price < 1 else 2)

        risk = abs(current_price - sl)
        reward = abs(tp1 - current_price)
        rr = round(reward / risk, 1) if risk > 0 else 1.0

        risk_level = "low" if confidence >= 80 else ("medium" if confidence >= 65 else "high")

        tf_labels = {"1": "1M", "5": "5M", "15": "15M", "60": "1H", "240": "4H", "D": "1D"}
        tf_label = tf_labels.get(interval, interval)

        return {
            "symbol": SYMBOL_LABELS.get(symbol, symbol),
            "raw_symbol": symbol,
            "type": signal_type,
            "timeframe": tf_label,
            "entry": round(current_price, 6 if current_price < 1 else 2),
            "tp1": tp1,
            "tp2": tp2,
            "sl": sl,
            "riskLevel": risk_level,
            "rr": f"{rr}:1",
            "confidence": confidence,
            "reason": ", ".join(reason_parts),
            "rsi": rsi,
            "macd_trend": macd["trend"],
            "ema50": round(ema50, 2),
            "time": int(time.time() * 1000),
            "status": "active",
        }
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    params = event.get("queryStringParameters") or {}
    interval = params.get("interval", "240")
    symbols_param = params.get("symbols", ",".join(SYMBOLS))
    symbols = [s.strip() for s in symbols_param.split(",") if s.strip()]

    results = []
    for i, sym in enumerate(symbols):
        sig = analyze_symbol(sym, interval)
        if sig:
            sig["id"] = i + 1
            results.append(sig)

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({"signals": results, "total": len(results), "generated_at": int(time.time() * 1000)}),
    }
