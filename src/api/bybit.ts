const MARKET_URL = "https://functions.poehali.dev/73ae1155-af5b-4d58-8423-3716c440ca19";
const ACCOUNT_URL = "https://functions.poehali.dev/6cd02f46-638b-4425-b0f7-4116dad006f6";
const SIGNALS_URL = "https://functions.poehali.dev/d0ba7b55-3eab-4ac3-81db-27c02cff8a79";

export interface Ticker {
  symbol: string;
  raw_symbol: string;
  price: number;
  change: number;
  volume: string;
  high24h: number;
  low24h: number;
  turnover24h: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Indicators {
  rsi: number;
  macd: { macd: number; signal: number; histogram: number; trend: string };
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  trend: string;
}

export interface Position {
  symbol: string;
  side: "long" | "short";
  size: number;
  entry: number;
  current: number;
  pnl: number;
  pnl_percent: number;
  sl: number | null;
  tp: number | null;
  leverage: number;
  margin: number;
  created_time: string;
}

export interface Balance {
  equity: number;
  unrealised_pnl: number;
  usdt_balance: number;
  usdt_available: number;
}

export interface Trade {
  symbol: string;
  side: "long" | "short";
  price: number;
  qty: number;
  pnl: number;
  fee: number;
  time: string;
  order_type: string;
}

const SYMBOLS = "BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,XRPUSDT,ADAUSDT";

async function apiFetch(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchTickers(): Promise<Ticker[]> {
  try {
    const data = await apiFetch(`${MARKET_URL}?action=tickers&symbols=${SYMBOLS}`);
    return data.data || [];
  } catch {
    return [];
  }
}

export async function fetchKlines(
  symbol: string,
  interval: string = "240",
  limit: number = 100
): Promise<{ candles: Candle[]; indicators: Indicators | null }> {
  try {
    return await apiFetch(`${MARKET_URL}?action=klines&symbol=${symbol}&interval=${interval}&limit=${limit}`);
  } catch {
    return { candles: [], indicators: null };
  }
}

export async function fetchBalance(): Promise<Balance | null> {
  try {
    return await apiFetch(`${ACCOUNT_URL}?action=balance`);
  } catch {
    return null;
  }
}

export async function fetchPositions(): Promise<Position[]> {
  try {
    const data = await apiFetch(`${ACCOUNT_URL}?action=positions`);
    return data.positions || [];
  } catch {
    return [];
  }
}

export async function fetchTradeHistory(limit: number = 20): Promise<Trade[]> {
  try {
    const data = await apiFetch(`${ACCOUNT_URL}?action=history&limit=${limit}`);
    return data.trades || [];
  } catch {
    return [];
  }
}

export interface Signal {
  id: number;
  symbol: string;
  raw_symbol: string;
  type: "buy" | "sell";
  timeframe: string;
  entry: number;
  tp1: number;
  tp2: number;
  sl: number;
  riskLevel: "low" | "medium" | "high";
  rr: string;
  confidence: number;
  reason: string;
  rsi: number;
  macd_trend: string;
  ema50: number;
  time: number;
  status: "active" | "pending" | "closed";
}

export async function fetchSignals(interval: string = "240"): Promise<Signal[]> {
  try {
    const data = await apiFetch(`${SIGNALS_URL}?interval=${interval}`);
    return data.signals || [];
  } catch {
    return [];
  }
}

export function intervalToMinutes(tf: string): string {
  const map: Record<string, string> = {
    "1m": "1", "5m": "5", "15m": "15", "1H": "60", "4H": "240", "1D": "D", "1W": "W",
  };
  return map[tf] || "240";
}

export function symbolToRaw(symbol: string): string {
  return symbol.replace("/", "");
}