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
    <div className="bg-lavender-100 text-headingtext min-h-screen selection:bg-lavender-300 selection:text-lavender-900">
      {/* 1. Floating Lavender Glass Navbar */}
      <Navbar health={health} onOpenWorkspace={handleOpenWorkspace} />

      {/* 2. Dedicated Cinematic Lavender Landing Page Hero */}
      <Hero
        health={health}
        onOpenWorkspace={handleOpenWorkspace}
        onStartVoice={handleOpenWorkspace}
      />

      {/* 3. Four Core Capabilities */}
      <CapabilitiesSection />

      {/* 4. Four Steps: How It Works Timeline */}
      <HowItWorksSection />

      {/* 5. Launch Assistant & Interactive Support Console */}
      <SupportWorkspace
        health={health}
        initialPrompt={queuedPrompt}
        onClearInitialPrompt={() => setQueuedPrompt("")}
      />

      {/* 6. Evaluation Dashboard & Live Precedence Inspector */}
      <DeveloperDrawer />

      {/* 7. Organized Capstone Deliverables Checklist */}
      <DeliverablesSection />

      {/* 8. Footer with Made by — Debosmita */}
      <Footer />
    </div>
  );
};

export default App;
