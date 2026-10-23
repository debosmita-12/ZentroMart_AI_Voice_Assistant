import React, { useState } from "react";
import { Sparkles, Menu, X, Bot, Activity } from "lucide-react";
import { BackendHealth } from "../types";

interface NavbarProps {
  health: BackendHealth | null;
  onOpenWorkspace: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, onOpenWorkspace }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-6 left-0 right-0 z-50 px-4 sm:px-6">
      <nav className="liquid-glass rounded-full max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <a href="#hero" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:bg-white/15 transition-all">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-medium text-base sm:text-lg tracking-tight">
            ZentroMart <span className="text-white/60 font-light">AI</span>
          </span>
        </a>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#hero"
            className="text-white/70 hover:text-white text-xs uppercase tracking-wider transition-colors"
          >
            Home
          </a>
          <a
            href="#capabilities"
            className="text-white/70 hover:text-white text-xs uppercase tracking-wider transition-colors"
          >
            Capabilities
          </a>
          <a
            href="#how-it-works"
            className="text-white/70 hover:text-white text-xs uppercase tracking-wider transition-colors"
          >
            How it works
          </a>
          <a
            href="#support-workspace"
            onClick={onOpenWorkspace}
            className="text-white/70 hover:text-white text-xs uppercase tracking-wider transition-colors"
          >
            Voice Assistant
          </a>
          <a
            href="#developer"
            className="text-white/70 hover:text-white text-xs uppercase tracking-wider transition-colors"
          >
            Evaluation
          </a>
        </div>

        {/* Right: Actions and Live Status */}
        <div className="flex items-center gap-3">
          {health && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/70"
              title={
                health.gnani_configured
                  ? "Gnani Voice Engine Connected"
                  : "RAG & Gemini Connected (Gnani Voice Key Pending)"
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  health.gnani_configured ? "bg-emerald-400" : "bg-amber-400"
                } animate-pulse`}
              />
              <span>{health.gnani_configured ? "Voice Ready" : "Text Ready"}</span>
            </div>
          )}

          <button
            onClick={() => {
              onOpenWorkspace();
              const el = document.getElementById("support-workspace");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="liquid-glass liquid-glass-interactive px-5 py-2 rounded-full text-xs font-medium text-white flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Start chatting</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 max-w-5xl mx-auto liquid-glass rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <a
            href="#hero"
            onClick={() => setMobileMenuOpen(false)}
            className="text-white/80 hover:text-white text-sm"
          >
            Home
          </a>
          <a
            href="#capabilities"
            onClick={() => setMobileMenuOpen(false)}
            className="text-white/80 hover:text-white text-sm"
          >
            Capabilities
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="text-white/80 hover:text-white text-sm"
          >
            How it works
          </a>
          <a
            href="#support-workspace"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenWorkspace();
            }}
            className="text-white/80 hover:text-white text-sm"
          >
            Voice Assistant
          </a>
          <a
            href="#developer"
            onClick={() => setMobileMenuOpen(false)}
            className="text-white/80 hover:text-white text-sm"
          >
            Evaluation & Metrics
          </a>
        </div>
      )}
    </header>
  );
};
