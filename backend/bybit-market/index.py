"""
Bybit Market Data API
Возвращает цены тикеров, свечи (klines) и индикаторы RSI/MACD для торговых пар.
"""
import json
import os
import time
import hashlib
import hmac
import urllib.request
import urllib.parse
from typing import Optional

BYBIT_BASE = "https://api.bybit.com"


def bybit_request(path: str, params: dict = None, signed: bool = False) -> dict:
    if params is None:
        params = {}

    if signed:
        api_key = os.environ.get("BYBIT_API_KEY", "")
        api_secret = os.environ.get("BYBIT_API_SECRET", "")
        timestamp = str(int(time.time() * 1000))
        recv_window = "5000"
        query = urllib.parse.urlencode(sorted(params.items()))
        sign_str = timestamp + api_key + recv_window + query
        signature = hmac.new(api_secret.encode(), sign_str.encode(), hashlib.sha256).hexdigest()
        headers = {
            "X-BAPI-API-KEY": api_key,
            "X-BAPI-TIMESTAMP": timestamp,
            "X-BAPI-RECV-WINDOW": recv_window,
            "X-BAPI-SIGN": signature,
        }
    else:
        headers = {}

    query_string = urllib.parse.urlencode(params)
    url = f"{BYBIT_BASE}{path}?{query_string}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def calc_rsi(closes: list, period: int = 14) -> float:
    if len(closes) < period + 1:
        return 50.0
    gains, losses = [], []
    for i in range(1, len(closes)):
        delta = closes[i] - closes[i - 1]
        gains.append(max(delta, 0))
        losses.append(max(-delta, 0))
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def calc_ema(values: list, period: int) -> list:
    if len(values) < period:
        return values
    k = 2 / (period + 1)
    ema = [sum(values[:period]) / period]
    for v in values[period:]:
        ema.append(v * k + ema[-1] * (1 - k))
    return ema


def calc_macd(closes: list) -> dict:
    if len(closes) < 35:
        return {"macd": 0, "signal": 0, "histogram": 0, "trend": "neutral"}
    ema12 = calc_ema(closes, 12)
    ema26 = calc_ema(closes, 26)
    min_len = min(len(ema12), len(ema26))
    macd_line = [ema12[-min_len + i] - ema26[-min_len + i] for i in range(min_len)]
    signal_line = calc_ema(macd_line, 9)
    last_macd = macd_line[-1]
    last_signal = signal_line[-1] if signal_line else 0
    histogram = last_macd - last_signal
    trend = "bullish" if histogram > 0 else ("bearish" if histogram < 0 else "neutral")
    return {
        "macd": round(last_macd, 4),
        "signal": round(last_signal, 4),
        "histogram": round(histogram, 4),
        "trend": trend,
    }


def handler(event: dict, context) -> dict:
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "tickers")

    try:
        if action == "tickers":
            symbols = params.get("symbols", "BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,XRPUSDT,ADAUSDT").split(",")
            result = []
            data = bybit_request("/v5/market/tickers", {"category": "linear"})
            ticker_map = {}
            for t in data.get("result", {}).get("list", []):
                ticker_map[t["symbol"]] = t

            for sym in symbols:
                t = ticker_map.get(sym)
                if not t:
                    continue
                price = float(t.get("lastPrice", 0))
                prev = float(t.get("prevPrice24h", price))
                change = round(((price - prev) / prev * 100) if prev else 0, 2)
                result.append({
                    "symbol": sym[:-4] + "/USDT",
                    "raw_symbol": sym,
                    "price": round(price, 4 if price < 1 else 2),
                    "change": change,
                    "volume": t.get("volume24h", "0"),
                    "high24h": float(t.get("highPrice24h", 0)),
                    "low24h": float(t.get("lowPrice24h", 0)),
                    "turnover24h": t.get("turnover24h", "0"),
                })

            return {"statusCode": 200, "headers": cors_headers, "body": json.dumps({"data": result})}

        elif action == "klines":
            symbol = params.get("symbol", "BTCUSDT")
            interval = params.get("interval", "240")
            limit = int(params.get("limit", "100"))

            data = bybit_request("/v5/market/kline", {
                "category": "linear",
                "symbol": symbol,
                "interval": interval,
                "limit": limit,
            })
            raw = data.get("result", {}).get("list", [])
            raw.reverse()

            candles = []
            closes = []
            for k in raw:
                o, h, l, c, v = float(k[1]), float(k[2]), float(k[3]), float(k[4]), float(k[5])
                closes.append(c)
                candles.append({
                    "time": int(k[0]) // 1000,
                    "open": round(o, 2),
                    "high": round(h, 2),
                    "low": round(l, 2),
                    "close": round(c, 2),
                    "volume": round(v, 2),
                })

            rsi = calc_rsi(closes)
            macd = calc_macd(closes)

            ema20 = calc_ema(closes, 20)
            ema50 = calc_ema(closes, 50)
            ema200 = calc_ema(closes, 200)

            last = closes[-1] if closes else 0

            return {
                "statusCode": 200,
                "headers": cors_headers,
                "body": json.dumps({
                    "candles": candles[-60:],
                    "indicators": {
                        "rsi": rsi,
                        "macd": macd,
                        "ema20": round(ema20[-1], 2) if ema20 else None,
                        "ema50": round(ema50[-1], 2) if ema50 else None,
                        "ema200": round(ema200[-1], 2) if ema200 else None,
                        "trend": "up" if last > (ema50[-1] if ema50 else last) else "down",
                    },
                }),
            }

        else:
            return {"statusCode": 400, "headers": cors_headers, "body": json.dumps({"error": "Unknown action"})}

    except Exception as e:
        return {"statusCode": 500, "headers": cors_headers, "body": json.dumps({"error": str(e)})}
