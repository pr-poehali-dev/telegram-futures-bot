const NOTIFY_URL = "https://functions.poehali.dev/c24d31ba-1cf3-410d-89dd-55e6aec3f3c6";

export async function checkTelegramStatus(): Promise<{ ok: boolean; bot?: string; error?: string }> {
  try {
    const res = await fetch(`${NOTIFY_URL}?action=status`);
    return res.json();
  } catch {
    return { ok: false, error: "Сервер недоступен" };
  }
}

export async function sendTestMessage(): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${NOTIFY_URL}?action=test`);
    return res.json();
  } catch {
    return { ok: false };
  }
}

export async function sendSignalNotification(data: {
  symbol: string;
  signal: "buy" | "sell" | "hold";
  price: number;
  rsi: number;
  macd_trend: string;
  timeframe: string;
  ema50?: number | null;
  trend?: string;
}): Promise<void> {
  try {
    await fetch(NOTIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "signal", ...data }),
    });
  } catch {
    // silent
  }
}
