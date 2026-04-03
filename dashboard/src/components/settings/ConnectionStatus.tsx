// components/settings/ConnectionStatus.tsx
"use client";

import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2, CircleDot, Clock } from "lucide-react";
import type { ConnectionState } from "@/types/settings";
import { cn } from "@/lib/utils";

interface Props {
  state: ConnectionState;
  latencyMs?: number;
  message?: string;
  compact?: boolean;
}

const stateConfig: Record<
  ConnectionState,
  { icon: React.ElementType; color: string; label: string; dotColor: string }
> = {
  untested: {
    icon: CircleDot,
    color: "text-gray-500",
    label: "Not tested",
    dotColor: "bg-gray-500",
  },
  testing: {
    icon: Loader2,
    color: "text-blue-400",
    label: "Testing...",
    dotColor: "bg-blue-400",
  },
  connected: {
    icon: CheckCircle2,
    color: "text-vault-accent",
    label: "Connected",
    dotColor: "bg-vault-accent",
  },
  error: {
    icon: XCircle,
    color: "text-vault-danger",
    label: "Error",
    dotColor: "bg-vault-danger",
  },
  timeout: {
    icon: Clock,
    color: "text-vault-warning",
    label: "Timeout",
    dotColor: "bg-vault-warning",
  },
};

export function ConnectionStatus({ state, latencyMs, message, compact }: Props) {
  const config = stateConfig[state];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          {state === "connected" && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                config.dotColor
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              config.dotColor
            )}
          />
        </span>
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
        {latencyMs !== undefined && state === "connected" && (
          <span className="text-[10px] text-gray-500">{latencyMs}ms</span>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2",
        state === "connected" && "bg-vault-accent/10",
        state === "error" && "bg-vault-danger/10",
        state === "timeout" && "bg-vault-warning/10",
        state === "testing" && "bg-blue-500/10",
        state === "untested" && "bg-vault-border/20"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0",
          config.color,
          state === "testing" && "animate-spin"
        )}
      />
      <div className="flex-1 min-w-0">
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
        {message && (
          <p className="text-[10px] text-gray-500 truncate mt-0.5">{message}</p>
        )}
      </div>
      {latencyMs !== undefined && state === "connected" && (
        <span className="text-[10px] text-gray-500 whitespace-nowrap">
          {latencyMs}ms
        </span>
      )}
    </motion.div>
  );
}
