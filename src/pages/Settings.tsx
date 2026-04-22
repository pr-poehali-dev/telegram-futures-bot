import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

export default function Settings() {
  const [apiConnected, setApiConnected] = useState(true);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [macdFast, setMacdFast] = useState(12);
  const [macdSlow, setMacdSlow] = useState(26);
  const [macdSignal, setMacdSignal] = useState(9);
  const [maxRisk, setMaxRisk] = useState([2]);
  const [maxPositions, setMaxPositions] = useState([5]);
  const [defaultLeverage, setDefaultLeverage] = useState("3");
  const [autoTrade, setAutoTrade] = useState(false);
  const [autoSl, setAutoSl] = useState(true);
  const [autoTp, setAutoTp] = useState(true);
  const [trailingStop, setTrailingStop] = useState(false);
  const [pairs, setPairs] = useState(["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"]);
  const [apiKey, setApiKey] = useState("••••••••••••••••••••••••••••••••");
  const [apiSecret, setApiSecret] = useState("••••••••••••••••••••••••••••••••");

  const removePair = (pair: string) => {
    setPairs((prev) => prev.filter((p) => p !== pair));
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Настройки</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Параметры индикаторов, рисков и подключения</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <div className="flex items-center gap-2">
                <Icon name="Link2" size={14} className="text-primary" />
                <CardTitle className="text-sm font-medium">Bybit API</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-400/5 border border-green-400/20">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-400">Подключено · Mainnet</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">API Key</Label>
                <div className="relative">
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-secondary border-border font-mono text-xs pr-8"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <Icon name="Eye" size={13} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">API Secret</Label>
                <div className="relative">
                  <Input
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="bg-secondary border-border font-mono text-xs pr-8"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <Icon name="Eye" size={13} />
                  </button>
                </div>
              </div>
              <Button className="w-full h-8 text-xs" variant="outline">
                <Icon name="RefreshCw" size={12} className="mr-1" />
                Переподключить
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <div className="flex items-center gap-2">
                <Icon name="BarChart2" size={14} className="text-primary" />
                <CardTitle className="text-sm font-medium">Отслеживаемые пары</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="flex flex-wrap gap-2">
                {pairs.map((pair) => (
                  <Badge key={pair} variant="outline" className="border-border text-foreground gap-1.5 pl-2 pr-1.5 py-1">
                    {pair}
                    <button onClick={() => removePair(pair)} className="text-muted-foreground hover:text-red-400 transition-colors">
                      <Icon name="X" size={10} />
                    </button>
                  </Badge>
                ))}
              </div>
              <Select>
                <SelectTrigger className="h-8 text-xs bg-secondary border-border">
                  <SelectValue placeholder="+ Добавить пару" />
                </SelectTrigger>
                <SelectContent>
                  {["XRP/USDT", "ADA/USDT", "DOGE/USDT", "AVAX/USDT", "DOT/USDT"].map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <div className="flex items-center gap-2">
                <Icon name="Activity" size={14} className="text-primary" />
                <CardTitle className="text-sm font-medium">Параметры индикаторов</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">RSI Период</Label>
                  <span className="text-xs font-mono text-primary">{rsiPeriod}</span>
                </div>
                <Slider value={[rsiPeriod]} onValueChange={(v) => setRsiPeriod(v[0])} min={5} max={30} step={1} className="my-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5</span><span>30</span>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 space-y-3">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">MACD</div>
                {[
                  { label: "Быстрая EMA", value: macdFast, set: setMacdFast, min: 3, max: 30 },
                  { label: "Медленная EMA", value: macdSlow, set: setMacdSlow, min: 10, max: 60 },
                  { label: "Сигнальная линия", value: macdSignal, set: setMacdSignal, min: 3, max: 20 },
                ].map((param) => (
                  <div key={param.label}>
                    <div className="flex justify-between mb-1.5">
                      <Label className="text-xs text-muted-foreground">{param.label}</Label>
                      <span className="text-xs font-mono text-primary">{param.value}</span>
                    </div>
                    <Slider value={[param.value]} onValueChange={(v) => param.set(v[0])} min={param.min} max={param.max} step={1} />
                  </div>
                ))}
              </div>

              <div className="border-t border-border/50 pt-4 space-y-2">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Скользящие средние</div>
                {[
                  { label: "MA Fast", value: "20", timeframe: "4H" },
                  { label: "MA Mid", value: "50", timeframe: "4H" },
                  { label: "MA Slow", value: "200", timeframe: "1D" },
                ].map((ma) => (
                  <div key={ma.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{ma.label}</span>
                    <div className="flex gap-2">
                      <Input defaultValue={ma.value} className="h-6 w-16 text-xs text-center bg-secondary border-border font-mono p-1" />
                      <Select defaultValue={ma.timeframe}>
                        <SelectTrigger className="h-6 w-14 text-xs bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["1H", "4H", "1D"].map((tf) => (
                            <SelectItem key={tf} value={tf} className="text-xs">{tf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <div className="flex items-center gap-2">
                <Icon name="Shield" size={14} className="text-primary" />
                <CardTitle className="text-sm font-medium">Управление рисками</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Макс. риск на сделку</Label>
                  <span className="text-xs font-mono text-red-400">{maxRisk[0]}%</span>
                </div>
                <Slider value={maxRisk} onValueChange={setMaxRisk} min={0.5} max={10} step={0.5} className="my-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5%</span><span>10%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Макс. открытых позиций</Label>
                  <span className="text-xs font-mono text-primary">{maxPositions[0]}</span>
                </div>
                <Slider value={maxPositions} onValueChange={setMaxPositions} min={1} max={10} step={1} className="my-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span><span>10</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Плечо по умолчанию</Label>
                <Select value={defaultLeverage} onValueChange={setDefaultLeverage}>
                  <SelectTrigger className="h-8 text-xs bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["1", "2", "3", "5", "10", "20"].map((l) => (
                      <SelectItem key={l} value={l} className="text-xs">{l}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <div className="flex items-center gap-2">
                <Icon name="Zap" size={14} className="text-primary" />
                <CardTitle className="text-sm font-medium">Режим торговли</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {[
                { key: "autoTrade", value: autoTrade, set: setAutoTrade, label: "Авто-ордера", desc: "Размещение ордеров по сигналам", danger: true },
                { key: "autoSl", value: autoSl, set: setAutoSl, label: "Авто стоп-лосс", desc: "Автоматически ставить SL" },
                { key: "autoTp", value: autoTp, set: setAutoTp, label: "Авто тейк-профит", desc: "Автоматически ставить TP" },
                { key: "trailingStop", value: trailingStop, set: setTrailingStop, label: "Трейлинг-стоп", desc: "Скользящий стоп-лосс" },
              ].map((setting) => (
                <div key={setting.key} className={`flex items-start justify-between gap-3 ${setting.danger && autoTrade ? "p-3 rounded-lg bg-primary/5 border border-primary/20" : ""}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{setting.label}</span>
                      {setting.danger && <Badge variant="outline" className="text-xs h-4 px-1 border-primary/30 text-primary">pro</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{setting.desc}</div>
                  </div>
                  <Switch checked={setting.value} onCheckedChange={setting.set} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Icon name="Save" size={14} className="mr-2" />
            Сохранить настройки
          </Button>
        </div>
      </div>
    </div>
  );
}
