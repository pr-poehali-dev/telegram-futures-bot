import { positions } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/ui/icon";

export default function Positions() {
  const totalPnl = positions.reduce((acc, p) => acc + p.pnl, 0);
  const totalMargin = positions.reduce((acc, p) => acc + p.margin, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Активные позиции</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Мониторинг открытых сделок и прибыли</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">LIVE P&L</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Общая прибыль",
            value: `+$${totalPnl.toFixed(2)}`,
            sub: "+4.42%",
            positive: true,
            icon: "TrendingUp",
          },
          {
            label: "Открытых позиций",
            value: positions.length.toString(),
            sub: "активных",
            positive: true,
            icon: "Layers",
          },
          {
            label: "Задействовано маржи",
            value: `$${totalMargin.toLocaleString()}`,
            sub: "по всем позициям",
            positive: null,
            icon: "DollarSign",
          },
          {
            label: "Средн. плечо",
            value: `${(positions.reduce((a, p) => a + p.leverage, 0) / positions.length).toFixed(1)}x`,
            sub: "leverage",
            positive: null,
            icon: "Activity",
          },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <Icon name={stat.icon} size={14} className="text-muted-foreground" />
              </div>
              <div className={`text-xl font-mono font-bold ${stat.positive === true ? "text-green-400" : stat.positive === false ? "text-red-400" : "text-foreground"}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 font-mono">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {positions.map((pos) => {
          const priceRange = Math.abs(pos.tp - pos.sl);
          const currentProgress = ((pos.current - pos.sl) / priceRange) * 100;
          const isProfit = pos.pnl > 0;
          const distToSl = (Math.abs(pos.current - pos.sl) / pos.current * 100).toFixed(2);
          const distToTp = (Math.abs(pos.tp - pos.current) / pos.current * 100).toFixed(2);

          return (
            <Card key={pos.id} className={`bg-card border ${isProfit ? "border-green-400/20" : "border-red-400/20"}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${pos.side === "long" ? "bg-green-400/10 border-green-400/30 text-green-400" : "bg-red-400/10 border-red-400/30 text-red-400"}`}>
                      {pos.side === "long" ? "▲ LONG" : "▼ SHORT"}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-lg">{pos.symbol}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        Открыто: {pos.openTime} · {pos.leverage}x · {pos.mode === "auto" ? "🤖 Авто" : "🔔 Уведомления"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-mono font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
                      {isProfit ? "+" : ""}{pos.pnl.toFixed(2)} USDT
                    </div>
                    <div className={`text-sm font-mono ${isProfit ? "text-green-400" : "text-red-400"}`}>
                      {isProfit ? "+" : ""}{pos.pnlPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Размер</div>
                    <div className="font-mono font-semibold text-foreground">{pos.size} {pos.symbol.split("/")[0]}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Вход</div>
                    <div className="font-mono font-semibold text-foreground">${pos.entry.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Текущая</div>
                    <div className={`font-mono font-semibold ${isProfit ? "text-green-400" : "text-red-400"}`}>${pos.current.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Маржа</div>
                    <div className="font-mono font-semibold text-foreground">${pos.margin}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Плечо</div>
                    <div className="font-mono font-semibold text-yellow-400">{pos.leverage}x</div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-400 font-mono">SL ${pos.sl.toLocaleString()} (-{distToSl}%)</span>
                    <span className="text-muted-foreground">Позиция цены</span>
                    <span className="text-green-400 font-mono">TP ${pos.tp.toLocaleString()} (+{distToTp}%)</span>
                  </div>
                  <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${isProfit ? "bg-green-400" : "bg-red-400"}`}
                      style={{ width: `${Math.min(Math.max(currentProgress, 2), 98)}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-white/50"
                      style={{ left: `${Math.min(Math.max(currentProgress, 2), 98)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs border-border text-muted-foreground">
                      <Icon name="Edit2" size={11} className="mr-1" />
                      Изм. SL/TP
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-border text-muted-foreground">
                      <Icon name="Shield" size={11} className="mr-1" />
                      Безубыток
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-red-400/30 text-red-400 hover:bg-red-400/10">
                    <Icon name="X" size={11} className="mr-1" />
                    Закрыть
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {positions.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="Layers" size={40} className="mx-auto mb-3 opacity-30" />
          <div>Нет активных позиций</div>
        </div>
      )}
    </div>
  );
}
