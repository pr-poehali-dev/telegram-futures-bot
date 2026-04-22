import { useState } from "react";
import { pairs, candleData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";

const timeframes = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];

const signalColors = { buy: "text-green-400", sell: "text-red-400", hold: "text-yellow-400" };
const signalLabels = { buy: "ПОКУПКА", sell: "ПРОДАЖА", hold: "ДЕРЖАТЬ" };
const signalBg = { buy: "bg-green-400/10 border-green-400/30", sell: "bg-red-400/10 border-red-400/30", hold: "bg-yellow-400/10 border-yellow-400/30" };

export default function Analysis() {
  const [selectedPair, setSelectedPair] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("4H");

  const pair = pairs.find((p) => p.symbol === selectedPair) || pairs[0];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof candleData[0] }[] }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const isGreen = d.close >= d.open;
      return (
        <div className="bg-card border border-border rounded-lg p-3 text-xs space-y-1 shadow-xl">
          <div className={`font-mono font-semibold ${isGreen ? "text-green-400" : "text-red-400"}`}>
            O: {d.open} H: {d.high} L: {d.low} C: {d.close}
          </div>
          <div className="text-muted-foreground">Vol: {d.volume}M</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Технический анализ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Индикаторы и графики в реальном времени</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">LIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {pairs.map((p) => (
          <button
            key={p.symbol}
            onClick={() => setSelectedPair(p.symbol)}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedPair === p.symbol
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-card hover:border-border/80"
            }`}
          >
            <div className="text-xs font-semibold text-foreground">{p.symbol.split("/")[0]}</div>
            <div className="text-sm font-mono font-bold text-foreground mt-1">
              {p.price > 1000 ? p.price.toLocaleString() : p.price}
            </div>
            <div className={`text-xs font-mono mt-0.5 ${p.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {p.change >= 0 ? "+" : ""}{p.change}%
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
                  <CardTitle className="text-base font-semibold">{pair.symbol}</CardTitle>
                  <span className={`text-2xl font-mono font-bold ${pair.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                    ${pair.price > 1000 ? pair.price.toLocaleString() : pair.price}
                  </span>
                  <span className={`text-sm font-mono ${pair.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {pair.change >= 0 ? "+" : ""}{pair.change}%
                  </span>
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
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={candleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: "hsl(215 15% 50%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                    width={65}
                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
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
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-medium text-muted-foreground">RSI (14)</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={candleData.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" vertical={false} />
                    <YAxis domain={[0, 100]} hide />
                    <XAxis hide />
                    <Tooltip formatter={(v: number) => [v.toFixed(1), "RSI"]} contentStyle={{ background: "hsl(220 13% 11%)", border: "1px solid hsl(220 13% 18%)", borderRadius: 6, fontSize: 11 }} />
                    <ReferenceLine y={70} stroke="hsl(0 72% 51% / 0.5)" strokeDasharray="3 3" />
                    <ReferenceLine y={30} stroke="hsl(142 76% 45% / 0.5)" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="rsi" stroke="hsl(210 100% 60%)" fill="hsl(210 100% 60% / 0.1)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-2xl font-mono font-bold" style={{ color: pair.rsi > 70 ? "hsl(0 72% 51%)" : pair.rsi < 30 ? "hsl(142 76% 45%)" : "hsl(210 100% 60%)" }}>
                    {pair.rsi}
                  </span>
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                    {pair.rsi > 70 ? "Перекуплен" : pair.rsi < 30 ? "Перепродан" : "Нейтрально"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-medium text-muted-foreground">MACD</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <ResponsiveContainer width="100%" height={100}>
                  <ComposedChart data={candleData.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" vertical={false} />
                    <XAxis hide />
                    <YAxis hide />
                    <Tooltip formatter={(v: number) => [v.toFixed(1), ""]} contentStyle={{ background: "hsl(220 13% 11%)", border: "1px solid hsl(220 13% 18%)", borderRadius: 6, fontSize: 11 }} />
                    <ReferenceLine y={0} stroke="hsl(220 13% 30%)" />
                    <Bar dataKey="macd" fill="hsl(142 76% 45% / 0.5)" />
                    <Line type="monotone" dataKey="signal" stroke="hsl(0 72% 51%)" strokeWidth={1.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-lg font-mono font-bold ${pair.macd === "bullish" ? "text-green-400" : pair.macd === "bearish" ? "text-red-400" : "text-yellow-400"}`}>
                    {pair.macd === "bullish" ? "▲ Бычий" : pair.macd === "bearish" ? "▼ Медвежий" : "→ Нейтрал"}
                  </span>
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
              <div className={`p-4 rounded-lg border ${signalBg[pair.signal as keyof typeof signalBg]}`}>
                <div className={`text-2xl font-bold font-mono ${signalColors[pair.signal as keyof typeof signalColors]}`}>
                  {signalLabels[pair.signal as keyof typeof signalLabels]}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Уверенность: 78%</div>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  { label: "Тренд", value: pair.trend === "up" ? "↑ Восходящий" : "↓ Нисходящий", color: pair.trend === "up" ? "text-green-400" : "text-red-400" },
                  { label: "Объём", value: pair.volume, color: "text-foreground" },
                  { label: "RSI", value: pair.rsi.toString(), color: "text-blue-400" },
                  { label: "MACD", value: pair.macd, color: pair.macd === "bullish" ? "text-green-400" : "text-red-400" },
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
              <CardTitle className="text-sm font-medium">Уровни поддержки/сопротивления</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {[
                { label: "R3", value: "$70,500", type: "res" },
                { label: "R2", value: "$69,200", type: "res" },
                { label: "R1", value: "$68,100", type: "res" },
                { label: "◆ Текущая", value: `$${pair.price.toLocaleString()}`, type: "current" },
                { label: "S1", value: "$66,400", type: "sup" },
                { label: "S2", value: "$64,800", type: "sup" },
                { label: "S3", value: "$62,000", type: "sup" },
              ].map((level) => (
                <div key={level.label} className={`flex justify-between text-sm py-1 ${level.type === "current" ? "font-semibold text-primary" : ""}`}>
                  <span className={level.type === "res" ? "text-red-400/70" : level.type === "sup" ? "text-green-400/70" : "text-primary"}>
                    {level.label}
                  </span>
                  <span className="font-mono">{level.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Индикаторы MA</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-2 text-sm">
              {[
                { label: "MA20", value: "$66,812", signal: "above" },
                { label: "MA50", value: "$64,240", signal: "above" },
                { label: "MA100", value: "$61,540", signal: "above" },
                { label: "MA200", value: "$55,300", signal: "above" },
              ].map((ma) => (
                <div key={ma.label} className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-mono text-xs">{ma.label}</span>
                  <span className="font-mono text-xs">{ma.value}</span>
                  <Badge variant="outline" className="text-xs h-5 px-1.5 text-green-400 border-green-400/30 bg-green-400/5">
                    выше
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
