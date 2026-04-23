import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/ui/icon";
import { checkTelegramStatus, sendTestMessage } from "@/api/telegram";
import { fetchSignals, fetchPositions, type Signal, type Position } from "@/api/bybit";

interface Alert {
  id: string;
  type: "signal" | "risk" | "tp" | "info";
  symbol: string;
  message: string;
  time: number;
  read: boolean;
  priority: "critical" | "high" | "medium" | "low";
}

const priorityConfig = {
  critical: { bg: "border-red-400/40 bg-red-400/5", badge: "text-red-400 border-red-400/30 bg-red-400/10", label: "Критично", icon: "AlertTriangle" },
  high: { bg: "border-orange-400/40 bg-orange-400/5", badge: "text-orange-400 border-orange-400/30 bg-orange-400/10", label: "Высокий", icon: "Zap" },
  medium: { bg: "border-yellow-400/30 bg-card", badge: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", label: "Средний", icon: "Info" },
  low: { bg: "border-border bg-card", badge: "text-muted-foreground border-border", label: "Низкий", icon: "Bell" },
};

const typeIcons = { signal: "Zap", risk: "AlertTriangle", tp: "Target", info: "Info" };
const typeLabels = { signal: "Сигнал", risk: "Риск", tp: "Take Profit", info: "Информация" };

function formatTime(ts: number): string {
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return "только что";
  if (diff < 60) return `${diff} мин назад`;
  return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

function signalsToAlerts(signals: Signal[]): Alert[] {
  return signals.map((s) => ({
    id: `signal-${s.symbol}-${s.time}`,
    type: "signal" as const,
    symbol: s.symbol,
    message: `${s.type === "buy" ? "▲ Сигнал LONG" : "▼ Сигнал SHORT"} · Вход $${s.entry > 100 ? s.entry.toLocaleString() : s.entry} · TP1 $${s.tp1 > 100 ? s.tp1.toLocaleString() : s.tp1} · RSI ${s.rsi} · ${s.reason}`,
    time: s.time,
    read: false,
    priority: s.confidence >= 85 ? "high" : s.confidence >= 70 ? "medium" : "low" as Alert["priority"],
  }));
}

function positionsToAlerts(positions: Position[]): Alert[] {
  const alerts: Alert[] = [];
  for (const p of positions) {
    if (p.sl && p.current) {
      const dist = p.side === "long"
        ? ((p.current - p.sl) / p.current) * 100
        : ((p.sl - p.current) / p.current) * 100;
      if (dist < 2) {
        alerts.push({
          id: `risk-${p.symbol}-sl`,
          type: "risk",
          symbol: p.symbol.replace("USDT", "/USDT"),
          message: `Цена в ${dist.toFixed(1)}% от стоп-лосса $${p.sl}! Текущая цена: $${p.current}`,
          time: Date.now(),
          read: false,
          priority: "critical",
        });
      } else if (dist < 5) {
        alerts.push({
          id: `risk-warn-${p.symbol}`,
          type: "risk",
          symbol: p.symbol.replace("USDT", "/USDT"),
          message: `Цена приближается к стоп-лоссу $${p.sl} (${dist.toFixed(1)}% до SL)`,
          time: Date.now(),
          read: false,
          priority: "high",
        });
      }
    }
    if (p.tp && p.current) {
      const dist = p.side === "long"
        ? ((p.tp - p.current) / p.current) * 100
        : ((p.current - p.tp) / p.current) * 100;
      if (dist < 1) {
        alerts.push({
          id: `tp-${p.symbol}`,
          type: "tp",
          symbol: p.symbol.replace("USDT", "/USDT"),
          message: `Цена в ${dist.toFixed(1)}% от Take Profit $${p.tp}! PnL: +$${p.pnl.toFixed(2)}`,
          time: Date.now(),
          read: false,
          priority: "high",
        });
      }
    }
    if (p.pnl < -100) {
      alerts.push({
        id: `loss-${p.symbol}`,
        type: "risk",
        symbol: p.symbol.replace("USDT", "/USDT"),
        message: `Большой убыток по позиции: ${p.pnl.toFixed(2)} USDT (${p.pnl_percent.toFixed(1)}%)`,
        time: Date.now(),
        read: false,
        priority: "critical",
      });
    }
  }
  return alerts;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifySettings, setNotifySettings] = useState({
    telegram: true, email: false, browser: true,
    signals: true, risks: true, tp: true, info: false,
  });
  const [tgStatus, setTgStatus] = useState<{ ok: boolean; bot?: string; error?: string } | null>(null);
  const [tgLoading, setTgLoading] = useState(true);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    checkTelegramStatus().then((s) => { setTgStatus(s); setTgLoading(false); });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [signals, positions] = await Promise.all([fetchSignals("240"), fetchPositions()]);
        const sigAlerts = signalsToAlerts(signals);
        const posAlerts = positionsToAlerts(positions);
        const all = [...posAlerts, ...sigAlerts].sort((a, b) => {
          const prio = { critical: 0, high: 1, medium: 2, low: 3 };
          return prio[a.priority] - prio[b.priority];
        });
        setAlerts(all);
      } finally {
        setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleTest = async () => {
    setTestSending(true);
    setTestResult(null);
    const res = await sendTestMessage();
    setTestResult(res.ok ? "success" : "error");
    setTestSending(false);
    setTimeout(() => setTestResult(null), 4000);
  };

  const unread = alerts.filter((a) => !a.read).length;
  const markAllRead = () => setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  const markRead = (id: string) => setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Оповещения</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Реальные события по рынку и позициям</p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <Badge className="bg-primary/20 text-primary border border-primary/30 font-mono">
              {unread} новых
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={markAllRead}
            className="text-xs border-border text-muted-foreground h-7">
            Прочитать все
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <div className="md:col-span-2 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
          ) : alerts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="Bell" size={40} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm font-medium">Нет активных оповещений</div>
              <div className="text-xs mt-1 opacity-60">Сигналы и риски появятся здесь автоматически</div>
            </div>
          ) : (
            alerts.map((alert) => {
              const config = priorityConfig[alert.priority];
              const icon = typeIcons[alert.type];
              return (
                <Card key={alert.id}
                  className={`border transition-all cursor-pointer ${config.bg} ${!alert.read ? "ring-1 ring-primary/10" : "opacity-70"}`}
                  onClick={() => markRead(alert.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-0.5 ${alert.priority === "critical" ? "bg-red-400/20" : alert.priority === "high" ? "bg-orange-400/20" : "bg-secondary"}`}>
                        <Icon name={icon} size={14} className={config.badge.split(" ")[0]} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono font-semibold text-sm text-foreground">{alert.symbol}</span>
                          <Badge variant="outline" className={`text-xs border h-5 px-1.5 ${config.badge}`}>
                            {config.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs border border-border text-muted-foreground h-5 px-1.5">
                            {typeLabels[alert.type]}
                          </Badge>
                          {!alert.read && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />}
                        </div>
                        <p className="text-sm text-foreground/90">{alert.message}</p>
                        <div className="text-xs text-muted-foreground font-mono mt-1">{formatTime(alert.time)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Telegram бот</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div className={`p-3 rounded-lg border flex items-center gap-3 ${tgLoading ? "border-border" : tgStatus?.ok ? "border-green-400/30 bg-green-400/5" : "border-red-400/30 bg-red-400/5"}`}>
                {tgLoading ? <Skeleton className="h-8 w-full" /> : (
                  <>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tgStatus?.ok ? "bg-green-400" : "bg-red-400"}`} />
                    <div className="min-w-0">
                      <div className={`text-sm font-medium ${tgStatus?.ok ? "text-green-400" : "text-red-400"}`}>
                        {tgStatus?.ok ? "Подключён" : "Не настроен"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {tgStatus?.bot ? `@${tgStatus.bot}` : tgStatus?.error || "Добавьте токен бота"}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Button onClick={handleTest} disabled={testSending || !tgStatus?.ok} size="sm"
                className="w-full h-8 text-xs"
                variant={testResult === "success" ? "default" : testResult === "error" ? "destructive" : "outline"}>
                {testSending ? <><Icon name="Loader" size={12} className="mr-1.5 animate-spin" />Отправка...</>
                  : testResult === "success" ? <><Icon name="Check" size={12} className="mr-1.5" />Отправлено!</>
                    : testResult === "error" ? <><Icon name="X" size={12} className="mr-1.5" />Ошибка</>
                      : <><Icon name="Send" size={12} className="mr-1.5" />Отправить тест</>}
              </Button>
              <div className="text-xs text-muted-foreground leading-relaxed">
                {tgStatus?.ok
                  ? "Бот активен. Новые сигналы и риски по позициям отправляются автоматически."
                  : "Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID для активации."}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Каналы уведомлений</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {[
                { key: "telegram", label: "Telegram", icon: "Send", desc: tgStatus?.ok ? `@${tgStatus.bot}` : "Не настроен" },
                { key: "browser", label: "Браузер", icon: "Monitor", desc: "Push-уведомления" },
              ].map((ch) => (
                <div key={ch.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name={ch.icon} size={14} className="text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{ch.label}</div>
                      <div className="text-xs text-muted-foreground">{ch.desc}</div>
                    </div>
                  </div>
                  <Switch checked={notifySettings[ch.key as keyof typeof notifySettings] as boolean}
                    onCheckedChange={(v) => setNotifySettings((prev) => ({ ...prev, [ch.key]: v }))} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Типы событий</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {[
                { key: "signals", label: "Торговые сигналы", icon: "Zap" },
                { key: "risks", label: "Риски и SL", icon: "AlertTriangle" },
                { key: "tp", label: "Take Profit", icon: "Target" },
                { key: "info", label: "Информационные", icon: "Info" },
              ].map((ev) => (
                <div key={ev.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name={ev.icon} size={14} className="text-muted-foreground" />
                    <Label className="text-sm cursor-pointer">{ev.label}</Label>
                  </div>
                  <Switch checked={notifySettings[ev.key as keyof typeof notifySettings] as boolean}
                    onCheckedChange={(v) => setNotifySettings((prev) => ({ ...prev, [ev.key]: v }))} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Статистика</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2 text-sm">
              {[
                { label: "Всего алертов", value: alerts.length.toString() },
                { label: "Непрочитанных", value: unread.toString() },
                { label: "Сигналов", value: alerts.filter((a) => a.type === "signal").length.toString() },
                { label: "Рисков", value: alerts.filter((a) => a.type === "risk").length.toString() },
              ].map((s) => (
                <div key={s.label} className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-mono text-foreground">{s.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
