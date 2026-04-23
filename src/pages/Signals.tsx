import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/ui/icon";
import { fetchSignals, type Signal } from "@/api/bybit";
import { sendSignalNotification } from "@/api/telegram";

const riskColors = {
  low: { bg: "bg-green-400/10 border-green-400/30", text: "text-green-400", label: "Низкий" },
  medium: { bg: "bg-yellow-400/10 border-yellow-400/30", text: "text-yellow-400", label: "Средний" },
  high: { bg: "bg-red-400/10 border-red-400/30", text: "text-red-400", label: "Высокий" },
};

const TIMEFRAMES = [
  { label: "15М", value: "15" },
  { label: "1Ч", value: "60" },
  { label: "4Ч", value: "240" },
  { label: "1Д", value: "D" },
];

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return "только что";
  if (diff < 60) return `${diff} мин назад`;
  if (diff < 1440) return `${Math.floor(diff / 60)}ч ${diff % 60}м назад`;
  return d.toLocaleDateString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Signals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");
  const [timeframe, setTimeframe] = useState("240");
  const [notifyEnabled, setNotifyEnabled] = useState<Record<number, boolean>>({});
  const [autoEnabled, setAutoEnabled] = useState<Record<number, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const prevSignalsRef = useRef<string[]>([]);

  const loadSignals = async () => {
    setLoading(true);
    try {
      const data = await fetchSignals(timeframe);
      setSignals(data);
      setLastUpdated(new Date());

      // Авто-уведомление при появлении нового сигнала
      const newKeys = data.map((s) => `${s.symbol}-${s.type}`);
      const prev = prevSignalsRef.current;
      for (const sig of data) {
        const key = `${sig.symbol}-${sig.type}`;
        if (!prev.includes(key)) {
          sendSignalNotification({
            symbol: sig.symbol,
            signal: sig.type,
            price: sig.entry,
            rsi: sig.rsi,
            macd_trend: sig.macd_trend,
            timeframe: sig.timeframe,
            ema50: sig.ema50,
          });
        }
      }
      prevSignalsRef.current = newKeys;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignals();
    const timer = setInterval(loadSignals, 60000);
    return () => clearInterval(timer);
  }, [timeframe]);

  const toggleNotify = (signal: Signal) => {
    const isEnabled = !notifyEnabled[signal.id];
    setNotifyEnabled((prev) => ({ ...prev, [signal.id]: isEnabled }));
    if (isEnabled) {
      sendSignalNotification({
        symbol: signal.symbol,
        signal: signal.type,
        price: signal.entry,
        rsi: signal.rsi,
        macd_trend: signal.macd_trend,
        timeframe: signal.timeframe,
        ema50: signal.ema50,
      });
    }
  };

  const filtered = signals.filter((s) => filter === "all" || s.type === filter);

  const stats = {
    total: signals.length,
    buy: signals.filter((s) => s.type === "buy").length,
    sell: signals.filter((s) => s.type === "sell").length,
    avgConf: signals.length > 0 ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length) : 0,
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Торговые сигналы</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Реальный анализ RSI · MACD · EMA</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">
            {lastUpdated ? `обновл. ${lastUpdated.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}` : "загрузка..."}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[
          { label: "Найдено сигналов", value: stats.total, icon: "Zap", color: "text-blue-400" },
          { label: "На покупку", value: stats.buy, icon: "TrendingUp", color: "text-green-400" },
          { label: "На продажу", value: stats.sell, icon: "TrendingDown", color: "text-red-400" },
          { label: "Средняя уверенность", value: `${stats.avgConf}%`, icon: "Target", color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                <Icon name={stat.icon} size={16} />
              </div>
              <div>
                {loading ? <Skeleton className="h-7 w-10 mb-1" /> : (
                  <div className="text-xl md:text-2xl font-mono font-bold text-foreground">{stat.value}</div>
                )}
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Тип:</span>
        {(["all", "buy", "sell"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm"
            onClick={() => setFilter(f)}
            className={`text-xs h-7 ${filter === f ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
            {f === "all" ? "Все" : f === "buy" ? "Покупка" : "Продажа"}
          </Button>
        ))}
        <span className="text-sm text-muted-foreground ml-2">Таймфрейм:</span>
        {TIMEFRAMES.map((tf) => (
          <Button key={tf.value} variant={timeframe === tf.value ? "default" : "outline"} size="sm"
            onClick={() => setTimeframe(tf.value)}
            className={`text-xs h-7 font-mono ${timeframe === tf.value ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
            {tf.label}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={loadSignals} disabled={loading}
          className="text-xs h-7 border-border text-muted-foreground ml-auto">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={12} className={`mr-1 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="Search" size={40} className="mx-auto mb-3 opacity-30" />
            <div className="text-sm font-medium">Сигналов не найдено</div>
            <div className="text-xs mt-1 opacity-60">На текущем таймфрейме условия RSI/MACD не выполнены</div>
          </div>
        ) : (
          filtered.map((signal) => {
            const risk = riskColors[signal.riskLevel];
            const sl_dist = signal.type === "buy"
              ? (((signal.entry - signal.sl) / signal.entry) * 100).toFixed(1)
              : (((signal.sl - signal.entry) / signal.entry) * 100).toFixed(1);
            const tp_dist = signal.type === "buy"
              ? (((signal.tp1 - signal.entry) / signal.entry) * 100).toFixed(1)
              : (((signal.entry - signal.tp1) / signal.entry) * 100).toFixed(1);

            return (
              <Card key={`${signal.symbol}-${signal.type}-${signal.time}`}
                className="bg-card border border-primary/20">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${signal.type === "buy" ? "bg-green-400/10 border-green-400/30 text-green-400" : "bg-red-400/10 border-red-400/30 text-red-400"}`}>
                        {signal.type === "buy" ? "▲ LONG" : "▼ SHORT"}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{signal.symbol}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {signal.timeframe} · {formatTime(signal.time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Badge variant="outline" className={`text-xs border ${risk.bg} ${risk.text}`}>
                        Риск: {risk.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs border border-green-400/30 text-green-400 bg-green-400/10">
                        Активный
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Вход</div>
                      <div className="font-mono font-semibold text-foreground">
                        ${signal.entry > 100 ? signal.entry.toLocaleString() : signal.entry}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">TP1 (+{tp_dist}%)</div>
                      <div className="font-mono font-semibold text-green-400">
                        ${signal.tp1 > 100 ? signal.tp1.toLocaleString() : signal.tp1}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">TP2</div>
                      <div className="font-mono font-semibold text-green-400">
                        ${signal.tp2 > 100 ? signal.tp2.toLocaleString() : signal.tp2}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">SL (-{sl_dist}%)</div>
                      <div className="font-mono font-semibold text-red-400">
                        ${signal.sl > 100 ? signal.sl.toLocaleString() : signal.sl}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded bg-secondary/50">
                      <div className="text-muted-foreground mb-0.5">RSI</div>
                      <div className={`font-mono font-bold ${signal.rsi < 35 ? "text-green-400" : signal.rsi > 65 ? "text-red-400" : "text-blue-400"}`}>
                        {signal.rsi}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-secondary/50">
                      <div className="text-muted-foreground mb-0.5">MACD</div>
                      <div className={`font-mono font-bold ${signal.macd_trend === "bullish" ? "text-green-400" : signal.macd_trend === "bearish" ? "text-red-400" : "text-yellow-400"}`}>
                        {signal.macd_trend === "bullish" ? "▲ бычий" : signal.macd_trend === "bearish" ? "▼ медвежий" : "нейтрал"}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-secondary/50">
                      <div className="text-muted-foreground mb-0.5">R/R</div>
                      <div className="font-mono font-bold text-primary">{signal.rr}</div>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">Уверенность алгоритма</div>
                    <Progress value={signal.confidence} className="h-1.5 mb-1" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{signal.reason}</span>
                      <span className="font-mono font-semibold text-primary">{signal.confidence}%</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground font-mono">
                      EMA50: <span className="text-foreground">${signal.ema50.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm"
                        onClick={() => toggleNotify(signal)}
                        className={`h-7 text-xs transition-all ${notifyEnabled[signal.id] ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                        <Icon name={notifyEnabled[signal.id] ? "BellRing" : "Bell"} size={12} className="mr-1" />
                        {notifyEnabled[signal.id] ? "Вкл" : "Уведомить"}
                      </Button>
                      <Button size="sm"
                        onClick={() => setAutoEnabled((prev) => ({ ...prev, [signal.id]: !prev[signal.id] }))}
                        className={`h-7 text-xs transition-all ${autoEnabled[signal.id] ? "bg-green-500 hover:bg-green-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}>
                        <Icon name={autoEnabled[signal.id] ? "CheckCircle" : "Zap"} size={12} className="mr-1" />
                        {autoEnabled[signal.id] ? "Авто вкл" : "Авто-ордер"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
