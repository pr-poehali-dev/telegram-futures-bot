import { useState } from "react";
import { alerts } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

const priorityConfig = {
  critical: { bg: "border-red-400/40 bg-red-400/5", badge: "text-red-400 border-red-400/30 bg-red-400/10", label: "Критично", icon: "AlertTriangle" },
  high: { bg: "border-orange-400/40 bg-orange-400/5", badge: "text-orange-400 border-orange-400/30 bg-orange-400/10", label: "Высокий", icon: "Zap" },
  medium: { bg: "border-yellow-400/30 bg-card", badge: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", label: "Средний", icon: "Info" },
  low: { bg: "border-border bg-card", badge: "text-muted-foreground border-border", label: "Низкий", icon: "Bell" },
};

const typeIcons = {
  signal: "Zap",
  risk: "AlertTriangle",
  tp: "Target",
  info: "Info",
};

const typeLabels = {
  signal: "Сигнал",
  risk: "Риск",
  tp: "Take Profit",
  info: "Информация",
};

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

  const unread = localAlerts.filter((a) => !a.read).length;

  const markAllRead = () => {
    setLocalAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const markRead = (id: number) => {
    setLocalAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));
  };

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
                        {!alert.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />
                        )}
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
              <CardTitle className="text-sm font-medium">Каналы уведомлений</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {[
                { key: "telegram", label: "Telegram", icon: "Send", desc: "Мгновенные сообщения" },
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
                { label: "Сегодня", value: "12 уведомлений" },
                { label: "За неделю", value: "84 уведомлений" },
                { label: "Сигналов", value: "23" },
                { label: "Рисков", value: "8" },
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
