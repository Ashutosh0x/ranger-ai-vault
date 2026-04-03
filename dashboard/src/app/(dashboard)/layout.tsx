"use client";

import { QueryProvider } from "../providers";
import { WalletContextProvider } from "@/providers/WalletProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <WalletContextProvider>
        <QueryProvider>
          <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 flex flex-col min-h-screen">
              <TopBar />
              <main className="flex-1 p-8">{children}</main>
            </div>
          </div>
        </QueryProvider>
      </WalletContextProvider>
    </ThemeProvider>
  );
}
