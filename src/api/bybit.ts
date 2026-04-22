const MARKET_URL = "https://functions.poehali.dev/73ae1155-af5b-4d58-8423-3716c440ca19";
const ACCOUNT_URL = "https://functions.poehali.dev/6cd02f46-638b-4425-b0f7-4116dad006f6";

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

export async function fetchTickers(): Promise<Ticker[]> {
  const res = await fetch(`${MARKET_URL}?action=tickers&symbols=${SYMBOLS}`);
  const data = await res.json();
  return data.data || [];
}

export async function fetchKlines(
  symbol: string,
  interval: string = "240",
  limit: number = 100
): Promise<{ candles: Candle[]; indicators: Indicators }> {
  const res = await fetch(
    `${MARKET_URL}?action=klines&symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  return res.json();
}

export async function fetchBalance(): Promise<Balance> {
  const res = await fetch(`${ACCOUNT_URL}?action=balance`);
  return res.json();
}

export async function fetchPositions(): Promise<Position[]> {
  const res = await fetch(`${ACCOUNT_URL}?action=positions`);
  const data = await res.json();
  return data.positions || [];
}

export async function fetchTradeHistory(limit: number = 20): Promise<Trade[]> {
  const res = await fetch(`${ACCOUNT_URL}?action=history&limit=${limit}`);
  const data = await res.json();
  return data.trades || [];
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
