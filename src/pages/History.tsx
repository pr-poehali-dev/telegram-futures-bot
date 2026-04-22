import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/ui/icon";
import { fetchTradeHistory, type Trade } from "@/api/bybit";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

export default function History() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTradeHistory(50);
        setTrades(data);
      } catch {
        setError("Не удалось загрузить историю. Проверьте API ключи.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const closedTrades = trades.filter((t) => t.pnl !== 0);
  const wins = closedTrades.filter((t) => t.pnl > 0).length;
  const losses = closedTrades.filter((t) => t.pnl < 0).length;
  const totalPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
  const winRate = closedTrades.length > 0 ? ((wins / closedTrades.length) * 100).toFixed(0) : "—";

  const chartData = closedTrades.slice(-15).map((t, i) => ({
    name: t.symbol.replace("USDT", ""),
    pnl: t.pnl,
    i,
  }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">История сделок</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Последние исполненные ордера с Bybit</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-400/30 bg-red-400/5 text-sm text-red-400">
          <Icon name="AlertTriangle" size={14} className="inline mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Всего сделок", value: trades.length.toString(), icon: "Clock", color: "text-foreground" },
          { label: "Общий PnL", value: `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)} USDT`, icon: "DollarSign", color: totalPnl >= 0 ? "text-green-400" : "text-red-400" },
          { label: "Винрейт", value: `${winRate}%`, icon: "Target", color: "text-primary" },
          { label: "Прибыльных / убыточных", value: `${wins} / ${losses}`, icon: "BarChart2", color: "text-foreground" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <Icon name={stat.icon} size={14} className="text-muted-foreground" />
              </div>
              {loading ? <Skeleton className="h-7 w-24" /> : (
                <div className={`text-xl font-mono font-bold ${stat.color}`}>{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          {chartData.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-medium">PnL по сделкам</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "hsl(215 15% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215 15% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(220 13% 11%)", border: "1px solid hsl(220 13% 18%)", borderRadius: 6, fontSize: 11 }}
                      formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(2)} USDT`, "PnL"]}
                    />
                    <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? "hsl(142 76% 45%)" : "hsl(0 72% 51%)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Исполненные ордера</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2" />)
              ) : trades.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <Icon name="Clock" size={32} className="mx-auto mb-2 opacity-30" />
                  История пуста — добавьте API ключи с правами на чтение сделок
                </div>
              ) : (
                <div className="space-y-0">
                  {trades.map((trade, idx) => (
                    <div key={idx} className={`flex items-center gap-3 py-3 text-sm ${idx < trades.length - 1 ? "border-b border-border/50" : ""}`}>
                      <div className={`w-14 text-center px-2 py-0.5 rounded text-xs font-mono font-semibold flex-shrink-0 ${trade.side === "long" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                        {trade.side === "long" ? "BUY" : "SELL"}
                      </div>
                      <div className="w-24 font-semibold text-foreground flex-shrink-0">{trade.symbol.replace("USDT", "/USDT")}</div>
                      <div className="flex-1 text-xs text-muted-foreground font-mono">
                        {trade.order_type} · {trade.qty} @ ${trade.price.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {trade.time ? new Date(Number(trade.time)).toLocaleDateString("ru") : "—"}
                      </div>
                      {trade.pnl !== 0 ? (
                        <div className={`w-28 text-right font-mono font-semibold text-sm flex-shrink-0 ${trade.pnl > 0 ? "text-green-400" : "text-red-400"}`}>
                          {trade.pnl > 0 ? "+" : ""}{trade.pnl.toFixed(2)} USDT
                        </div>
                      ) : (
                        <div className="w-28 text-right text-muted-foreground text-xs font-mono flex-shrink-0">открытие</div>
                      )}
                      <div className="text-xs text-muted-foreground font-mono flex-shrink-0">
                        fee: {trade.fee}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Статистика</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              ) : (
                [
                  { label: "Всего ордеров", value: trades.length.toString() },
                  { label: "Закрытых позиций", value: closedTrades.length.toString() },
                  { label: "Прибыльных", value: `${wins}`, color: "text-green-400" },
                  { label: "Убыточных", value: `${losses}`, color: "text-red-400" },
                  { label: "Общий PnL", value: `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? "text-green-400" : "text-red-400" },
                  { label: "Винрейт", value: `${winRate}%`, color: "text-primary" },
                ].map((stat) => (
                  <div key={stat.label} className="flex justify-between py-1.5 border-b border-border/40 text-sm">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className={`font-mono font-semibold ${stat.color || "text-foreground"}`}>{stat.value}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Топ пары</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2" />)
              ) : (
                <div className="space-y-2">
                  {Object.entries(
                    trades.reduce<Record<string, number>>((acc, t) => {
                      const sym = t.symbol;
                      acc[sym] = (acc[sym] || 0) + t.pnl;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                    .slice(0, 5)
                    .map(([sym, pnl]) => (
                      <div key={sym} className="flex items-center justify-between text-sm py-1">
                        <div className="font-medium text-foreground">{sym.replace("USDT", "/USDT")}</div>
                        <span className={`font-mono font-semibold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  {trades.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-3">Нет данных</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
