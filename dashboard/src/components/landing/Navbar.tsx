"use client";

import Link from "next/link";
import { useState, useEffect, RefObject } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, Zap, Moon, Sun } from "lucide-react";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useTheme } from "@/providers/ThemeProvider";

interface NavbarProps {
  sections: {
    howRef: RefObject<HTMLDivElement | null>;
    performanceRef: RefObject<HTMLDivElement | null>;
    riskRef: RefObject<HTMLDivElement | null>;
  };
}

export function Navbar({ sections }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (ref: RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  const NAV_LINKS = [
    { label: "How It Works", ref: sections.howRef },
    { label: "Performance", ref: sections.performanceRef },
    { label: "Risk", ref: sections.riskRef },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-vault-bg/90 backdrop-blur-xl border-b border-vault-border"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg bg-vault-accent/10 border border-vault-accent/30
                        flex items-center justify-center"
          >
            <Zap className="w-4 h-4 text-vault-accent" />
          </div>
          <span className="text-white font-semibold">Ranger AI Vault</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, ref }) => (
            <button
              key={label}
              onClick={() => scrollTo(ref)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {label}
            </button>
          ))}
          <Link
            href="/docs"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Docs
          </Link>
        </div>

        {/* Right: Theme toggle + Dashboard link + Wallet */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-vault-border text-gray-400
                       hover:text-white hover:border-vault-accent/30
                       transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <Link
            href="/overview"
            className="hidden sm:inline-flex items-center px-4 py-2
                       rounded-lg border border-vault-border text-sm
                       text-gray-400 hover:text-white
                       hover:border-vault-accent/30 transition-colors"
          >
            Launch App
          </Link>
          <WalletButton />

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-400"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden glass-card border-b border-vault-border px-6 py-4 space-y-3">
          {NAV_LINKS.map(({ label, ref }) => (
            <button
              key={label}
              onClick={() => scrollTo(ref)}
              className="block w-full text-left text-sm text-gray-400
                         hover:text-white py-2"
            >
              {label}
            </button>
          ))}
          <Link
            href="/docs"
            className="block text-sm text-gray-400 hover:text-white py-2"
          >
            Docs
          </Link>
          <Link
            href="/overview"
            className="block text-sm text-vault-accent font-medium py-2"
          >
            Launch Dashboard →
          </Link>
        </div>
      )}
    </nav>
  );
}
