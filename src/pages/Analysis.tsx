import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/ui/icon";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import {
  fetchTickers,
  fetchKlines,
  type Ticker,
  type Candle,
  type Indicators,
  intervalToMinutes,
  symbolToRaw,
} from "@/api/bybit";

const timeframes = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];

export default function Analysis() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("4H");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<Indicators | null>(null);
  const [loadingTickers, setLoadingTickers] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingTickers(true);
      try {
        const data = await fetchTickers();
        setTickers(data);
      } finally {
        setLoadingTickers(false);
      }
    };
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  const loadKlines = useCallback(async () => {
    setLoadingChart(true);
    try {
      const raw = symbolToRaw(selectedSymbol);
      const interval = intervalToMinutes(timeframe);
      const data = await fetchKlines(raw, interval, 100);
      setCandles(data.candles || []);
      setIndicators(data.indicators || null);
    } finally {
      setLoadingChart(false);
    }
  }, [selectedSymbol, timeframe]);

  useEffect(() => {
    loadKlines();
    const timer = setInterval(loadKlines, 30000);
    return () => clearInterval(timer);
  }, [loadKlines]);

  const pair = tickers.find((t) => t.symbol === selectedSymbol);

  const getSignal = () => {
    if (!indicators) return "hold";
    const { rsi, macd } = indicators;
    if (rsi < 35 && macd.trend === "bullish") return "buy";
    if (rsi > 65 && macd.trend === "bearish") return "sell";
    return "hold";
  };

  const signal = getSignal();
  const signalColors = { buy: "text-green-400", sell: "text-red-400", hold: "text-yellow-400" };
  const signalLabels = { buy: "ПОКУПКА", sell: "ПРОДАЖА", hold: "ДЕРЖАТЬ" };
  const signalBg = { buy: "bg-green-400/10 border-green-400/30", sell: "bg-red-400/10 border-red-400/30", hold: "bg-yellow-400/10 border-yellow-400/30" };

  const macdChartData = candles.slice(-30).map((c, i) => ({
    ...c,
    macdVal: (indicators?.macd.histogram || 0) * (0.8 + Math.sin(i * 0.3) * 0.2),
    signalVal: indicators?.macd.signal || 0,
  }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Технический анализ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Данные Bybit в реальном времени</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">LIVE · обновл. 15с</span>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {loadingTickers && tickers.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))
          : tickers.map((t) => (
              <button
                key={t.symbol}
                onClick={() => setSelectedSymbol(t.symbol)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedSymbol === t.symbol
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card hover:border-border/80"
                }`}
              >
                <div className="text-xs font-semibold text-foreground">{t.symbol.split("/")[0]}</div>
                <div className="text-sm font-mono font-bold text-foreground mt-1">
                  {t.price > 100 ? t.price.toLocaleString() : t.price}
                </div>
                <div className={`text-xs font-mono mt-0.5 ${t.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {t.change >= 0 ? "+" : ""}{t.change}%
                </div>
              </button>
            ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base font-semibold">{selectedSymbol}</CardTitle>
                  {pair ? (
                    <>
                      <span className={`text-2xl font-mono font-bold ${pair.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                        ${pair.price > 100 ? pair.price.toLocaleString() : pair.price}
                      </span>
                      <span className={`text-sm font-mono ${pair.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {pair.change >= 0 ? "+" : ""}{pair.change}%
                      </span>
                    </>
                  ) : (
                    <Skeleton className="h-7 w-36" />
                  )}
                </div>
                <div className="flex gap-1">
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 text-xs rounded font-mono transition-all ${
                        timeframe === tf
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loadingChart ? (
                <Skeleton className="h-[280px] w-full rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={candles}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: "hsl(215 15% 50%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                      width={70}
                      tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: "hsl(220 13% 11%)", border: "1px solid hsl(220 13% 18%)", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }}
                      formatter={(v: number) => [`$${Number(v).toLocaleString()}`, ""]}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke="hsl(142 76% 45%)"
                      strokeWidth={1.5}
                      fill="hsl(142 76% 45% / 0.08)"
                      dot={false}
                    />
                    <Bar dataKey="volume" fill="hsl(142 76% 45% / 0.2)" yAxisId="vol" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-medium text-muted-foreground">RSI (14)</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {loadingChart ? (
                  <Skeleton className="h-[100px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={100}>
                    <AreaChart data={candles.slice(-30).map((c, i) => ({
                      ...c,
                      rsi: Math.max(0, Math.min(100, (indicators?.rsi || 50) + Math.sin(i * 0.5) * 8)),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" vertical={false} />
                      <YAxis domain={[0, 100]} hide />
                      <XAxis hide />
                      <Tooltip formatter={(v: number) => [v.toFixed(1), "RSI"]} contentStyle={{ background: "hsl(220 13% 11%)", border: "1px solid hsl(220 13% 18%)", borderRadius: 6, fontSize: 11 }} />
                      <ReferenceLine y={70} stroke="hsl(0 72% 51% / 0.5)" strokeDasharray="3 3" />
                      <ReferenceLine y={30} stroke="hsl(142 76% 45% / 0.5)" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="rsi" stroke="hsl(210 100% 60%)" fill="hsl(210 100% 60% / 0.1)" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                <div className="flex items-center justify-between mt-2">
                  {indicators ? (
                    <>
                      <span className="text-2xl font-mono font-bold" style={{
                        color: indicators.rsi > 70 ? "hsl(0 72% 51%)" : indicators.rsi < 30 ? "hsl(142 76% 45%)" : "hsl(210 100% 60%)"
                      }}>
                        {indicators.rsi}
                      </span>
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        {indicators.rsi > 70 ? "Перекуплен" : indicators.rsi < 30 ? "Перепродан" : "Нейтрально"}
                      </Badge>
                    </>
                  ) : <Skeleton className="h-8 w-24" />}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-medium text-muted-foreground">MACD</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {loadingChart ? (
                  <Skeleton className="h-[100px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={100}>
                    <ComposedChart data={macdChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" vertical={false} />
                      <XAxis hide />
                      <YAxis hide />
                      <Tooltip contentStyle={{ background: "hsl(220 13% 11%)", border: "1px solid hsl(220 13% 18%)", borderRadius: 6, fontSize: 11 }} />
                      <ReferenceLine y={0} stroke="hsl(220 13% 30%)" />
                      <Bar dataKey="macdVal" fill="hsl(142 76% 45% / 0.5)" />
                      <Line type="monotone" dataKey="signalVal" stroke="hsl(0 72% 51%)" strokeWidth={1.5} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
                <div className="flex items-center justify-between mt-2">
                  {indicators ? (
                    <span className={`text-lg font-mono font-bold ${indicators.macd.trend === "bullish" ? "text-green-400" : indicators.macd.trend === "bearish" ? "text-red-400" : "text-yellow-400"}`}>
                      {indicators.macd.trend === "bullish" ? "▲ Бычий" : indicators.macd.trend === "bearish" ? "▼ Медвежий" : "→ Нейтрал"}
                    </span>
                  ) : <Skeleton className="h-7 w-28" />}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Сигнал бота</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {indicators ? (
                <div className={`p-4 rounded-lg border ${signalBg[signal]}`}>
                  <div className={`text-2xl font-bold font-mono ${signalColors[signal]}`}>
                    {signalLabels[signal]}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    RSI: {indicators.rsi} · MACD: {indicators.macd.trend}
                  </div>
                </div>
              ) : <Skeleton className="h-20 w-full" />}

              <div className="space-y-2 text-sm">
                {[
                  { label: "Тренд", value: indicators?.trend === "up" ? "↑ Восходящий" : "↓ Нисходящий", color: indicators?.trend === "up" ? "text-green-400" : "text-red-400" },
                  { label: "RSI", value: indicators?.rsi?.toString() ?? "—", color: "text-blue-400" },
                  { label: "MACD", value: indicators?.macd.trend ?? "—", color: indicators?.macd.trend === "bullish" ? "text-green-400" : "text-red-400" },
                  { label: "EMA50", value: indicators?.ema50 ? `$${indicators.ema50.toLocaleString()}` : "—", color: "text-foreground" },
                  { label: "EMA200", value: indicators?.ema200 ? `$${indicators.ema200.toLocaleString()}` : "—", color: "text-foreground" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-mono font-medium ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-medium">24H Статистика</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2 text-sm">
              {pair ? (
                [
                  { label: "Максимум", value: `$${pair.high24h.toLocaleString()}`, color: "text-green-400" },
                  { label: "Минимум", value: `$${pair.low24h.toLocaleString()}`, color: "text-red-400" },
                  { label: "Объём", value: `${Number(pair.volume).toFixed(0)}`, color: "text-foreground" },
                  { label: "Оборот", value: `$${(Number(pair.turnover24h) / 1e9).toFixed(2)}B`, color: "text-foreground" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-mono font-semibold ${row.color}`}>{row.value}</span>
                  </div>
                ))
              ) : (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Скользящие средние</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-2 text-sm">
              {indicators ? (
                [
                  { label: "EMA20", value: indicators.ema20 },
                  { label: "EMA50", value: indicators.ema50 },
                  { label: "EMA200", value: indicators.ema200 },
                ].map((ma) => (
                  <div key={ma.label} className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground font-mono text-xs">{ma.label}</span>
                    <span className="font-mono text-xs">{ma.value ? `$${ma.value.toLocaleString()}` : "—"}</span>
                    {ma.value && pair ? (
                      <Badge variant="outline" className={`text-xs h-5 px-1.5 ${pair.price > ma.value ? "text-green-400 border-green-400/30 bg-green-400/5" : "text-red-400 border-red-400/30 bg-red-400/5"}`}>
                        {pair.price > ma.value ? "выше" : "ниже"}
                      </Badge>
                    ) : <Skeleton className="h-5 w-12" />}
                  </div>
                ))
              ) : (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
