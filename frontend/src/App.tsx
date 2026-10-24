import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { CapabilitiesSection } from "./components/CapabilitiesSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { SupportWorkspace } from "./components/SupportWorkspace";
import { DeveloperDrawer } from "./components/DeveloperDrawer";
import { DeliverablesSection } from "./components/DeliverablesSection";
import { Footer } from "./components/Footer";
import { BackendHealth } from "./types";
import { apiUrl, API_BASE_URL } from "./config/api";

export const App: React.FC = () => {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [queuedPrompt, setQueuedPrompt] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    let timer: any = null;

    const checkHealth = async () => {
      try {
        const res = await fetch(apiUrl("/api/health"));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted) {
          setHealth(data);
          setConnectionError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setConnectionError("Connecting to backend");
          // Poll every 5s while waiting for Render service to wake up
          timer = setTimeout(checkHealth, 5000);
        }
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleOpenWorkspace = () => {
    const el = document.getElementById("support-workspace");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-[#F5F1E9] text-[#292621] min-h-screen selection:bg-[#C9A77B]/30 selection:text-[#292621]">
      {/* Backend Spin-up Notice for Render Cold Starts in Warm Glass */}
      {connectionError && !health && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm p-3.5 rounded-2xl warm-glass border border-[#DDD3C2] shadow-warmLg text-xs text-[#292621] flex items-center gap-2.5 animate-in fade-in duration-300 bg-white/90">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C9A77B] animate-ping flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-[#292621]">Connecting to Backend</p>
            <p className="text-[11px] text-[#777064] mt-0.5">
              Connecting to {API_BASE_URL || "backend"}. Render cloud instance may take ~30s to wake up.
            </p>
          </div>
        </div>
      )}

      {/* 1. Floating Warm Glass Navbar */}
      <Navbar health={health} onOpenWorkspace={handleOpenWorkspace} />

      {/* 2. Sculptural 3D Warm Ivory & Champagne Hero */}
      <Hero
        health={health}
        onOpenWorkspace={handleOpenWorkspace}
        onStartVoice={handleOpenWorkspace}
      />

      {/* 3. Core Capabilities in Warm Translucent Glass */}
      <CapabilitiesSection />

      {/* 4. Five Stages: How It Works Visual Pipeline */}
      <HowItWorksSection />

      {/* 5. Interactive Support Console & Voice Assistant */}
      <SupportWorkspace
        health={health}
        initialPrompt={queuedPrompt}
        onClearInitialPrompt={() => setQueuedPrompt("")}
      />

      {/* 6. Evaluation Benchmarks & Live Precedence Inspector */}
      <DeveloperDrawer />

      {/* 7. Organized Capstone Deliverables Checklist */}
      <DeliverablesSection />

      {/* 8. Minimalist Footer with Made by — Debosmita */}
      <Footer />
    </div>
  );
};

export default App;
