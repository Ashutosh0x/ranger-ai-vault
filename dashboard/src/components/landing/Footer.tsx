"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { ExternalLink, Zap } from "lucide-react";

const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
const VAULT = process.env.NEXT_PUBLIC_VAULT_ADDRESS || "";

const LINKS = {
  project: [
    { label: "Dashboard", href: "/overview" },
    { label: "Vault", href: "/vault" },
    { label: "Signals", href: "/signals" },
    { label: "Risk", href: "/risk" },
  ],
  resources: [
    { label: "Architecture", href: "/docs/architecture", external: false },
    {
      label: "GitHub",
      href: "https://github.com/Ashutosh0x/ranger-ai-vault",
      external: true,
    },
    { label: "Demo Video", href: "#", external: true },
  ],
  ecosystem: [
    {
      label: "Ranger Finance",
      href: "https://ranger.finance",
      external: true,
    },
    {
      label: "Ranger Docs",
      href: "https://docs.ranger.finance",
      external: true,
    },
    {
      label: "Drift Protocol",
      href: "https://drift.trade",
      external: true,
    },
    {
      label: "Kamino Finance",
      href: "https://app.kamino.finance",
      external: true,
    },
  ],
};

export function Footer() {
  const cluster = NETWORK === "mainnet-beta" ? "" : `?cluster=${NETWORK}`;

  return (
    <footer
      className="border-t border-vault-border"
      style={{ background: "rgba(17,24,39,0.5)" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        <FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-7 h-7 rounded-lg bg-vault-accent/10 border
                              border-vault-accent/30 flex items-center justify-center"
                >
                  <Zap className="w-3.5 h-3.5 text-vault-accent" />
                </div>
                <span className="font-semibold text-sm">Ranger AI Vault</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                AI-Powered Momentum with Mean-Reversion Hybrid Yield Vault on
                Solana.
              </p>
              {VAULT && VAULT !== "FILL_AFTER_DEPLOY" && (
                <a
                  href={`https://solscan.io/account/${VAULT}${cluster}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-vault-accent
                             hover:underline mt-3"
                >
                  View on Solscan <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Link columns */}
            {Object.entries(LINKS).map(([section, links]) => (
              <div key={section}>
                <h4 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-4">
                  {section}
                </h4>
                <ul className="space-y-2">
                  {links.map(
                    ({
                      label,
                      href,
                      external,
                    }: {
                      label: string;
                      href: string;
                      external?: boolean;
                    }) => (
                      <li key={label}>
                        <a
                          href={href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="text-sm text-gray-400 hover:text-white
                                     transition-colors inline-flex items-center gap-1"
                        >
                          {label}
                          {external && (
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          )}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="border-t border-vault-border pt-6 flex
                        items-center justify-center"
          >
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {/* Twitter / X */}
              <a
                href="https://x.com/AshutoshSingh0x"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2 rounded-lg border border-vault-border/40
                           hover:border-vault-accent/40 hover:bg-vault-accent/5
                           transition-all"
                title="Twitter / X"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/Ashutosh0x/ranger-ai-vault"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2 rounded-lg border border-vault-border/40
                           hover:border-vault-accent/40 hover:bg-vault-accent/5
                           transition-all"
                title="GitHub"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.gg/ranger"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2 rounded-lg border border-vault-border/40
                           hover:border-vault-accent/40 hover:bg-vault-accent/5
                           transition-all"
                title="Discord"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                </svg>
              </a>

              {/* Telegram */}
              <a
                href="https://t.me/rangerfinance"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2 rounded-lg border border-vault-border/40
                           hover:border-vault-accent/40 hover:bg-vault-accent/5
                           transition-all"
                title="Telegram"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="currentColor">
                  <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </footer>
  );
}
