// app/(dashboard)/settings/page.tsx
"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import {
  Settings, Plus, TestTubes, RefreshCw, Shield, Download,
  AlertTriangle, CheckCircle2, Zap, Bell, Moon, Sun,
  SlidersHorizontal, Globe, ExternalLink, KeyRound,
} from "lucide-react";
import { PageTransition } from "@/components/motion/PageTransition";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { CountUp } from "@/components/motion/CountUp";
import { ScaleOnHover } from "@/components/motion/ScaleOnHover";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { ApiKeyCard } from "@/components/settings/ApiKeyCard";
import { AddApiKeyModal } from "@/components/settings/AddApiKeyModal";
import { RotateKeyModal } from "@/components/settings/RotateKeyModal";
import { DeleteKeyModal } from "@/components/settings/DeleteKeyModal";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useConnectionTest } from "@/hooks/useConnectionTest";
import type { ApiKeyDisplay, CreateApiKeyPayload, ApiService } from "@/types/settings";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/ThemeProvider";

export default function SettingsPage() {
  const {
    keys,
    isLoading,
    createKey,
    updateKey,
    rotateKey,
    deleteKey,
    getHistory,
    refresh,
  } = useApiKeys();
  const { results, testing, testService, testAll } = useConnectionTest();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [rotateTarget, setRotateTarget] = useState<ApiKeyDisplay | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyDisplay | null>(null);
  const [testingAll, setTestingAll] = useState(false);

  // Theme toggle
  const { toggleTheme, isDark } = useTheme();

  // Notifications
  const [notifications, setNotifications] = useState(true);

  // Stats
  const activeKeys = keys.filter((k) => k.isActive).length;
  const totalRotations = keys.reduce((sum, k) => sum + k.rotationCount, 0);
  const connectedCount = Object.values(results).filter((r) => r.success).length;
  const overdueKeys = keys.filter((k) => {
    if (!k.lastRotatedAt) return false;
    const days = (Date.now() - new Date(k.lastRotatedAt).getTime()) / 86400000;
    return days > 90;
  }).length;

  // Handlers
  const handleCreate = useCallback(
    async (payload: CreateApiKeyPayload) => {
      await createKey(payload);
    },
    [createKey]
  );

  const handleRotate = useCallback(
    async (id: string, newKey: string) => {
      await rotateKey(id, { newApiKey: newKey });
    },
    [rotateKey]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteKey(id);
    },
    [deleteKey]
  );

  const handleToggleActive = useCallback(
    async (id: string, active: boolean) => {
      await updateKey(id, { isActive: active });
    },
    [updateKey]
  );

  const handleTestAll = useCallback(async () => {
    setTestingAll(true);
    const services = keys
      .filter((k) => k.isActive)
      .map((k) => k.service) as ApiService[];
    await testAll(services);
    setTestingAll(false);
  }, [keys, testAll]);

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        {/* ── Page Header ── */}
        <FadeIn>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-5 w-5 text-vault-accent" />
                <h1 className="text-xl font-semibold text-white">Settings</h1>
              </div>
              <p className="text-sm text-gray-500">
                Manage API keys, connections, and service configuration.
                Keys are encrypted with AES-256-GCM.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleTestAll}
                disabled={testingAll || keys.length === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2
                           text-xs font-medium border border-vault-border text-gray-300
                           hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <TestTubes className={cn("h-3.5 w-3.5", testingAll && "animate-pulse")} />
                Test All
              </motion.button>
              <motion.button
                onClick={() => setShowAddModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2
                           bg-vault-accent text-vault-bg text-xs font-semibold
                           shadow-sm shadow-vault-accent/20"
              >
                <Plus className="h-3.5 w-3.5" />
                Add API Key
              </motion.button>
            </div>
          </div>
        </FadeIn>

        {/* ── Stats Row ── */}
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StaggerItem>
            <ScaleOnHover>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-vault-accent" />
                  <span className="text-xs text-gray-500">Active Keys</span>
                </div>
                <CountUp
                  value={activeKeys}
                  decimals={0}
                  className="text-2xl font-bold text-white"
                />
                <span className="text-xs text-gray-500 ml-1">
                  / {keys.length} total
                </span>
              </div>
            </ScaleOnHover>
          </StaggerItem>

          <StaggerItem>
            <ScaleOnHover>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-vault-accent" />
                  <span className="text-xs text-gray-500">Connected</span>
                </div>
                <CountUp
                  value={connectedCount}
                  decimals={0}
                  className="text-2xl font-bold text-vault-accent"
                />
                <span className="text-xs text-gray-500 ml-1">services</span>
              </div>
            </ScaleOnHover>
          </StaggerItem>

          <StaggerItem>
            <ScaleOnHover>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-gray-500">Total Rotations</span>
                </div>
                <CountUp
                  value={totalRotations}
                  decimals={0}
                  className="text-2xl font-bold text-white"
                />
              </div>
            </ScaleOnHover>
          </StaggerItem>

          <StaggerItem>
            <ScaleOnHover>
              <div className={cn(
                "glass-card p-4",
                overdueKeys > 0 && "border-vault-warning/30"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={cn(
                    "h-4 w-4",
                    overdueKeys > 0 ? "text-vault-warning" : "text-gray-500"
                  )} />
                  <span className="text-xs text-gray-500">Rotation Due</span>
                </div>
                <CountUp
                  value={overdueKeys}
                  decimals={0}
                  className={cn(
                    "text-2xl font-bold",
                    overdueKeys > 0 ? "text-vault-warning" : "text-white"
                  )}
                />
                <span className="text-xs text-gray-500 ml-1">keys</span>
              </div>
            </ScaleOnHover>
          </StaggerItem>
        </StaggerGrid>

        {/* ── API Keys Section ── */}
        <SettingsSection
          title="API Configuration"
          description="Manage API keys and endpoints for all integrated services"
          action={
            <motion.button
              onClick={refresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
            </motion.button>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl border border-vault-border animate-pulse
                             bg-vault-border/10"
                />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-1">
                No API keys configured
              </p>
              <p className="text-xs text-gray-600 mb-4">
                Add your first API key to connect services
              </p>
              <motion.button
                onClick={() => setShowAddModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-4 py-2
                           rounded-lg bg-vault-accent text-vault-bg
                           text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add API Key
              </motion.button>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <ApiKeyCard
                  key={key.id}
                  apiKey={key}
                  connectionResult={results[key.service]}
                  isTesting={testing[key.service]}
                  onTest={() => testService(key.service)}
                  onRotate={() => setRotateTarget(key)}
                  onDelete={() => setDeleteTarget(key)}
                  onToggleActive={(active) => handleToggleActive(key.id, active)}
                  onGetHistory={() => getHistory(key.id)}
                />
              ))}
            </div>
          )}
        </SettingsSection>

        {/* ── Appearance ── */}
        <SettingsSection title="Appearance" description="Theme and display preferences">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="w-4 h-4 text-blue-400" />
              ) : (
                <Sun className="w-4 h-4 text-vault-warning" />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {isDark ? "Dark Mode" : "Light Mode"}
                </p>
                <p className="text-xs text-gray-500">
                  {isDark
                    ? "Currently using dark theme"
                    : "Currently using light theme"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                isDark ? "bg-vault-accent" : "bg-vault-border"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  isDark ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </SettingsSection>

        {/* ── Notifications ── */}
        <SettingsSection title="Notifications" description="Alert preferences for vault events">
          {[
            { label: "Trade Executions", desc: "Alert when keeper opens/closes a position", key: "trades" },
            { label: "Risk Breaches", desc: "Alert when drawdown limits are approached", key: "risk" },
            { label: "Deposit/Withdraw", desc: "Confirm vault token movements", key: "vault" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-vault-border/20 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notifications ? "bg-vault-accent" : "bg-vault-border"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    notifications ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </SettingsSection>

        {/* ── Risk Parameters ── */}
        <SettingsSection
          title="Risk Parameters"
          description="Vault risk limits and position sizing"
          action={
            <span className="text-xs bg-vault-border text-gray-400 px-2 py-0.5 rounded-full">
              Manager Only
            </span>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Max Daily DD", value: "3%" },
              { label: "Max Monthly DD", value: "8%" },
              { label: "Max Leverage", value: "2x" },
              { label: "Stop Loss", value: "-0.5%" },
              { label: "Take Profit", value: "1.5%" },
              { label: "Max Positions", value: "3" },
              { label: "Kelly Fraction", value: "0.25" },
              { label: "VaR Threshold", value: "-2%" },
            ].map((p) => (
              <div key={p.label} className="bg-vault-bg/60 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase">{p.label}</p>
                <p className="text-lg font-bold text-white mt-1">{p.value}</p>
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* ── Security Info ── */}
        <SettingsSection
          title="Security"
          description="How your API keys are protected"
        >
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-vault-bg/50 p-3">
              <Shield className="h-5 w-5 text-vault-accent mb-2" />
              <h4 className="text-xs font-semibold text-white mb-1">
                Encrypted at Rest
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                All keys encrypted with AES-256-GCM using a server-side
                encryption secret. Never stored in plaintext.
              </p>
            </div>
            <div className="rounded-lg bg-vault-bg/50 p-3">
              <RefreshCw className="h-5 w-5 text-blue-400 mb-2" />
              <h4 className="text-xs font-semibold text-white mb-1">
                Key Rotation
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Rotate keys without downtime. Full audit trail for every
                change. Recommended: every 90 days.
              </p>
            </div>
            <div className="rounded-lg bg-vault-bg/50 p-3">
              <Zap className="h-5 w-5 text-vault-warning mb-2" />
              <h4 className="text-xs font-semibold text-white mb-1">
                Audit Logging
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Every key creation, rotation, deletion, and test is logged
                with wallet address, IP, and timestamp.
              </p>
            </div>
          </div>
        </SettingsSection>

        {/* ── Environment Variables Reference ── */}
        <SettingsSection
          title="Environment Variables"
          description="Required .env configuration for the application"
        >
          <div className="rounded-lg bg-vault-bg/60 border border-vault-border/30 p-4 overflow-x-auto">
            <pre className="text-xs font-mono text-gray-400 leading-relaxed">
{`# ── Database ──────────────────────────
DATABASE_URL="postgresql://user:pass@localhost:5432/ranger_vault"

# ── Encryption (generate: openssl rand -hex 32) ──
API_KEY_ENCRYPTION_SECRET="your-64-char-hex-string-here"

# ── Solana ────────────────────────────
NEXT_PUBLIC_SOLANA_NETWORK="devnet"
NEXT_PUBLIC_HELIUS_RPC_URL=""         # Set via Settings UI
NEXT_PUBLIC_VAULT_ADDRESS=""

# ── Signal Engine ─────────────────────
SIGNAL_ENGINE_URL="http://localhost:8080"

# ── External APIs (managed via Settings UI) ──
# COINGLASS_API_KEY=""  ← Stored encrypted in DB
# BIRDEYE_API_KEY=""    ← Stored encrypted in DB
# COBO_API_KEY=""       ← Stored encrypted in DB`}
            </pre>
          </div>
        </SettingsSection>

        {/* ── Resources ── */}
        <SettingsSection title="Resources" description="Documentation and external links">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: "Architecture Docs", href: "/docs" },
              { label: "Ranger Finance", href: "https://ranger.finance" },
              { label: "Solscan Explorer", href: "https://solscan.io" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("/") ? "_self" : "_blank"}
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-vault-bg/50
                           rounded-xl text-sm text-gray-300 hover:text-white
                           hover:bg-white/5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                {link.label}
              </a>
            ))}
          </div>
        </SettingsSection>
      </div>

      {/* ── Modals ── */}
      <AddApiKeyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreate}
      />
      <RotateKeyModal
        isOpen={!!rotateTarget}
        apiKey={rotateTarget}
        onClose={() => setRotateTarget(null)}
        onConfirm={handleRotate}
      />
      <DeleteKeyModal
        isOpen={!!deleteTarget}
        apiKey={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}
