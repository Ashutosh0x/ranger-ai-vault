"use client";

import { useRef } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DualEngine } from "@/components/landing/DualEngine";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { LiveSignalPreview } from "@/components/landing/LiveSignalPreview";
import { PerformanceSection } from "@/components/landing/PerformanceSection";
import { AttestationProof } from "@/components/landing/AttestationProof";
import { RiskFramework } from "@/components/landing/RiskFramework";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  const howRef = useRef<HTMLDivElement>(null);
  const performanceRef = useRef<HTMLDivElement>(null);
  const riskRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-vault-bg">
      <Navbar
        sections={{ howRef, performanceRef, riskRef }}
      />
      <Hero />
      <StatsBar />
      <div ref={howRef}>
        <HowItWorks />
      </div>
      <DualEngine />
      <FeatureGrid />
      <LiveSignalPreview />
      <div ref={performanceRef}>
        <PerformanceSection />
      </div>
      <AttestationProof />
      <div ref={riskRef}>
        <RiskFramework />
      </div>
      <CTASection />
      <Footer />
    </div>
  );
}
