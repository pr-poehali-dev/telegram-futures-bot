"""
Telegram Notify — отправка уведомлений о торговых сигналах в Telegram.
Поддерживает: отправку сигнала, тест-сообщение, проверку статуса бота.
"""
import json
import os
import urllib.request
import urllib.parse


def tg_request(method: str, payload: dict) -> dict:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def send_message(chat_id: str, text: str, parse_mode: str = "HTML") -> dict:
    return tg_request("sendMessage", {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
        "disable_web_page_preview": True,
    })


def format_signal(data: dict) -> str:
    symbol = data.get("symbol", "?")
    signal = data.get("signal", "hold").upper()
    price = data.get("price", 0)
    rsi = data.get("rsi", "—")
    macd = data.get("macd_trend", "—")
    timeframe = data.get("timeframe", "4H")
    ema50 = data.get("ema50")
    trend = data.get("trend", "—")

    emoji = {"BUY": "🟢", "SELL": "🔴", "HOLD": "🟡"}.get(signal, "⚪")
    signal_ru = {"BUY": "ПОКУПКА", "SELL": "ПРОДАЖА", "HOLD": "ДЕРЖАТЬ"}.get(signal, signal)

    lines = [
        f"{emoji} <b>TradeBot · {signal_ru}</b>",
        f"",
        f"<b>Пара:</b> {symbol}",
        f"<b>Цена:</b> ${price:,.2f}" if isinstance(price, (int, float)) else f"<b>Цена:</b> {price}",
        f"<b>Таймфрейм:</b> {timeframe}",
        f"",
        f"<b>Индикаторы:</b>",
        f"  RSI: {rsi}",
        f"  MACD: {macd}",
        f"  Тренд: {'↑ восходящий' if trend == 'up' else '↓ нисходящий'}",
    ]
    if ema50:
        lines.append(f"  EMA50: ${ema50:,.2f}" if isinstance(ema50, (int, float)) else f"  EMA50: {ema50}")

    return "\n".join(lines)


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")

    if not token or not chat_id:
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"ok": False, "error": "TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не настроены"}),
        }

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "send")

    if method == "GET" and action == "status":
        result = tg_request("getMe", {})
        bot_name = result.get("result", {}).get("username", "неизвестно")
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"ok": result.get("ok", False), "bot": f"@{bot_name}"}),
        }

    if method == "GET" and action == "test":
        result = send_message(chat_id, (
            "✅ <b>TradeBot подключён!</b>\n\n"
            "Уведомления о торговых сигналах настроены и работают.\n"
            "Бот будет присылать сигналы BUY/SELL в реальном времени."
        ))
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"ok": result.get("ok", False)}),
        }

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        signal_type = body.get("type", "signal")

        if signal_type == "signal":
            text = format_signal(body)
        else:
            text = body.get("text", "Уведомление от TradeBot")

        result = send_message(chat_id, text)
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"ok": result.get("ok", False)}),
        }

    return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Unknown request"})}
