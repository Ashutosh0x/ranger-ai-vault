// Dashboard API Route: Health check
import { NextResponse } from "next/server";

export async function GET() {
  const signalUrl = process.env.NEXT_PUBLIC_SIGNAL_URL || "http://localhost:8080";

  let signalHealth = false;
  try {
    const resp = await fetch(`${signalUrl}/health`, { cache: "no-store" });
    signalHealth = resp.ok;
  } catch {}

  return NextResponse.json({
    dashboard: "ok",
    signalServer: signalHealth ? "ok" : "unreachable",
    timestamp: Date.now(),
  });
}
