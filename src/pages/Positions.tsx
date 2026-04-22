import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/ui/icon";
import { fetchPositions, fetchBalance, type Position, type Balance } from "@/api/bybit";

export default function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pos, bal] = await Promise.all([fetchPositions(), fetchBalance()]);
        setPositions(pos);
        setBalance(bal);
      } catch {
        setError("Не удалось загрузить данные. Проверьте API ключи в настройках.");
      } finally {
        setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  const totalPnl = positions.reduce((acc, p) => acc + p.pnl, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Активные позиции</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Данные с вашего Bybit аккаунта</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">LIVE · 10с</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-400/30 bg-red-400/5 text-sm text-red-400">
          <Icon name="AlertTriangle" size={14} className="inline mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {loading && !balance ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          <>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Баланс (Equity)</span>
                  <Icon name="DollarSign" size={14} className="text-muted-foreground" />
                </div>
                <div className="text-xl font-mono font-bold text-foreground">${balance?.equity.toLocaleString() ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">USDT</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Незакрытый PnL</span>
                  <Icon name="TrendingUp" size={14} className="text-muted-foreground" />
                </div>
                <div className={`text-xl font-mono font-bold ${(balance?.unrealised_pnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {(balance?.unrealised_pnl ?? 0) >= 0 ? "+" : ""}{balance?.unrealised_pnl ?? "—"} USDT
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">нереализованный</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Доступно</span>
                  <Icon name="Wallet" size={14} className="text-muted-foreground" />
                </div>
                <div className="text-xl font-mono font-bold text-foreground">${balance?.usdt_available.toLocaleString() ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">USDT</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Открытых позиций</span>
                  <Icon name="Layers" size={14} className="text-muted-foreground" />
                </div>
                <div className="text-xl font-mono font-bold text-foreground">{positions.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">активных</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)
        ) : positions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="Layers" size={40} className="mx-auto mb-3 opacity-30" />
            <div className="text-sm">Нет открытых позиций</div>
            <div className="text-xs mt-1 opacity-60">Позиции появятся здесь после открытия на Bybit</div>
          </div>
        ) : (
          positions.map((pos) => {
            const isProfit = pos.pnl >= 0;
            const distToSl = pos.sl ? (Math.abs(pos.current - pos.sl) / pos.current * 100).toFixed(2) : null;
            const distToTp = pos.tp ? (Math.abs(pos.tp - pos.current) / pos.current * 100).toFixed(2) : null;
            const priceRange = pos.sl && pos.tp ? Math.abs(pos.tp - pos.sl) : 0;
            const currentProgress = priceRange > 0 && pos.sl
              ? ((pos.current - pos.sl) / priceRange) * 100
              : 50;

            return (
              <Card key={`${pos.symbol}-${pos.side}`} className={`bg-card border ${isProfit ? "border-green-400/20" : "border-red-400/20"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${pos.side === "long" ? "bg-green-400/10 border-green-400/30 text-green-400" : "bg-red-400/10 border-red-400/30 text-red-400"}`}>
                        {pos.side === "long" ? "▲ LONG" : "▼ SHORT"}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-lg">{pos.symbol.replace("USDT", "/USDT")}</div>
                        <div className="text-xs text-muted-foreground font-mono">{pos.leverage}x плечо</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-mono font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
                        {isProfit ? "+" : ""}{pos.pnl.toFixed(2)} USDT
                      </div>
                      <div className={`text-sm font-mono ${isProfit ? "text-green-400" : "text-red-400"}`}>
                        {isProfit ? "+" : ""}{pos.pnl_percent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mb-4">
                    {[
                      { label: "Размер", value: `${pos.size}` },
                      { label: "Вход", value: `$${pos.entry.toLocaleString()}` },
                      { label: "Текущая", value: `$${pos.current.toLocaleString()}`, color: isProfit ? "text-green-400" : "text-red-400" },
                      { label: "Маржа", value: `$${pos.margin}` },
                      { label: "Плечо", value: `${pos.leverage}x`, color: "text-yellow-400" },
                    ].map((field) => (
                      <div key={field.label}>
                        <div className="text-xs text-muted-foreground mb-1">{field.label}</div>
                        <div className={`font-mono font-semibold ${field.color || "text-foreground"}`}>{field.value}</div>
                      </div>
                    ))}
                  </div>

                  {(pos.sl || pos.tp) && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-red-400 font-mono">
                          {pos.sl ? `SL $${pos.sl.toLocaleString()}${distToSl ? ` (-${distToSl}%)` : ""}` : "SL не задан"}
                        </span>
                        <span className="text-muted-foreground">Позиция цены</span>
                        <span className="text-green-400 font-mono">
                          {pos.tp ? `TP $${pos.tp.toLocaleString()}${distToTp ? ` (+${distToTp}%)` : ""}` : "TP не задан"}
                        </span>
                      </div>
                      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full ${isProfit ? "bg-green-400" : "bg-red-400"}`}
                          style={{ width: `${Math.min(Math.max(currentProgress, 2), 98)}%` }}
                        />
                      </div>
                    </div>
                  )}

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
          })
        )}
      </div>
    </div>
  );
}
