"""
Bybit Hot Opportunities — сканер горячих монет.
Ищет монеты с аномальным ростом объёма и резкими движениями цены за последние часы.
"""
import json
import urllib.request
import urllib.parse

BYBIT_BASE = "https://api.bybit.com"


def bybit_request(path: str, params: dict = None) -> dict:
    if params is None:
        params = {}
    query_string = urllib.parse.urlencode(params)
    url = f"{BYBIT_BASE}{path}?{query_string}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def score_coin(t: dict) -> dict | None:
    try:
        symbol = t.get("symbol", "")
        if not symbol.endswith("USDT"):
            return None

        price = float(t.get("lastPrice", 0))
        if price <= 0:
            return None

        change_24h = float(t.get("price24hPcnt", 0)) * 100
        volume_24h = float(t.get("volume24h", 0))
        turnover_24h = float(t.get("turnover24h", 0))
        high_24h = float(t.get("highPrice24h", price))
        low_24h = float(t.get("lowPrice24h", price))

        if turnover_24h < 500_000:
            return None

        price_range = ((high_24h - low_24h) / low_24h * 100) if low_24h > 0 else 0

        score = 0
        reasons = []
        tags = []

        abs_change = abs(change_24h)
        if abs_change >= 20:
            score += 40
            reasons.append(f"цена {'выросла' if change_24h > 0 else 'упала'} на {abs_change:.1f}% за 24ч")
            tags.append("🚀 Резкое движение" if change_24h > 0 else "💥 Резкое падение")
        elif abs_change >= 10:
            score += 25
            reasons.append(f"сильное движение {abs_change:.1f}% за 24ч")
        elif abs_change >= 5:
            score += 10

        if price_range >= 30:
            score += 20
            reasons.append(f"диапазон цены {price_range:.1f}% — высокая волатильность")
            tags.append("⚡ Высокая волатильность")
        elif price_range >= 15:
            score += 10

        if turnover_24h >= 100_000_000:
            score += 20
            tags.append("🔥 Огромный объём")
        elif turnover_24h >= 20_000_000:
            score += 10
        elif turnover_24h >= 5_000_000:
            score += 5

        if abs_change >= 15 and turnover_24h >= 10_000_000:
            score += 15
            reasons.append("сильное движение подтверждено объёмом")
            tags.append("💎 Топ возможность")

        if score < 25:
            return None

        direction = "LONG" if change_24h > 0 else "SHORT"

        return {
            "symbol": symbol.replace("USDT", "/USDT"),
            "raw_symbol": symbol,
            "price": price,
            "change_24h": round(change_24h, 2),
            "volume_24h": round(volume_24h, 0),
            "turnover_24h": round(turnover_24h, 0),
            "price_range": round(price_range, 1),
            "score": score,
            "direction": direction,
            "reasons": reasons,
            "tags": tags[:2],
        }
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        data = bybit_request("/v5/market/tickers", {"category": "linear"})
        tickers = data.get("result", {}).get("list", [])

        hot = []
        for t in tickers:
            result = score_coin(t)
            if result:
                hot.append(result)

        hot.sort(key=lambda x: x["score"], reverse=True)
        top = hot[:20]

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({
                "hot": top,
                "total_scanned": len(tickers),
                "total_found": len(hot),
            }),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)}),
        }
