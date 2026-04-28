import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const HOT_URL = "https://functions.poehali.dev/f98b17d6-ed4d-47ee-b023-8fd91a586896";

interface HotCoin {
  symbol: string;
  raw_symbol: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  turnover_24h: number;
  price_range: number;
  score: number;
  direction: "LONG" | "SHORT";
  reasons: string[];
  tags: string[];
}

function formatMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(score, 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-blue-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-6">{score}</span>
    </div>
  );
}

export default function Hot() {
  const [coins, setCoins] = useState<HotCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [totalScanned, setTotalScanned] = useState(0);
  const [filter, setFilter] = useState<"all" | "long" | "short">("all");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(HOT_URL);
      const data = await res.json();
      setCoins(data.hot || []);
      setTotalScanned(data.total_scanned || 0);
      setLastUpdate(new Date());
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const filtered = coins.filter((c) => {
    if (filter === "long") return c.direction === "LONG";
    if (filter === "short") return c.direction === "SHORT";
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span>🔥</span> Горячие возможности
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalScanned > 0 ? `Проверено ${totalScanned} монет · ` : ""}
            {lastUpdate ? `Обновлено ${lastUpdate.toLocaleTimeString("ru")}` : "Загрузка..."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <Icon name="RefreshCw" size={14} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2">
        {(["all", "long", "short"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "Все" : f === "long" ? "📈 Лонг" : "📉 Шорт"}
          </button>
        ))}
      </div>

      {/* Список */}
      {loading && coins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Icon name="Loader2" size={32} className="animate-spin" />
          <span className="text-sm">Сканирую рынок...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <span className="text-3xl">😴</span>
          <span className="text-sm">Горячих монет пока нет</span>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((coin, i) => (
            <div
              key={coin.raw_symbol}
              className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-primary/40 transition-colors"
            >
              {/* Верхняя строка */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
                  <span className="font-bold text-foreground text-base">{coin.symbol}</span>
                  {coin.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <Badge
                  className={`shrink-0 font-bold text-xs ${
                    coin.direction === "LONG"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                  variant="outline"
                >
                  {coin.direction === "LONG" ? "▲ LONG" : "▼ SHORT"}
                </Badge>
              </div>

              {/* Цифры */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Цена</div>
                  <div className="font-mono font-semibold text-sm text-foreground">
                    ${coin.price < 0.01 ? coin.price.toFixed(6) : coin.price < 1 ? coin.price.toFixed(4) : coin.price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Изменение 24ч</div>
                  <div
                    className={`font-mono font-semibold text-sm ${
                      coin.change_24h >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {coin.change_24h >= 0 ? "+" : ""}
                    {coin.change_24h.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Объём 24ч</div>
                  <div className="font-mono font-semibold text-sm text-foreground">
                    {formatMoney(coin.turnover_24h)}
                  </div>
                </div>
              </div>

              {/* Волатильность */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Диапазон цены: <span className="text-foreground font-medium">{coin.price_range}%</span></span>
              </div>

              {/* Причины */}
              {coin.reasons.length > 0 && (
                <div className="space-y-1">
                  {coin.reasons.map((r, ri) => (
                    <div key={ri} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Icon name="ChevronRight" size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                      <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Скор */}
              <ScoreBar score={coin.score} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
