// components/settings/DeleteKeyModal.tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { fadeIn, SPRINGS } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { ApiKeyDisplay } from "@/types/settings";

interface Props {
  isOpen: boolean;
  apiKey: ApiKeyDisplay | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteKeyModal({ isOpen, apiKey, onClose, onConfirm }: Props) {
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canDelete = confirmText === "DELETE";

  const handleDelete = useCallback(async () => {
    if (!apiKey || !canDelete) return;
    setSubmitting(true);
    try {
      await onConfirm(apiKey.id);
      setConfirmText("");
      onClose();
    } catch {
      // Error
    } finally {
      setSubmitting(false);
    }
  }, [apiKey, canDelete, onConfirm, onClose]);

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={SPRINGS.snappy}
            className="w-full max-w-sm pointer-events-auto"
          >
            <div className="rounded-2xl border border-vault-danger/30 bg-vault-card
                            shadow-2xl shadow-black/40">
              <div className="p-5 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-vault-danger/10
                                flex items-center justify-center mx-auto">
                  <Trash2 className="h-6 w-6 text-vault-danger" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Remove API Key
                </h3>
                <p className="text-sm text-gray-400">
                  This will permanently delete the{" "}
                  <strong className="text-white">{apiKey.name}</strong> key
                  ({apiKey.maskedKey}) and all its history.
                </p>

                <div className="rounded-lg bg-vault-danger/5 border border-vault-danger/10 p-3">
                  <p className="text-xs text-vault-danger flex items-center gap-1 justify-center">
                    <AlertTriangle className="h-3 w-3" />
                    This action cannot be undone
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">
                    Type <code className="text-vault-danger">DELETE</code> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full rounded-lg border border-vault-border bg-vault-bg/60
                               px-3 py-2 text-sm font-mono text-white text-center
                               placeholder:text-gray-600
                               focus:outline-none focus:ring-2 focus:ring-vault-danger/30"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setConfirmText(""); onClose(); }}
                    className="flex-1 py-2.5 rounded-xl border border-vault-border
                               text-sm font-medium text-gray-300
                               hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleDelete}
                    disabled={!canDelete || submitting}
                    whileTap={canDelete ? { scale: 0.98 } : {}}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                      canDelete && !submitting
                        ? "bg-vault-danger text-white"
                        : "bg-vault-border text-gray-500 cursor-not-allowed"
                    )}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      "Delete Permanently"
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
