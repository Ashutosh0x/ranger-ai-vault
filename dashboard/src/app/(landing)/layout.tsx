"use client";

import { QueryProvider } from "../providers";
import { WalletContextProvider } from "@/providers/WalletProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <WalletContextProvider>
        <QueryProvider>{children}</QueryProvider>
      </WalletContextProvider>
    </ThemeProvider>
  );
}
