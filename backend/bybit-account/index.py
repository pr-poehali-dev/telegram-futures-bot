"""
Bybit Account API
Возвращает баланс кошелька, открытые позиции и историю сделок.
"""
import json
import os
import time
import hashlib
import hmac
import urllib.request
import urllib.parse


BYBIT_BASE = "https://api.bybit.com"


def bybit_signed(path: str, params: dict) -> dict:
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
    query_string = urllib.parse.urlencode(params)
    url = f"{BYBIT_BASE}{path}?{query_string}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def handler(event: dict, context) -> dict:
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "balance")

    try:
        if action == "balance":
            data = bybit_signed("/v5/account/wallet-balance", {"accountType": "UNIFIED"})
            coins = data.get("result", {}).get("list", [{}])[0].get("coin", [])
            usdt = next((c for c in coins if c["coin"] == "USDT"), None)
            total_equity = float(data.get("result", {}).get("list", [{}])[0].get("totalEquity", 0))
            total_pnl = float(data.get("result", {}).get("list", [{}])[0].get("totalPerpUPL", 0))

            return {
                "statusCode": 200,
                "headers": cors_headers,
                "body": json.dumps({
                    "equity": round(total_equity, 2),
                    "unrealised_pnl": round(total_pnl, 2),
                    "usdt_balance": round(float(usdt.get("walletBalance", 0)) if usdt else 0, 2),
                    "usdt_available": round(float(usdt.get("availableToWithdraw", 0)) if usdt else 0, 2),
                }),
            }

        elif action == "positions":
            data = bybit_signed("/v5/position/list", {
                "category": "linear",
                "settleCoin": "USDT",
            })
            raw = data.get("result", {}).get("list", [])
            positions = []
            for p in raw:
                size = float(p.get("size", 0))
                if size == 0:
                    continue
                entry = float(p.get("avgPrice", 0))
                mark = float(p.get("markPrice", 0))
                pnl = float(p.get("unrealisedPnl", 0))
                sl = float(p.get("stopLoss", 0)) or None
                tp = float(p.get("takeProfit", 0)) or None
                leverage = int(float(p.get("leverage", 1)))
                positions.append({
                    "symbol": p.get("symbol", ""),
                    "side": "long" if p.get("side") == "Buy" else "short",
                    "size": size,
                    "entry": round(entry, 4 if entry < 1 else 2),
                    "current": round(mark, 4 if mark < 1 else 2),
                    "pnl": round(pnl, 2),
                    "pnl_percent": round((pnl / (entry * size / leverage)) * 100, 2) if entry and size else 0,
                    "sl": round(sl, 2) if sl else None,
                    "tp": round(tp, 2) if tp else None,
                    "leverage": leverage,
                    "margin": round(float(p.get("positionIM", 0)), 2),
                    "created_time": p.get("createdTime", ""),
                })
            return {"statusCode": 200, "headers": cors_headers, "body": json.dumps({"positions": positions})}

        elif action == "history":
            limit = int(params.get("limit", "20"))
            data = bybit_signed("/v5/execution/list", {
                "category": "linear",
                "limit": limit,
            })
            raw = data.get("result", {}).get("list", [])
            trades = []
            for t in raw:
                trades.append({
                    "symbol": t.get("symbol", ""),
                    "side": "long" if t.get("side") == "Buy" else "short",
                    "price": round(float(t.get("execPrice", 0)), 2),
                    "qty": float(t.get("execQty", 0)),
                    "pnl": round(float(t.get("closedPnl", 0)), 2),
                    "fee": round(float(t.get("execFee", 0)), 4),
                    "time": t.get("execTime", ""),
                    "order_type": t.get("orderType", ""),
                })
            return {"statusCode": 200, "headers": cors_headers, "body": json.dumps({"trades": trades})}

        else:
            return {"statusCode": 400, "headers": cors_headers, "body": json.dumps({"error": "Unknown action"})}

    except Exception as e:
        return {"statusCode": 500, "headers": cors_headers, "body": json.dumps({"error": str(e)})}
