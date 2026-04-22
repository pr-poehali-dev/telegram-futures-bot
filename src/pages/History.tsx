import { history } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line,
} from "recharts";

const equityData = [
  { day: "1 апр", equity: 10000 },
  { day: "5 апр", equity: 10450 },
  { day: "8 апр", equity: 10220 },
  { day: "11 апр", equity: 11120 },
  { day: "14 апр", equity: 11390 },
  { day: "17 апр", equity: 11660 },
  { day: "22 апр", equity: 12115 },
];

export default function History() {
  const wins = history.filter((h) => h.pnl > 0).length;
  const losses = history.filter((h) => h.pnl < 0).length;
  const totalPnl = history.reduce((acc, h) => acc + h.pnl, 0);
  const winRate = ((wins / history.length) * 100).toFixed(0);
  const avgWin = history.filter((h) => h.pnl > 0).reduce((acc, h) => acc + h.pnlPercent, 0) / wins;
  const avgLoss = history.filter((h) => h.pnl < 0).reduce((acc, h) => acc + Math.abs(h.pnlPercent), 0) / losses;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">История сделок</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Статистика и анализ закрытых позиций</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Общая прибыль", value: `+$${totalPnl.toFixed(0)}`, color: "text-green-400", icon: "DollarSign" },
          { label: "Винрейт", value: `${winRate}%`, color: "text-primary", icon: "Target" },
          { label: "Средний профит", value: `+${avgWin.toFixed(1)}%`, color: "text-green-400", icon: "TrendingUp" },
          { label: "Средний убыток", value: `-${avgLoss.toFixed(1)}%`, color: "text-red-400", icon: "TrendingDown" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <Icon name={stat.icon} size={14} className="text-muted-foreground" />
              </div>
              <div className={`text-xl font-mono font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Кривая доходности</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={equityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "hsl(215 15% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 15% 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} width={70} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220 13% 11%)", border: "1px solid hsl(220 13% 18%)", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Баланс"]}
                  />
                  <Line type="monotone" dataKey="equity" stroke="hsl(142 76% 45%)" strokeWidth={2} dot={{ fill: "hsl(142 76% 45%)", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">P&L по сделкам</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" vertical={false} />
                  <XAxis dataKey="symbol" tick={{ fill: "hsl(215 15% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 15% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220 13% 11%)", border: "1px solid hsl(220 13% 18%)", borderRadius: 6, fontSize: 11 }}
                    formatter={(v: number) => [`$${v}`, "P&L"]}
                  />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                    {history.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? "hsl(142 76% 45%)" : "hsl(0 72% 51%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Все сделки</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-2">
              <div className="space-y-0">
                {history.map((trade, idx) => (
                  <div key={trade.id} className={`flex items-center gap-4 py-3 text-sm ${idx < history.length - 1 ? "border-b border-border/50" : ""}`}>
                    <div className={`w-16 text-center px-2 py-0.5 rounded text-xs font-mono font-semibold ${trade.side === "long" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                      {trade.side === "long" ? "LONG" : "SHORT"}
                    </div>
                    <div className="w-28 font-semibold text-foreground">{trade.symbol}</div>
                    <div className="flex-1 text-xs text-muted-foreground font-mono">
                      ${trade.entry} → ${trade.exit}
                    </div>
                    <div className="text-xs text-muted-foreground">{trade.duration}</div>
                    <div className="text-xs text-muted-foreground">{trade.openTime}</div>
                    <div className={`w-24 text-right font-mono font-semibold text-sm ${trade.pnl > 0 ? "text-green-400" : "text-red-400"}`}>
                      {trade.pnl > 0 ? "+" : ""}{trade.pnl} USDT
                    </div>
                    <div className={`w-16 text-right text-xs font-mono ${trade.pnl > 0 ? "text-green-400" : "text-red-400"}`}>
                      {trade.pnlPercent > 0 ? "+" : ""}{trade.pnlPercent}%
                    </div>
                    <Badge variant="outline" className={`text-xs border h-5 px-1.5 ${trade.mode === "auto" ? "border-primary/30 text-primary" : "border-border text-muted-foreground"}`}>
                      {trade.mode === "auto" ? "авто" : "ручн."}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Статистика</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {[
                { label: "Всего сделок", value: history.length.toString() },
                { label: "Прибыльных", value: `${wins} (${winRate}%)`, color: "text-green-400" },
                { label: "Убыточных", value: `${losses} (${(100 - +winRate)}%)`, color: "text-red-400" },
                { label: "Лучшая сделка", value: "+15.52%", color: "text-green-400" },
                { label: "Худшая сделка", value: "-3.74%", color: "text-red-400" },
                { label: "Profit Factor", value: "3.21", color: "text-primary" },
                { label: "Max Drawdown", value: "-3.74%", color: "text-red-400" },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between py-1.5 border-b border-border/40 text-sm">
                  <span className="text-muted-foreground">{stat.label}</span>
                  <span className={`font-mono font-semibold ${stat.color || "text-foreground"}`}>{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-medium">По парам</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {[
                { symbol: "BTC/USDT", trades: 2, pnl: "+$3,570", color: "text-green-400" },
                { symbol: "ETH/USDT", trades: 1, pnl: "+$270", color: "text-green-400" },
                { symbol: "SOL/USDT", trades: 1, pnl: "+$170", color: "text-green-400" },
                { symbol: "XRP/USDT", trades: 1, pnl: "+$90", color: "text-green-400" },
                { symbol: "BNB/USDT", trades: 1, pnl: "-$230", color: "text-red-400" },
              ].map((item) => (
                <div key={item.symbol} className="flex items-center justify-between text-sm py-1">
                  <div>
                    <div className="font-medium text-foreground">{item.symbol}</div>
                    <div className="text-xs text-muted-foreground">{item.trades} сделок</div>
                  </div>
                  <span className={`font-mono font-semibold ${item.color}`}>{item.pnl}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
