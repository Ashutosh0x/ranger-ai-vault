// components/settings/AddApiKeyModal.tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Plus, Key, Globe, Tag, Calendar, Shield, Loader2,
  Zap, Link, BarChart3, Waves, ScanEye, Orbit, ShieldCheck, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fadeIn, SPRINGS } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { ApiService, Environment, CreateApiKeyPayload } from "@/types/settings";

const SERVICES: Array<{ value: ApiService; label: string; icon: LucideIcon; iconColor: string; desc: string }> = [
  { value: "SIGNAL_ENGINE", label: "Signal Engine", icon: Zap, iconColor: "text-vault-accent", desc: "Local signal generation" },
  { value: "HELIUS_RPC", label: "Helius RPC", icon: Link, iconColor: "text-blue-400", desc: "Solana RPC endpoint" },
  { value: "COINGLASS", label: "Coinglass API", icon: BarChart3, iconColor: "text-purple-400", desc: "Funding & OI data" },
  { value: "DRIFT", label: "Zeta Markets", icon: Waves, iconColor: "text-cyan-400", desc: "Perps & spot data" },
  { value: "BIRDEYE", label: "Birdeye", icon: ScanEye, iconColor: "text-amber-400", desc: "Token price feeds" },
  { value: "JUPITER", label: "Jupiter", icon: Orbit, iconColor: "text-green-400", desc: "DEX aggregator" },
  { value: "COBO_MPC", label: "Cobo MPC", icon: ShieldCheck, iconColor: "text-rose-400", desc: "MPC wallet infra" },
  { value: "CUSTOM", label: "Custom", icon: Wrench, iconColor: "text-gray-400", desc: "Custom endpoint" },
];

const ENVIRONMENTS: Array<{ value: Environment; label: string }> = [
  { value: "PRODUCTION", label: "Production" },
  { value: "STAGING", label: "Staging" },
  { value: "DEVELOPMENT", label: "Development" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateApiKeyPayload) => Promise<void>;
}

export function AddApiKeyModal({ isOpen, onClose, onSubmit }: Props) {
  const [service, setService] = useState<ApiService>("HELIUS_RPC");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [environment, setEnvironment] = useState<Environment>("PRODUCTION");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = SERVICES.find((s) => s.value === service);
  const needsUrl = ["SIGNAL_ENGINE", "HELIUS_RPC", "DRIFT", "CUSTOM"].includes(service);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name || selectedService?.label || service,
        service,
        apiKey,
        endpointUrl: needsUrl ? endpointUrl : undefined,
        environment,
        expiresAt: expiresAt || undefined,
      });
      setService("HELIUS_RPC");
      setName("");
      setApiKey("");
      setEndpointUrl("");
      setExpiresAt("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add API key");
    } finally {
      setSubmitting(false);
    }
  }, [service, name, apiKey, endpointUrl, environment, expiresAt, needsUrl, onSubmit, onClose, selectedService]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pl-64 pointer-events-none"
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={SPRINGS.snappy}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto"
          >
            <div className="rounded-2xl border border-vault-border bg-vault-card
                            shadow-2xl shadow-black/40">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4
                              border-b border-vault-border/40 sticky top-0
                              bg-vault-card z-10 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-vault-accent/10
                                  flex items-center justify-center">
                    <Plus className="h-4 w-4 text-vault-accent" />
                  </div>
                  <h2 className="text-base font-semibold text-white">
                    Add API Key
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Service Selection */}
                <div>
                  <label className="text-xs font-medium text-gray-500
                                    uppercase tracking-wider block mb-2">
                    Service
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SERVICES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => {
                          setService(s.value);
                          setName(s.label);
                        }}
                        className={cn(
                          "rounded-lg border p-2.5 text-center transition-all",
                          "hover:border-vault-accent/30",
                          service === s.value
                            ? "border-vault-accent bg-vault-accent/5 shadow-sm shadow-vault-accent/10"
                            : "border-vault-border"
                        )}
                      >
                        <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.iconColor)} />
                        <span className="text-[11px] font-medium text-white block">
                          {s.label}
                        </span>
                        <span className="text-[9px] text-gray-500 block mt-0.5">
                          {s.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">
                    <Tag className="h-3 w-3 inline mr-1" />
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={selectedService?.label || "My API Key"}
                    className="w-full rounded-lg border border-vault-border bg-vault-bg/60
                               px-3 py-2 text-sm text-white
                               placeholder:text-gray-600
                               focus:outline-none focus:ring-2 focus:ring-vault-accent/30
                               focus:border-vault-accent/50"
                  />
                </div>

                {/* API Key Input */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">
                    <Key className="h-3 w-3 inline mr-1" />
                    API Key / Secret
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                    autoComplete="off"
                    className="w-full rounded-lg border border-vault-border bg-vault-bg/60
                               px-3 py-2 text-sm font-mono text-white
                               placeholder:text-gray-600
                               focus:outline-none focus:ring-2 focus:ring-vault-accent/30
                               focus:border-vault-accent/50"
                  />
                  <p className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Encrypted with AES-256-GCM before storage. Never stored in plaintext.
                  </p>
                </div>

                {/* Endpoint URL */}
                {needsUrl && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">
                      <Globe className="h-3 w-3 inline mr-1" />
                      Endpoint URL
                    </label>
                    <input
                      type="url"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      placeholder={
                        service === "SIGNAL_ENGINE"
                          ? "http://localhost:8080"
                          : service === "HELIUS_RPC"
                          ? "https://mainnet.helius-rpc.com"
                          : "https://api.example.com"
                      }
                      className="w-full rounded-lg border border-vault-border bg-vault-bg/60
                                 px-3 py-2 text-sm font-mono text-white
                                 placeholder:text-gray-600
                                 focus:outline-none focus:ring-2 focus:ring-vault-accent/30
                                 focus:border-vault-accent/50"
                    />
                  </div>
                )}

                {/* Environment + Expiry Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">
                      Environment
                    </label>
                    <select
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value as Environment)}
                      className="w-full rounded-lg border border-vault-border bg-vault-bg/60
                                 px-3 py-2 text-sm text-white
                                 focus:outline-none focus:ring-2 focus:ring-vault-accent/30"
                    >
                      {ENVIRONMENTS.map((env) => (
                        <option key={env.value} value={env.value}
                          className="bg-vault-card text-white">
                          {env.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Expires (optional)
                    </label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full rounded-lg border border-vault-border bg-vault-bg/60
                                 px-3 py-2 text-sm text-white
                                 focus:outline-none focus:ring-2 focus:ring-vault-accent/30"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-vault-danger/10 border border-vault-danger/20
                               px-3 py-2 text-xs text-vault-danger"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={!apiKey || submitting}
                  whileHover={apiKey ? { scale: 1.01 } : {}}
                  whileTap={apiKey ? { scale: 0.99 } : {}}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold text-sm transition-colors",
                    apiKey && !submitting
                      ? "bg-vault-accent text-vault-bg shadow-lg shadow-vault-accent/20"
                      : "bg-vault-border text-gray-500 cursor-not-allowed"
                  )}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Encrypting & Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Key className="h-4 w-4" />
                      Save API Key
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
