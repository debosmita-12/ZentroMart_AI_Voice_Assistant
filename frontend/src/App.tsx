import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { CapabilitiesSection } from "./components/CapabilitiesSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { SupportWorkspace } from "./components/SupportWorkspace";
import { DeveloperDrawer } from "./components/DeveloperDrawer";
import { Footer } from "./components/Footer";
import { BackendHealth } from "./types";

export const App: React.FC = () => {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [queuedPrompt, setQueuedPrompt] = useState<string>("");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => {
        console.warn("Backend not reached yet, using default state", err);
      });
  }, []);

  const handleOpenWorkspace = () => {
    const el = document.getElementById("support-workspace");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmitPrompt = (text: string) => {
    setQueuedPrompt(text);
    handleOpenWorkspace();
  };

  return (
    <div className="bg-black text-white min-h-screen selection:bg-white/20 selection:text-white">
      {/* 1. Floating Liquid Glass Navbar */}
      <Navbar health={health} onOpenWorkspace={handleOpenWorkspace} />

      {/* 2. Full-Screen Cinematic Hero */}
      <Hero
        onSubmitPrompt={handleSubmitPrompt}
        onOpenWorkspace={handleOpenWorkspace}
        onStartVoice={handleOpenWorkspace}
      />

      {/* 3. Concise Capabilities Section */}
      <CapabilitiesSection />

      {/* 4. Four Steps: How It Works */}
      <HowItWorksSection />

      {/* 5. Support Workspace (Conversation & Voice Console) */}
      <SupportWorkspace
        health={health}
        initialPrompt={queuedPrompt}
        onClearInitialPrompt={() => setQueuedPrompt("")}
      />

      {/* 6. Developer Drawer / Evaluation Benchmarks */}
      <DeveloperDrawer />

      {/* 7. Footer */}
      <Footer />
    </div>
  );
};

export default App;
