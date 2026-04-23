import { useState, useEffect } from "react";
import { alerts } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/ui/icon";
import { checkTelegramStatus, sendTestMessage } from "@/api/telegram";

const priorityConfig = {
  critical: { bg: "border-red-400/40 bg-red-400/5", badge: "text-red-400 border-red-400/30 bg-red-400/10", label: "Критично", icon: "AlertTriangle" },
  high: { bg: "border-orange-400/40 bg-orange-400/5", badge: "text-orange-400 border-orange-400/30 bg-orange-400/10", label: "Высокий", icon: "Zap" },
  medium: { bg: "border-yellow-400/30 bg-card", badge: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", label: "Средний", icon: "Info" },
  low: { bg: "border-border bg-card", badge: "text-muted-foreground border-border", label: "Низкий", icon: "Bell" },
};

const typeIcons = { signal: "Zap", risk: "AlertTriangle", tp: "Target", info: "Info" };
const typeLabels = { signal: "Сигнал", risk: "Риск", tp: "Take Profit", info: "Информация" };

export default function Alerts() {
  const [localAlerts, setLocalAlerts] = useState(alerts);
  const [notifySettings, setNotifySettings] = useState({
    telegram: true,
    email: false,
    browser: true,
    signals: true,
    risks: true,
    tp: true,
    info: false,
  });

  const [tgStatus, setTgStatus] = useState<{ ok: boolean; bot?: string; error?: string } | null>(null);
  const [tgLoading, setTgLoading] = useState(true);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    checkTelegramStatus().then((s) => {
      setTgStatus(s);
      setTgLoading(false);
    });
  }, []);

  const handleTest = async () => {
    setTestSending(true);
    setTestResult(null);
    const res = await sendTestMessage();
    setTestResult(res.ok ? "success" : "error");
    setTestSending(false);
    setTimeout(() => setTestResult(null), 4000);
  };

  const unread = localAlerts.filter((a) => !a.read).length;
  const markAllRead = () => setLocalAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  const markRead = (id: number) => setLocalAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Оповещения</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Уведомления о торговых возможностях и рисках</p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <Badge className="bg-primary/20 text-primary border border-primary/30 font-mono">
              {unread} непрочитанных
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={markAllRead} className="text-xs border-border text-muted-foreground h-7">
            Отметить все
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-3">
          {localAlerts.map((alert) => {
            const config = priorityConfig[alert.priority as keyof typeof priorityConfig];
            const icon = typeIcons[alert.type as keyof typeof typeIcons];
            return (
              <Card
                key={alert.id}
                className={`border transition-all cursor-pointer ${config.bg} ${!alert.read ? "ring-1 ring-primary/10" : "opacity-70"}`}
                onClick={() => markRead(alert.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 ${alert.priority === "critical" ? "bg-red-400/20" : alert.priority === "high" ? "bg-orange-400/20" : "bg-secondary"}`}>
                      <Icon name={icon} size={14} className={config.badge.split(" ")[0]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold text-sm text-foreground">{alert.symbol}</span>
                        <Badge variant="outline" className={`text-xs border h-5 px-1.5 ${config.badge}`}>
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs border border-border text-muted-foreground h-5 px-1.5">
                          {typeLabels[alert.type as keyof typeof typeLabels]}
                        </Badge>
                        {!alert.read && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />}
                      </div>
                      <p className="text-sm text-foreground/90">{alert.message}</p>
                      <div className="text-xs text-muted-foreground font-mono mt-1">{alert.time}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Telegram бот</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div className={`p-3 rounded-lg border flex items-center gap-3 ${tgLoading ? "border-border" : tgStatus?.ok ? "border-green-400/30 bg-green-400/5" : "border-red-400/30 bg-red-400/5"}`}>
                {tgLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tgStatus?.ok ? "bg-green-400" : "bg-red-400"}`} />
                    <div className="min-w-0">
                      <div className={`text-sm font-medium ${tgStatus?.ok ? "text-green-400" : "text-red-400"}`}>
                        {tgStatus?.ok ? "Подключён" : "Не настроен"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {tgStatus?.bot ? tgStatus.bot : tgStatus?.error || "Добавьте токен бота"}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Button
                onClick={handleTest}
                disabled={testSending || !tgStatus?.ok}
                size="sm"
                className="w-full h-8 text-xs"
                variant={testResult === "success" ? "default" : testResult === "error" ? "destructive" : "outline"}
              >
                {testSending ? (
                  <><Icon name="Loader" size={12} className="mr-1.5 animate-spin" />Отправка...</>
                ) : testResult === "success" ? (
                  <><Icon name="Check" size={12} className="mr-1.5" />Отправлено!</>
                ) : testResult === "error" ? (
                  <><Icon name="X" size={12} className="mr-1.5" />Ошибка отправки</>
                ) : (
                  <><Icon name="Send" size={12} className="mr-1.5" />Отправить тест</>
                )}
              </Button>

              <div className="text-xs text-muted-foreground leading-relaxed">
                {tgStatus?.ok
                  ? "Бот активен. Сигналы BUY/SELL будут приходить автоматически при изменении RSI/MACD."
                  : "Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в настройки проекта для активации."}
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
                { key: "email", label: "Email", icon: "Mail", desc: "На почту" },
                { key: "browser", label: "Браузер", icon: "Monitor", desc: "Push-уведомления" },
              ].map((channel) => (
                <div key={channel.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name={channel.icon} size={14} className="text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{channel.label}</div>
                      <div className="text-xs text-muted-foreground">{channel.desc}</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifySettings[channel.key as keyof typeof notifySettings] as boolean}
                    onCheckedChange={(v) => setNotifySettings((prev) => ({ ...prev, [channel.key]: v }))}
                  />
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
              ].map((event) => (
                <div key={event.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name={event.icon} size={14} className="text-muted-foreground" />
                    <Label className="text-sm cursor-pointer">{event.label}</Label>
                  </div>
                  <Switch
                    checked={notifySettings[event.key as keyof typeof notifySettings] as boolean}
                    onCheckedChange={(v) => setNotifySettings((prev) => ({ ...prev, [event.key]: v }))}
                  />
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
                { label: "Сегодня", value: `${localAlerts.length} уведомлений` },
                { label: "Непрочитанных", value: `${unread}` },
                { label: "Сигналов", value: `${localAlerts.filter(a => a.type === "signal").length}` },
                { label: "Рисков", value: `${localAlerts.filter(a => a.type === "risk").length}` },
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
