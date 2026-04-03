// components/settings/RotateKeyModal.tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, RotateCcw, Key, Loader2, AlertTriangle } from "lucide-react";
import { fadeIn, SPRINGS } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { ApiKeyDisplay } from "@/types/settings";

interface Props {
  isOpen: boolean;
  apiKey: ApiKeyDisplay | null;
  onClose: () => void;
  onConfirm: (id: string, newKey: string) => Promise<void>;
}

export function RotateKeyModal({ isOpen, apiKey, onClose, onConfirm }: Props) {
  const [newKey, setNewKey] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = newKey.length > 0 && confirmText === "ROTATE";

  const handleSubmit = useCallback(async () => {
    if (!apiKey || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(apiKey.id, newKey);
      setNewKey("");
      setConfirmText("");
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [apiKey, newKey, canSubmit, onConfirm, onClose]);

  return (
    <AnimatePresence>
      {isOpen && apiKey && (
        <>
          <motion.div
            variants={fadeIn}
            initial="hidden" animate="visible" exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pl-64 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={SPRINGS.snappy}
            className="w-full max-w-md pointer-events-auto"
          >
            <div className="rounded-2xl border border-vault-border bg-vault-card
                            shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between px-5 py-4
                              border-b border-vault-border/40">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-vault-warning" />
                  <h2 className="text-base font-semibold text-white">
                    Rotate API Key
                  </h2>
                </div>
                <button onClick={onClose}>
                  <X className="h-5 w-5 text-gray-500 hover:text-white" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex gap-3 rounded-lg bg-vault-warning/10 border
                                border-vault-warning/20 p-3">
                  <AlertTriangle className="h-5 w-5 text-vault-warning flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-300">
                    <p className="font-medium text-vault-warning mb-1">
                      This will immediately invalidate the old key
                    </p>
                    <p>
                      The current key ({apiKey.maskedKey}) will be replaced.
                      Any service using the old key will fail.
                      Rotation #{apiKey.rotationCount + 1}.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-vault-bg/60 p-3">
                  <span className="text-[10px] text-gray-500 uppercase block mb-1">
                    Current Key
                  </span>
                  <code className="text-xs font-mono text-gray-400">
                    {apiKey.maskedKey}
                  </code>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">
                    <Key className="h-3 w-3 inline mr-1" />
                    New API Key
                  </label>
                  <input
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Paste your new API key..."
                    autoComplete="off"
                    className="w-full rounded-lg border border-vault-border bg-vault-bg/60
                               px-3 py-2 text-sm font-mono text-white
                               placeholder:text-gray-600
                               focus:outline-none focus:ring-2 focus:ring-vault-accent/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">
                    Type <code className="text-vault-warning">ROTATE</code> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="ROTATE"
                    className="w-full rounded-lg border border-vault-border bg-vault-bg/60
                               px-3 py-2 text-sm font-mono text-white
                               placeholder:text-gray-600
                               focus:outline-none focus:ring-2 focus:ring-vault-warning/30"
                  />
                </div>

                {error && (
                  <p className="text-xs text-vault-danger">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-vault-border
                               text-sm font-medium text-gray-300
                               hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    whileHover={canSubmit ? { scale: 1.01 } : {}}
                    whileTap={canSubmit ? { scale: 0.99 } : {}}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                      canSubmit && !submitting
                        ? "bg-vault-warning text-vault-bg shadow-lg shadow-vault-warning/20"
                        : "bg-vault-border text-gray-500 cursor-not-allowed"
                    )}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      "Rotate Key"
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
