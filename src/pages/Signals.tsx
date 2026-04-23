import { useState } from "react";
import { signals } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/ui/icon";

const riskColors = {
  low: { bg: "bg-green-400/10 border-green-400/30", text: "text-green-400", label: "Низкий" },
  medium: { bg: "bg-yellow-400/10 border-yellow-400/30", text: "text-yellow-400", label: "Средний" },
  high: { bg: "bg-red-400/10 border-red-400/30", text: "text-red-400", label: "Высокий" },
};

const statusColors = {
  active: "text-green-400 bg-green-400/10 border-green-400/30",
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  closed: "text-muted-foreground bg-secondary border-border",
};

const statusLabels = { active: "Активный", pending: "Ожидание", closed: "Закрыт" };

export default function Signals() {
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");
  const [modeFilter, setModeFilter] = useState<"all" | "auto" | "notify">("all");
  const [notifyEnabled, setNotifyEnabled] = useState<Record<number, boolean>>({});
  const [autoEnabled, setAutoEnabled] = useState<Record<number, boolean>>({});

  const filtered = signals.filter((s) => {
    if (filter !== "all" && s.type !== filter) return false;
    return true;
  });

  const stats = {
    total: signals.length,
    active: signals.filter((s) => s.status === "active").length,
    buy: signals.filter((s) => s.type === "buy").length,
    sell: signals.filter((s) => s.type === "sell").length,
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Торговые сигналы</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Сигналы входа и выхода с управлением риском</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">Обновлено 14:32</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Всего сигналов", value: stats.total, icon: "Zap", color: "text-blue-400" },
          { label: "Активных", value: stats.active, icon: "Activity", color: "text-green-400" },
          { label: "На покупку", value: stats.buy, icon: "TrendingUp", color: "text-green-400" },
          { label: "На продажу", value: stats.sell, icon: "TrendingDown", color: "text-red-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                <Icon name={stat.icon} size={16} />
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Тип:</span>
        {(["all", "buy", "sell"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={`text-xs h-7 ${filter === f ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
          >
            {f === "all" ? "Все" : f === "buy" ? "Покупка" : "Продажа"}
          </Button>
        ))}
        <span className="text-sm text-muted-foreground ml-3">Режим:</span>
        {(["all", "auto", "notify"] as const).map((f) => (
          <Button
            key={f}
            variant={modeFilter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setModeFilter(f)}
            className={`text-xs h-7 ${modeFilter === f ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
          >
            {f === "all" ? "Все" : f === "auto" ? "Автоордер" : "Уведомления"}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((signal) => {
          const risk = riskColors[signal.riskLevel as keyof typeof riskColors];
          const sl_dist = signal.type === "buy"
            ? (((signal.entry - signal.sl) / signal.entry) * 100).toFixed(1)
            : (((signal.sl - signal.entry) / signal.entry) * 100).toFixed(1);
          const tp_dist = signal.type === "buy"
            ? (((signal.tp1 - signal.entry) / signal.entry) * 100).toFixed(1)
            : (((signal.entry - signal.tp1) / signal.entry) * 100).toFixed(1);

          return (
            <Card key={signal.id} className={`bg-card border ${signal.status === "active" ? "border-primary/20" : "border-border"}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${signal.type === "buy" ? "bg-green-400/10 border-green-400/30 text-green-400" : "bg-red-400/10 border-red-400/30 text-red-400"}`}>
                      {signal.type === "buy" ? "▲ LONG" : "▼ SHORT"}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{signal.symbol}</div>
                      <div className="text-xs text-muted-foreground font-mono">{signal.timeframe} · {signal.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs border ${risk.bg} ${risk.text}`}>
                      Риск: {risk.label}
                    </Badge>
                    <Badge variant="outline" className={`text-xs border ${statusColors[signal.status as keyof typeof statusColors]}`}>
                      {statusLabels[signal.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Вход</div>
                    <div className="font-mono font-semibold text-foreground">${signal.entry.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">TP1 (+{tp_dist}%)</div>
                    <div className="font-mono font-semibold text-green-400">${signal.tp1.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">TP2</div>
                    <div className="font-mono font-semibold text-green-400">${signal.tp2.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">SL (-{sl_dist}%)</div>
                    <div className="font-mono font-semibold text-red-400">${signal.sl.toLocaleString()}</div>
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="BarChart2" size={12} />
                    <span>R/R: <span className="font-mono text-primary">{signal.rr}</span></span>
                  </div>
                  <div className="flex gap-2">
                    {signal.status !== "closed" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNotifyEnabled((prev) => ({ ...prev, [signal.id]: !prev[signal.id] }))}
                          className={`h-7 text-xs transition-all ${notifyEnabled[signal.id] ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                        >
                          <Icon name={notifyEnabled[signal.id] ? "BellRing" : "Bell"} size={12} className="mr-1" />
                          {notifyEnabled[signal.id] ? "Уведомления вкл" : "Уведомить"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setAutoEnabled((prev) => ({ ...prev, [signal.id]: !prev[signal.id] }))}
                          className={`h-7 text-xs transition-all ${autoEnabled[signal.id] ? "bg-green-500 hover:bg-green-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}
                        >
                          <Icon name={autoEnabled[signal.id] ? "CheckCircle" : "Zap"} size={12} className="mr-1" />
                          {autoEnabled[signal.id] ? "Авто-ордер вкл" : "Авто-ордер"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}