// components/settings/ApiKeyCard.tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye, EyeOff, RotateCcw, Trash2, ChevronDown,
  TestTube, Power, PowerOff,
  Copy, Check, ExternalLink, AlertTriangle, History,
  Zap, Link, BarChart3, Waves, ScanEye, Orbit, ShieldCheck, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fadeInUp, SPRINGS } from "@/lib/animations";
import { ConnectionStatus } from "./ConnectionStatus";
import { cn } from "@/lib/utils";
import type {
  ApiKeyDisplay,
  ConnectionState,
  ApiKeyHistoryEntry,
  ServiceConfig,
} from "@/types/settings";

// ── Service configs ──
export interface ServiceConfigWithIcon extends Omit<ServiceConfig, 'icon'> {
  icon: LucideIcon;
  iconColor: string;
}

export const SERVICE_CONFIGS: Record<string, ServiceConfigWithIcon> = {
  SIGNAL_ENGINE: {
    service: "SIGNAL_ENGINE",
    label: "Signal Engine",
    description: "Momentum + Mean-Reversion signal generation service",
    docsUrl: "#",
    icon: Zap,
    iconColor: "text-vault-accent",
    requiresUrl: true,
    rotationRecommendedDays: 0,
  },
  HELIUS_RPC: {
    service: "HELIUS_RPC",
    label: "Helius RPC",
    description: "Solana RPC endpoint for fast on-chain reads",
    docsUrl: "https://docs.helius.dev",
    icon: Link,
    iconColor: "text-blue-400",
    requiresUrl: true,
    rotationRecommendedDays: 90,
  },
  COINGLASS: {
    service: "COINGLASS",
    label: "Coinglass API",
    description: "Funding rates, open interest, liquidation data",
    docsUrl: "https://docs.coinglass.com",
    icon: BarChart3,
    iconColor: "text-purple-400",
    requiresUrl: false,
    rotationRecommendedDays: 90,
  },
  DRIFT: {
    service: "DRIFT",
    label: "Drift Protocol",
    description: "Perpetuals and spot market data for vault strategies",
    docsUrl: "https://docs.drift.trade",
    icon: Waves,
    iconColor: "text-cyan-400",
    requiresUrl: true,
    rotationRecommendedDays: 0,
  },
  BIRDEYE: {
    service: "BIRDEYE",
    label: "Birdeye",
    description: "Token price feeds and market data on Solana",
    docsUrl: "https://docs.birdeye.so",
    icon: ScanEye,
    iconColor: "text-amber-400",
    requiresUrl: false,
    rotationRecommendedDays: 90,
  },
  JUPITER: {
    service: "JUPITER",
    label: "Jupiter",
    description: "DEX aggregator for optimal swap routing",
    docsUrl: "https://station.jup.ag/docs",
    icon: Orbit,
    iconColor: "text-green-400",
    requiresUrl: false,
    rotationRecommendedDays: 0,
  },
  COBO_MPC: {
    service: "COBO_MPC",
    label: "Cobo MPC",
    description: "MPC wallet infrastructure for institutional key management",
    docsUrl: "https://www.cobo.com/developers",
    icon: ShieldCheck,
    iconColor: "text-rose-400",
    requiresUrl: false,
    rotationRecommendedDays: 30,
  },
  CUSTOM: {
    service: "CUSTOM",
    label: "Custom Service",
    description: "Custom API endpoint",
    docsUrl: "#",
    icon: Wrench,
    iconColor: "text-gray-400",
    requiresUrl: true,
    rotationRecommendedDays: 90,
  },
};

interface Props {
  apiKey: ApiKeyDisplay;
  connectionResult?: { success: boolean; latencyMs: number; message: string };
  isTesting?: boolean;
  onTest: () => void;
  onRotate: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
  onGetHistory: () => Promise<ApiKeyHistoryEntry[]>;
}

export function ApiKeyCard({
  apiKey,
  connectionResult,
  isTesting,
  onTest,
  onRotate,
  onDelete,
  onToggleActive,
  onGetHistory,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<ApiKeyHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const config = SERVICE_CONFIGS[apiKey.service] || SERVICE_CONFIGS.CUSTOM;

  const connectionState: ConnectionState = isTesting
    ? "testing"
    : connectionResult?.success
    ? "connected"
    : connectionResult && !connectionResult.success
    ? "error"
    : "untested";

  const daysSinceRotation = apiKey.lastRotatedAt
    ? Math.floor(
        (Date.now() - new Date(apiKey.lastRotatedAt).getTime()) / 86400000
      )
    : null;

  const rotationOverdue =
    config.rotationRecommendedDays > 0 &&
    daysSinceRotation !== null &&
    daysSinceRotation > config.rotationRecommendedDays;

  const isExpired =
    apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(apiKey.maskedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [apiKey.maskedKey]);

  const handleLoadHistory = useCallback(async () => {
    if (showHistory && history.length > 0) {
      setShowHistory(false);
      return;
    }
    setLoadingHistory(true);
    try {
      const h = await onGetHistory();
      setHistory(h);
      setShowHistory(true);
    } catch {
      // Error handled
    } finally {
      setLoadingHistory(false);
    }
  }, [showHistory, history, onGetHistory]);

  return (
    <motion.div
      variants={fadeInUp}
      className={cn(
        "rounded-xl border overflow-hidden transition-colors",
        apiKey.isActive
          ? "border-vault-border bg-vault-card/60 hover:border-vault-accent/20"
          : "border-vault-border/40 bg-vault-card/30 opacity-60",
        isExpired && "border-vault-danger/30"
      )}
    >
      {/* ── Header Row ── */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer
                    hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            apiKey.isActive ? "bg-vault-accent/10" : "bg-vault-border/30"
          )}
        >
          <config.icon className={cn("h-5 w-5", config.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white truncate">
              {config.label}
            </h4>
            {!apiKey.isActive && (
              <span className="text-[10px] font-medium text-gray-500
                               bg-vault-border/50 rounded px-1.5 py-0.5">
                INACTIVE
              </span>
            )}
            {isExpired && (
              <span className="text-[10px] font-medium text-vault-danger
                               bg-vault-danger/10 rounded px-1.5 py-0.5">
                EXPIRED
              </span>
            )}
            {rotationOverdue && (
              <span className="text-[10px] font-medium text-vault-warning
                               bg-vault-warning/10 rounded px-1.5 py-0.5
                               flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                ROTATE
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 truncate mt-0.5">
            {config.description}
          </p>
        </div>

        <ConnectionStatus
          state={connectionState}
          latencyMs={connectionResult?.latencyMs}
          compact
        />

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </motion.div>
      </div>

      {/* ── Expanded Content ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-vault-border/30 pt-3">
              {/* API Key Display */}
              <div className="rounded-lg bg-vault-bg/60 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-gray-500
                                   uppercase tracking-wider">
                    API Key
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowKey(!showKey); }}
                      className="p-1 rounded hover:bg-white/5 transition-colors"
                    >
                      {showKey ? (
                        <EyeOff className="h-3 w-3 text-gray-500" />
                      ) : (
                        <Eye className="h-3 w-3 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                      className="p-1 rounded hover:bg-white/5 transition-colors"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-vault-accent" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                <code className="text-xs font-mono text-white break-all">
                  {showKey ? apiKey.maskedKey : "••••••••••••••••••••"}
                </code>
              </div>

              {apiKey.endpointUrl && (
                <div className="rounded-lg bg-vault-bg/60 p-3">
                  <span className="text-[10px] font-medium text-gray-500
                                   uppercase tracking-wider block mb-1">
                    Endpoint URL
                  </span>
                  <code className="text-xs font-mono text-white break-all">
                    {apiKey.endpointUrl}
                  </code>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Environment", value: apiKey.environment },
                  { label: "Rotations", value: `${apiKey.rotationCount}×` },
                  {
                    label: "Last Rotated",
                    value: apiKey.lastRotatedAt
                      ? new Date(apiKey.lastRotatedAt).toLocaleDateString()
                      : "Never",
                  },
                  {
                    label: "Last Used",
                    value: apiKey.lastUsedAt
                      ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                      : "Never",
                  },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-vault-bg/40 p-2">
                    <span className="text-[10px] text-gray-500 block">{m.label}</span>
                    <span className="text-xs font-medium text-white">{m.value}</span>
                  </div>
                ))}
              </div>

              {connectionResult && (
                <ConnectionStatus
                  state={connectionState}
                  latencyMs={connectionResult.latencyMs}
                  message={connectionResult.message}
                />
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onTest(); }}
                  disabled={isTesting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5
                             text-xs font-medium border border-vault-border text-gray-300
                             hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <TestTube className={cn("h-3 w-3", isTesting && "animate-pulse")} />
                  {isTesting ? "Testing..." : "Test Connection"}
                </motion.button>

                <motion.button
                  onClick={(e) => { e.stopPropagation(); onRotate(); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5",
                    "text-xs font-medium border transition-colors",
                    rotationOverdue
                      ? "border-vault-warning/30 text-vault-warning bg-vault-warning/5 hover:bg-vault-warning/10"
                      : "border-vault-border text-gray-300 hover:bg-white/5"
                  )}
                >
                  <RotateCcw className="h-3 w-3" />
                  Rotate Key
                </motion.button>

                <motion.button
                  onClick={(e) => { e.stopPropagation(); onToggleActive(!apiKey.isActive); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5
                             text-xs font-medium border border-vault-border text-gray-300
                             hover:bg-white/5 transition-colors"
                >
                  {apiKey.isActive ? (
                    <><PowerOff className="h-3 w-3" /> Deactivate</>
                  ) : (
                    <><Power className="h-3 w-3 text-vault-accent" /> Activate</>
                  )}
                </motion.button>

                <motion.button
                  onClick={(e) => { e.stopPropagation(); handleLoadHistory(); }}
                  disabled={loadingHistory}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5
                             text-xs font-medium border border-vault-border text-gray-300
                             hover:bg-white/5 transition-colors"
                >
                  <History className="h-3 w-3" />
                  {loadingHistory ? "Loading..." : "History"}
                </motion.button>

                {config.docsUrl !== "#" && (
                  <a
                    href={config.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5
                               text-xs font-medium border border-vault-border text-gray-300
                               hover:bg-white/5 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Docs
                  </a>
                )}

                <motion.button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5
                             text-xs font-medium border border-vault-danger/30
                             text-vault-danger hover:bg-vault-danger/10
                             transition-colors ml-auto"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </motion.button>
              </div>

              {/* History Panel */}
              <AnimatePresence>
                {showHistory && history.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-lg border border-vault-border/40 bg-vault-bg/40 p-3 mt-2">
                      <h5 className="text-[10px] font-medium text-gray-500
                                     uppercase tracking-wider mb-2">
                        Change History
                      </h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {history.map((entry) => (
                          <div key={entry.id} className="flex items-center gap-2 text-xs">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded font-medium text-[10px]",
                                entry.action === "CREATED" && "bg-vault-accent/10 text-vault-accent",
                                entry.action === "ROTATED" && "bg-blue-500/10 text-blue-400",
                                entry.action === "DELETED" && "bg-vault-danger/10 text-vault-danger",
                                entry.action === "DEACTIVATED" && "bg-vault-warning/10 text-vault-warning",
                                entry.action === "REACTIVATED" && "bg-vault-accent/10 text-vault-accent",
                                entry.action === "UPDATED" && "bg-purple-500/10 text-purple-400",
                                entry.action === "TESTED" && "bg-vault-border/30 text-gray-500",
                                entry.action === "TEST_FAILED" && "bg-vault-danger/10 text-vault-danger"
                              )}
                            >
                              {entry.action}
                            </span>
                            <span className="text-gray-500">
                              {new Date(entry.createdAt).toLocaleString()}
                            </span>
                            {entry.performedBy && (
                              <span className="text-gray-600 font-mono truncate">
                                by {entry.performedBy.slice(0, 4)}...
                                {entry.performedBy.slice(-4)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
