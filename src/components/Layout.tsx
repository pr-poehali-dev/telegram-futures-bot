import { useState } from "react";
import { NavLink } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { path: "/", label: "Анализ", icon: "BarChart2" },
  { path: "/signals", label: "Сигналы", icon: "Zap", badge: 3 },
  { path: "/positions", label: "Позиции", icon: "Layers", badge: 2 },
  { path: "/history", label: "История", icon: "Clock" },
  { path: "/alerts", label: "Оповещения", icon: "Bell", badge: 5 },
  { path: "/settings", label: "Настройки", icon: "Settings2" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside
        className={`flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ${collapsed ? "w-16" : "w-52"}`}
      >
        <div className="flex items-center justify-between px-3 py-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                <Icon name="TrendingUp" size={14} className="text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm text-foreground tracking-wide">TradeBot</span>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center mx-auto">
              <Icon name="TrendingUp" size={14} className="text-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="PanelLeftClose" size={16} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="p-3 text-muted-foreground hover:text-foreground transition-colors mx-auto mt-1"
          >
            <Icon name="PanelLeftOpen" size={16} />
          </button>
        )}

        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-all duration-150 relative group ${
                  isActive
                    ? "bg-sidebar-accent text-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`
              }
            >
              <Icon name={item.icon} size={16} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0 h-4 bg-primary/20 text-primary border-0 font-mono"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-sidebar-border">
          <div className={`flex items-center gap-2 px-2 py-2 rounded-md bg-sidebar-accent ${collapsed ? "justify-center" : ""}`}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            {!collapsed && (
              <span className="text-xs text-muted-foreground">Bybit подключён</span>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}