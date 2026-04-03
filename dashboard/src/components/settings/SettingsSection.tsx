// components/settings/SettingsSection.tsx
"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
  className,
  action,
}: Props) {
  return (
    <FadeIn>
      <div className={cn("glass-card overflow-hidden", className)}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-vault-border/40">
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          {action}
        </div>
        <div className="p-5">{children}</div>
      </div>
    </FadeIn>
  );
}
