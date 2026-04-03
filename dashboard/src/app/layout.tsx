import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ranger AI Vault",
  description:
    "AI-Powered Momentum + Mean-Reversion Hybrid Yield Vault on Solana",
  icons: { icon: "/ranger-logo.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-vault-bg text-white antialiased">
        {children}
      </body>
    </html>
  );
}
