"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, BookOpen, Code2, Shield, Layers, Wallet,
  ExternalLink, ChevronRight, Cpu, GitBranch, FileText,
  Zap, Database, Settings, ArrowRight, Bot, Globe,
  Terminal, Lock, BarChart3, Users, Plug, ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageTransition } from "@/components/motion/PageTransition";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { ScaleOnHover } from "@/components/motion/ScaleOnHover";
import {
  fadeInUp, staggerContainer, heroText,
} from "@/lib/animations";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   DATA — All documentation entries
───────────────────────────────────────────── */

interface DocEntry {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  tags: string[];
  category: string;
  isExternal?: boolean;
}

const CATEGORIES = [
  "All",
  "Getting Started",
  "Vault Owners",
  "For Developers",
  "For DeFi Protocols",
  "AI Integration",
  "Security",
  "Hackathon",
] as const;

type Category = (typeof CATEGORIES)[number];

const DOCS: DocEntry[] = [
  // ── Getting Started ─────────────────────────
  {
    title: "Introduction to Ranger Earn",
    description:
      "Modular infrastructure layer for structured yield strategies on Solana. Overview of Ranger Earn and the Voltr vault framework.",
    href: "https://docs.ranger.finance",
    icon: BookOpen,
    tags: ["overview", "introduction", "ranger", "earn", "solana"],
    category: "Getting Started",
    isExternal: true,
  },
  {
    title: "Introduction to Voltr",
    description:
      "Permissionless framework enabling anyone — from hedge funds to boutique funds — to create and manage yield-generating vaults on Solana.",
    href: "https://docs.voltr.xyz/docs/",
    icon: Layers,
    tags: ["voltr", "vaults", "overview", "permissionless", "yield"],
    category: "Getting Started",
    isExternal: true,
  },
  {
    title: "Build-A-Bear Hackathon Guide",
    description:
      "Up to $1M in vault TVL seed funding. Full hackathon rules, submission requirements, prize eligibility, judging criteria, and timeline.",
    href: "https://superteam.fun/earn/listing/ranger-build-a-bear-hackathon-main-track/",
    icon: Zap,
    tags: ["hackathon", "prizes", "submission", "build-a-bear", "superteam"],
    category: "Hackathon",
    isExternal: true,
  },
  {
    title: "Hackathon Landing Page",
    description:
      "Official Build-A-Bear Hackathon landing page with registration, timeline, and sponsor details.",
    href: "https://ranger.finance/build-a-bear-hackathon",
    icon: Globe,
    tags: ["hackathon", "register", "ranger", "landing"],
    category: "Hackathon",
    isExternal: true,
  },

  // ── Vault Owners ────────────────────────────
  {
    title: "Owner Overview",
    description:
      "Complete guide for vault owners — roles, responsibilities, and how to manage your Voltr vault.",
    href: "https://docs.voltr.xyz/docs/for-vault-owners/owner-overview",
    icon: Users,
    tags: ["owner", "vault", "roles", "management"],
    category: "Vault Owners",
    isExternal: true,
  },
  {
    title: "Supported Integrations",
    description:
      "Protocols integrated with Voltr: Zeta, Marginfi, Solend, Kamino (Klend), and more. See which adaptors are available.",
    href: "https://docs.voltr.xyz/docs/for-vault-owners/supported-integrations",
    icon: Plug,
    tags: ["integrations", "zeta", "marginfi", "solend", "kamino", "klend"],
    category: "Vault Owners",
    isExternal: true,
  },
  {
    title: "Fees & Accounting",
    description:
      "Management fees, performance fees, issuance fees, redemption fees — full breakdown of the Voltr fee model and high-water-mark accounting.",
    href: "https://docs.voltr.xyz/docs/for-vault-owners/fees-and-accounting",
    icon: BarChart3,
    tags: ["fees", "accounting", "performance", "management", "hwm"],
    category: "Vault Owners",
    isExternal: true,
  },
  {
    title: "Vault Initialization Guide",
    description:
      "Step-by-step walkthrough to create and initialize a new Voltr vault with configuration parameters.",
    href: "https://docs.voltr.xyz/docs/for-vault-owners/vault-initialization-guide",
    icon: Settings,
    tags: ["initialize", "create", "vault", "setup", "config"],
    category: "Vault Owners",
    isExternal: true,
  },
  {
    title: "Strategy Setup Guide",
    description:
      "How to add adaptors, initialize strategies (Solend, Marginfi, Klend, Zeta), and configure direct withdrawal.",
    href: "https://docs.voltr.xyz/docs/for-vault-owners/strategy-setup-guide",
    icon: GitBranch,
    tags: ["strategy", "setup", "adaptor", "direct-withdraw"],
    category: "Vault Owners",
    isExternal: true,
  },
  {
    title: "Fund Allocation Guide",
    description:
      "Manager deposit/withdraw from strategies, rebalancing logic, and yield generation mechanics.",
    href: "https://docs.voltr.xyz/docs/for-vault-owners/fund-allocation-guide",
    icon: Database,
    tags: ["allocation", "rebalance", "deposit", "withdraw", "manager"],
    category: "Vault Owners",
    isExternal: true,
  },
  {
    title: "Vault Operations",
    description:
      "Day-to-day vault operations — config updates, fee harvesting, high-water-mark calibration, and LP tracking.",
    href: "https://docs.voltr.xyz/docs/for-vault-owners/vault-operations",
    icon: Settings,
    tags: ["operations", "harvest", "calibrate", "config", "update"],
    category: "Vault Owners",
    isExternal: true,
  },
  {
    title: "Go-To-Market",
    description:
      "Strategies for marketing your vault, attracting depositors, and building TVL.",
    href: "https://docs.voltr.xyz/docs/for-vault-owners/go-to-market",
    icon: Globe,
    tags: ["marketing", "gtm", "tvl", "growth", "depositors"],
    category: "Vault Owners",
    isExternal: true,
  },
  {
    title: "Frontend Integration Guide",
    description:
      "Integrate a Voltr vault into your frontend — deposit/withdraw UIs, LP token display, and performance charts.",
    href: "https://docs.voltr.xyz/docs/for-vault-owners/frontend-integration-guide",
    icon: Layers,
    tags: ["frontend", "integration", "ui", "deposit", "withdraw"],
    category: "Vault Owners",
    isExternal: true,
  },

  // ── For Developers ──────────────────────────
  {
    title: "API Overview",
    description:
      "Voltr REST API — query vault data, calculate metrics, and build unsigned transactions. Base URL: api.voltr.xyz. Public, no API key required.",
    href: "https://docs.voltr.xyz/docs/for-developers/api-overview",
    icon: Code2,
    tags: ["api", "rest", "endpoints", "transactions", "query"],
    category: "For Developers",
    isExternal: true,
  },
  {
    title: "SDK Reference",
    description:
      "TypeScript SDK (@voltr/vault-sdk) — vault management, strategy handling, deposits, withdrawals, PDA utilities, and position tracking.",
    href: "https://docs.voltr.xyz/docs/for-developers/sdk-reference",
    icon: Terminal,
    tags: ["sdk", "typescript", "npm", "vault-sdk", "client"],
    category: "For Developers",
    isExternal: true,
  },
  {
    title: "SDK API Docs (TypeDoc)",
    description:
      "Full TypeDoc-generated API reference for the @voltr/vault-sdk package with all methods, types, and examples.",
    href: "https://voltrxyz.github.io/vault-sdk/",
    icon: FileText,
    tags: ["typedoc", "sdk", "reference", "methods", "types"],
    category: "For Developers",
    isExternal: true,
  },
  {
    title: "Vaults Endpoint",
    description:
      "GET /vaults — list all vaults, query vault metadata, APY, TVL, and strategy breakdowns.",
    href: "https://docs.voltr.xyz/docs/for-developers/vaults-endpoint",
    icon: Database,
    tags: ["vaults", "endpoint", "list", "query", "metadata"],
    category: "For Developers",
    isExternal: true,
  },
  {
    title: "Vault Endpoint",
    description:
      "GET /vault/{pubkey} — single vault details, deposit/withdraw transaction building, and strategy positions.",
    href: "https://docs.voltr.xyz/docs/for-developers/vault-endpoint",
    icon: Database,
    tags: ["vault", "endpoint", "detail", "deposit", "withdraw"],
    category: "For Developers",
    isExternal: true,
  },
  {
    title: "Swagger Documentation",
    description:
      "Interactive API explorer at api.voltr.xyz/docs — test all endpoints live with your Solana wallet.",
    href: "https://api.voltr.xyz/docs",
    icon: Zap,
    tags: ["swagger", "openapi", "interactive", "test", "live"],
    category: "For Developers",
    isExternal: true,
  },
  {
    title: "Client Scripts (GitHub)",
    description:
      "Collection of scripts for vault initialization, strategy setup, deposits, and withdrawals. Supports Solend, Marginfi, Klend, and Zeta.",
    href: "https://github.com/voltrxyz/client-scripts",
    icon: Terminal,
    tags: ["scripts", "github", "cli", "initialize", "deposit"],
    category: "For Developers",
    isExternal: true,
  },
  {
    title: "Voltr GitHub Organization",
    description:
      "All 14 Voltr repositories — vault-sdk, client-scripts, solana-agent-kit, farm-program, vault-cpi, and more.",
    href: "https://github.com/voltrxyz",
    icon: GitBranch,
    tags: ["github", "repositories", "source", "code", "open-source"],
    category: "For Developers",
    isExternal: true,
  },

  // ── For DeFi Protocols ──────────────────────
  {
    title: "DeFi Protocol Overview",
    description:
      "How DeFi protocols can integrate with Voltr — become a yield source for vault strategies.",
    href: "https://docs.voltr.xyz/docs/for-defi-protocols/defi-protocol-overview",
    icon: Globe,
    tags: ["defi", "protocol", "integration", "yield-source"],
    category: "For DeFi Protocols",
    isExternal: true,
  },
  {
    title: "Adaptor Creation Guide",
    description:
      "Build a custom adaptor to integrate your protocol with Voltr vaults. Technical guide for adaptor development.",
    href: "https://docs.voltr.xyz/docs/for-defi-protocols/adaptor-creation-guide",
    icon: Plug,
    tags: ["adaptor", "custom", "create", "build", "integration"],
    category: "For DeFi Protocols",
    isExternal: true,
  },
  {
    title: "CPI Integration Guide",
    description:
      "Cross-Program Invocation guide — compose with Ranger Vaults via CPI from your Solana program.",
    href: "https://docs.voltr.xyz/docs/for-defi-protocols/cpi-integration-guide",
    icon: Code2,
    tags: ["cpi", "cross-program", "compose", "solana", "program"],
    category: "For DeFi Protocols",
    isExternal: true,
  },

  // ── AI Integration ──────────────────────────
  {
    title: "Solana Agent Kit Integration",
    description:
      "How AI agents interact with Voltr vaults — strategy deposits, withdrawals, and autonomous rebalancing via Solana Agent Kit.",
    href: "https://docs.voltr.xyz/docs/for-developers/vaults-technical-guide/fund-allocation/solana-agent-kit",
    icon: Bot,
    tags: ["ai", "agent", "solana-agent-kit", "autonomous", "rebalance"],
    category: "AI Integration",
    isExternal: true,
  },
  {
    title: "AI16Z Integration",
    description:
      "AI16Z framework integration with Voltr vaults for autonomous vault management.",
    href: "https://docs.voltr.xyz/docs/for-developers/vaults-technical-guide/fund-allocation/ai16z",
    icon: Bot,
    tags: ["ai16z", "ai", "framework", "autonomous"],
    category: "AI Integration",
    isExternal: true,
  },
  {
    title: "Zerebro Integration",
    description:
      "Zerebro AI integration guide for automated vault strategy execution.",
    href: "https://docs.voltr.xyz/docs/for-developers/vaults-technical-guide/fund-allocation/zerebro",
    icon: Cpu,
    tags: ["zerebro", "ai", "automated", "strategy"],
    category: "AI Integration",
    isExternal: true,
  },

  // ── Security ────────────────────────────────
  {
    title: "Security Best Practices",
    description:
      "Vault security guidelines — keypair management, role separation, access controls, and operational security.",
    href: "https://docs.voltr.xyz/docs/security/best-practices",
    icon: Shield,
    tags: ["security", "best-practices", "keypair", "access-control"],
    category: "Security",
    isExternal: true,
  },
  {
    title: "Deployed Programs",
    description:
      "Verified on-chain program addresses for Voltr vault contracts on Solana mainnet and devnet.",
    href: "https://docs.voltr.xyz/docs/security/deployed-programs",
    icon: Lock,
    tags: ["deployed", "programs", "addresses", "mainnet", "devnet"],
    category: "Security",
    isExternal: true,
  },
  {
    title: "Security Audits",
    description:
      "Third-party security audit reports for the Voltr protocol.",
    href: "https://docs.voltr.xyz/docs/security/security-audits",
    icon: Shield,
    tags: ["audits", "security", "third-party", "reports"],
    category: "Security",
    isExternal: true,
  },

  // ── Hackathon Resources ─────────────────────
  {
    title: "Zeta Documentation",
    description:
      "Zeta protocol docs — perps, spot markets, and vault strategies. Essential for the Zeta Side Track.",
    href: "https://docs.zeta.markets",
    icon: BookOpen,
    tags: ["zeta", "perps", "spot", "documentation", "side-track"],
    category: "Hackathon",
    isExternal: true,
  },
  {
    title: "Cobo Documentation",
    description:
      "Cobo MPC wallet infrastructure docs — free testing accounts for all hackathon participants.",
    href: "https://www.cobo.com/developers",
    icon: Wallet,
    tags: ["cobo", "mpc", "wallet", "infrastructure"],
    category: "Hackathon",
    isExternal: true,
  },
  {
    title: "Zeta Side Track",
    description:
      "Separate submission for the Zeta Side Track — up to $200K in additional vault seeding prizes.",
    href: "https://superteam.fun/earn/listing/ranger-build-a-bear-hackathon-zeta-side-track/",
    icon: Zap,
    tags: ["zeta", "side-track", "hackathon", "submission", "prizes"],
    category: "Hackathon",
    isExternal: true,
  },
  {
    title: "Superteam Earn Platform",
    description:
      "Discover bounties, projects, and grants from top Solana companies. Submit hackathon entries here.",
    href: "https://superteam.fun/earn/",
    icon: Globe,
    tags: ["superteam", "earn", "bounties", "grants", "projects"],
    category: "Hackathon",
    isExternal: true,
  },
];

/* ─────────────────────────────────────────────
   SEARCH + FILTER LOGIC
───────────────────────────────────────────── */

function filterDocs(
  docs: DocEntry[],
  query: string,
  category: Category
): DocEntry[] {
  let filtered = docs;

  if (category !== "All") {
    filtered = filtered.filter((d) => d.category === category);
  }

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.some((t) => t.includes(q)) ||
        d.category.toLowerCase().includes(q)
    );
  }

  return filtered;
}

/* ─────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────── */

function DocCard({ doc, index }: { doc: DocEntry; index: number }) {
  const Icon = doc.icon;
  return (
    <motion.div variants={fadeInUp} custom={index}>
      <ScaleOnHover>
        <Link
          href={doc.href}
          target={doc.isExternal ? "_blank" : undefined}
          rel={doc.isExternal ? "noopener noreferrer" : undefined}
          className="group block h-full"
        >
          <div
            className="h-full glass-card p-5 border-glow transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center
                              rounded-lg bg-vault-accent/10 text-vault-accent
                              group-hover:bg-vault-accent/20 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    className="font-semibold text-sm text-white
                               group-hover:text-vault-accent transition-colors
                               leading-tight"
                  >
                    {doc.title}
                  </h3>
                  <span
                    className="text-[10px] font-medium text-gray-500
                               uppercase tracking-wider mt-0.5 block"
                  >
                    {doc.category}
                  </span>
                </div>
              </div>
              {doc.isExternal && (
                <ExternalLink
                  className="h-3.5 w-3.5 text-gray-500
                             opacity-0 group-hover:opacity-100
                             transition-opacity flex-shrink-0 mt-1"
                />
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-3">
              {doc.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {doc.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full
                             bg-vault-border/60 px-2 py-0.5 text-[10px]
                             font-medium text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Read More */}
            <div
              className="mt-3 flex items-center gap-1 text-xs
                          font-medium text-vault-accent opacity-0
                          group-hover:opacity-100 transition-opacity"
            >
              Read docs <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </Link>
      </ScaleOnHover>
    </motion.div>
  );
}

function CategoryPill({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5",
        "text-xs font-medium transition-colors whitespace-nowrap",
        active
          ? "bg-vault-accent text-vault-bg shadow-sm shadow-vault-accent/20"
          : "bg-vault-border/60 text-gray-400 hover:bg-vault-border hover:text-white"
      )}
    >
      {label}
      <span
        className={cn(
          "inline-flex h-4 min-w-[16px] items-center justify-center",
          "rounded-full px-1 text-[10px] font-bold",
          active
            ? "bg-vault-bg/20 text-vault-bg"
            : "bg-gray-600/30 text-gray-500"
        )}
      >
        {count}
      </span>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────
   QUICK LINKS
───────────────────────────────────────────── */

const QUICK_LINKS = [
  {
    title: "Ranger Earn Docs",
    description: "Official documentation for Ranger Earn yield infrastructure",
    href: "https://docs.ranger.finance",
    icon: BookOpen,
    gradient: "from-emerald-500/20 to-teal-500/10",
  },
  {
    title: "Voltr SDK",
    description: "TypeScript SDK for building on Voltr vaults",
    href: "https://voltrxyz.github.io/vault-sdk/",
    icon: Code2,
    gradient: "from-blue-500/20 to-indigo-500/10",
  },
  {
    title: "Voltr API",
    description: "REST API — query vaults, build transactions",
    href: "https://api.voltr.xyz/docs",
    icon: Zap,
    gradient: "from-amber-500/20 to-orange-500/10",
  },
  {
    title: "GitHub",
    description: "14 open-source repos for vault development",
    href: "https://github.com/voltrxyz",
    icon: GitBranch,
    gradient: "from-purple-500/20 to-pink-500/10",
  },
];

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filteredDocs = useMemo(
    () => filterDocs(DOCS, searchQuery, activeCategory),
    [searchQuery, activeCategory]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: DOCS.length };
    DOCS.forEach((d) => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-vault-bg">
        {/* ── Back Nav ────────────────────────── */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-vault-bg/90 backdrop-blur-xl border-b border-vault-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-400
                         hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <Zap className="w-4 h-4 text-vault-accent" />
              <span className="font-semibold text-white">Ranger AI Vault</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/overview"
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/vault"
                className="text-xs px-3 py-1.5 rounded-lg bg-vault-accent
                           text-vault-bg font-semibold hover:bg-vault-accent/90
                           transition-colors"
              >
                Deposit
              </Link>
            </div>
          </div>
        </div>

        {/* ── Hero Section ────────────────────── */}
        <section
          className="relative border-b border-vault-border"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,214,160,0.03) 0%, transparent 100%)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-12">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <motion.div variants={heroText} className="mb-4">
                <span
                  className="inline-flex items-center gap-2 rounded-full
                             bg-vault-accent/10 px-4 py-1.5 text-xs font-medium
                             text-vault-accent"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Documentation & Resources
                </span>
              </motion.div>

              <motion.h1
                variants={heroText}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold
                           tracking-tight leading-[1.1] mb-4"
              >
                <span className="text-white">Ranger Earn </span>
                <span className="text-gradient-primary">Documentation</span>
              </motion.h1>

              <motion.p
                variants={heroText}
                className="text-base text-gray-400 max-w-2xl mx-auto mb-8"
              >
                Everything you need to build, deploy, and manage vault
                strategies on Solana — from SDK references to AI agent
                integration guides.
              </motion.p>

              {/* Search Bar */}
              <motion.div variants={heroText} className="max-w-xl mx-auto">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2
                               h-4 w-4 text-gray-500"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search docs — try 'SDK', 'deposit', 'AI agent', 'security'..."
                    className="w-full rounded-xl border border-vault-border
                               bg-vault-card/80 backdrop-blur-sm pl-11 pr-4 py-3
                               text-sm text-white placeholder:text-gray-500
                               focus:outline-none focus:ring-2
                               focus:ring-vault-accent/30
                               focus:border-vault-accent/50
                               transition-all glow-focus"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-xs text-gray-500 hover:text-white
                                 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Quick Links ─────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
          <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_LINKS.map((link) => (
              <StaggerItem key={link.href}>
                <ScaleOnHover>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div
                      className={cn(
                        "rounded-xl border border-vault-border p-4",
                        "bg-gradient-to-br",
                        link.gradient,
                        "hover:border-vault-accent/30 transition-colors"
                      )}
                    >
                      <link.icon className="h-5 w-5 text-white mb-2" />
                      <h3 className="text-sm font-semibold text-white mb-0.5">
                        {link.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 leading-snug">
                        {link.description}
                      </p>
                      <div
                        className="mt-2 flex items-center gap-1 text-[11px]
                                    font-medium text-vault-accent opacity-0
                                    group-hover:opacity-100 transition-opacity"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                </ScaleOnHover>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </section>

        {/* ── Category Filters ────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 mb-6">
          <FadeIn delay={0.1}>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <CategoryPill
                  key={cat}
                  label={cat}
                  active={activeCategory === cat}
                  count={categoryCounts[cat] || 0}
                  onClick={() => setActiveCategory(cat)}
                />
              ))}
            </div>
          </FadeIn>
        </section>

        {/* ── Results Count ───────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {filteredDocs.length}{" "}
              {filteredDocs.length === 1 ? "doc" : "docs"} found
              {searchQuery && (
                <span>
                  {" "}
                  for &ldquo;
                  <span className="text-white">{searchQuery}</span>&rdquo;
                </span>
              )}
              {activeCategory !== "All" && (
                <span>
                  {" "}
                  in{" "}
                  <span className="text-white">{activeCategory}</span>
                </span>
              )}
            </p>
          </div>
        </section>

        {/* ── Doc Cards Grid ──────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <AnimatePresence mode="wait">
            {filteredDocs.length > 0 ? (
              <motion.div
                key={`${activeCategory}-${searchQuery}`}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredDocs.map((doc, i) => (
                  <DocCard key={doc.href} doc={doc} index={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <Search className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-1">
                  No docs match your search
                </p>
                <p className="text-xs text-gray-500">
                  Try a different keyword or category
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                  className="mt-4 text-xs font-medium text-vault-accent
                             hover:underline"
                >
                  Reset filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── CTA Footer ──────────────────────── */}
        <section className="border-t border-vault-border bg-vault-card/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <FadeIn>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Need Help Building?
                </h2>
                <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                  Join the Ranger Telegram for technical support, workshop
                  recordings, and direct access to the team.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <motion.a
                    href="https://t.me/ranger_finance"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5
                               rounded-lg bg-vault-accent text-vault-bg
                               text-sm font-medium shadow-sm
                               shadow-vault-accent/20"
                  >
                    Join Telegram
                    <ArrowRight className="h-4 w-4" />
                  </motion.a>
                  <motion.a
                    href="https://docs.ranger.finance"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5
                               rounded-lg border border-vault-border
                               text-sm font-medium text-white
                               hover:bg-white/5 transition-colors"
                  >
                    Full Documentation
                    <ExternalLink className="h-3.5 w-3.5" />
                  </motion.a>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
