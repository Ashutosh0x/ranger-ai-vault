import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ranger AI Vault — Dashboard",
  description: "AI-Powered Momentum + Mean-Reversion Hybrid Vault on Solana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-vault-bg text-white antialiased">
        <div className="flex">
          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 w-64 glass-card border-r border-vault-border z-50">
            <div className="p-6">
              <h1 className="text-xl font-bold">
                <span className="text-vault-accent">⚡</span> Ranger AI
              </h1>
              <p className="text-xs text-gray-500 mt-1">Yield Vault</p>
            </div>
            <nav className="px-4 space-y-1">
              {[
                { href: "/", label: "Overview", icon: "📊" },
                { href: "/vault", label: "Vault", icon: "🏦" },
                { href: "/signals", label: "Signals", icon: "📡" },
                { href: "/positions", label: "Positions", icon: "📈" },
                { href: "/risk", label: "Risk", icon: "🛡️" },
                { href: "/backtest", label: "Backtest", icon: "🧪" },
                { href: "/logs", label: "Logs", icon: "📋" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="ml-64 flex-1 p-8 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
