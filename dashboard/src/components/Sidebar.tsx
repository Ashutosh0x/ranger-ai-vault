"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Vault,
  TrendingUp,
  Activity,
  Shield,
  FlaskConical,
  ScrollText,
  LineChart,
  Trophy,
  Copy,
  UserPlus,
  CircleUserRound,
  Settings,
  Zap,
  Wifi,
  WifiOff,
  Moon,
  Sun,
} from "lucide-react";
import { useHealth } from "@/hooks/useHealth";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useTheme } from "@/providers/ThemeProvider";

const MAIN_NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/vault", label: "Vault", icon: Vault },
  { href: "/signals", label: "Signals", icon: TrendingUp },
  { href: "/positions", label: "Positions", icon: Activity },
  { href: "/risk", label: "Risk", icon: Shield },
  { href: "/backtest", label: "Backtest", icon: FlaskConical },
  { href: "/logs", label: "Logs", icon: ScrollText },
] as const;

const EXTRA_NAV = [
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/copy-trading", label: "Copy Trading", icon: Copy },
  { href: "/referrals", label: "Referrals", icon: UserPlus },
] as const;

const BOTTOM_NAV = [
  { href: "/profile", label: "Profile", icon: CircleUserRound },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { data: health } = useHealth();
  const isOnline = health?.status === "ok";
  const { toggleTheme, isDark } = useTheme();

  const isActive = (href: string) => pathname.startsWith(href);

  const navLink = (item: { href: string; label: string; icon: any }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
          active
            ? "text-white bg-white/10 font-medium"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 glass-card border-r border-vault-border z-50 flex flex-col">
      {/* Brand */}
      <div className="p-6 pb-3">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-vault-accent" />
          <span>Ranger AI</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">Yield Vault</p>
      </div>

      {/* Main nav */}
      <nav className="px-3 space-y-0.5 flex-1 overflow-y-auto">
        {MAIN_NAV.map(navLink)}

        {/* Separator */}
        <div className="!my-3 border-t border-vault-border/40" />
        <p className="px-4 text-[10px] uppercase tracking-widest text-gray-500 !mb-1">
          Explore
        </p>
        {EXTRA_NAV.map(navLink)}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-vault-border/40 px-3 py-3 space-y-0.5">
        {BOTTOM_NAV.map(navLink)}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
                     text-gray-400 hover:text-white hover:bg-white/5
                     transition-all w-full"
        >
          {isDark ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>

        {/* Engine status */}
        <div className="flex items-center gap-2 px-4 py-2 mt-1">
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-vault-accent" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className="text-[11px] text-gray-500">
            Engine {isOnline ? "Online" : "Offline"}
          </span>
          <div
            className={`w-1.5 h-1.5 rounded-full ml-auto ${
              isOnline ? "bg-vault-accent animate-pulse" : "bg-red-400"
            }`}
          />
        </div>
      </div>
    </aside>
  );
}
