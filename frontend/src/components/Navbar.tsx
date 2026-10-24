import React, { useState } from "react";
import { Sparkles, Menu, X } from "lucide-react";
import { BackendHealth } from "../types";

interface NavbarProps {
  health: BackendHealth | null;
  onOpenWorkspace: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, onOpenWorkspace }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-5 left-0 right-0 z-50 px-4 sm:px-6">
      <nav className="liquid-glass rounded-full max-w-5xl mx-auto px-5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-organicGlass border border-lavender-300/60 backdrop-blur-xl">
        {/* Left: Brand Identity with Custom SVG Robot / Conversational Icon */}
        <a href="#hero" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-lavender-700 to-lavender-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-all">
            {/* Custom SVG conversational robot icon */}
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="10" rx="3" />
              <circle cx="9" cy="16" r="1" fill="currentColor" />
              <circle cx="15" cy="16" r="1" fill="currentColor" />
              <path d="M12 2v4" />
              <path d="M8 6h8" />
              <path d="M2 15h1" />
              <path d="M21 15h1" />
            </svg>
          </div>
          <span className="text-headingtext font-semibold text-base sm:text-lg tracking-tight">
            ZentroMart <span className="text-lavender-700 font-medium">AI</span>
          </span>
        </a>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-7">
          <a
            href="#hero"
            className="text-bodytext hover:text-lavender-700 text-xs uppercase tracking-wider font-medium transition-colors"
          >
            Home
          </a>
          <a
            href="#capabilities"
            className="text-bodytext hover:text-lavender-700 text-xs uppercase tracking-wider font-medium transition-colors"
          >
            Capabilities
          </a>
          <a
            href="#how-it-works"
            className="text-bodytext hover:text-lavender-700 text-xs uppercase tracking-wider font-medium transition-colors"
          >
            How it works
          </a>
          <a
            href="#support-workspace"
            onClick={onOpenWorkspace}
            className="text-bodytext hover:text-lavender-700 text-xs uppercase tracking-wider font-medium transition-colors"
          >
            Voice Assistant
          </a>
          <a
            href="#developer"
            className="text-bodytext hover:text-lavender-700 text-xs uppercase tracking-wider font-medium transition-colors"
          >
            Evaluation
          </a>
          <a
            href="#deliverables"
            className="text-bodytext hover:text-lavender-700 text-xs uppercase tracking-wider font-medium transition-colors"
          >
            Deliverables
          </a>
        </div>

        {/* Right: Truthful Voice Status and Launch Assistant CTA */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {health ? (
            <div
              className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-lavender-200/90 text-[11px] text-bodytext shadow-sm"
              title={
                health.gnani_configured
                  ? "Gnani Voice Engine Connected (16kHz Audio Pipeline)"
                  : "Grounded RAG & Gemini Connected"
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  health.gnani_configured ? "bg-status-green" : "bg-lavender-600"
                } animate-pulse`}
              />
              <span className="font-medium text-headingtext">
                {health.gnani_configured ? "Voice Ready" : "Text Ready"}
              </span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-lavender-200/90 text-[11px] text-bodytext shadow-sm">
              <span className="w-2 h-2 rounded-full bg-lavender-400 animate-pulse" />
              <span className="font-medium text-bodytext">Connecting...</span>
            </div>
          )}

          <button
            onClick={() => {
              onOpenWorkspace();
              const el = document.getElementById("support-workspace");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-lavender-700 text-white hover:bg-lavender-800 px-4 sm:px-5 py-2 rounded-full text-xs font-medium flex items-center gap-2 shadow-lavender transition-all cursor-pointer hover:shadow-lavenderLg"
          >
            <Sparkles className="w-3.5 h-3.5 text-lavender-300" />
            <span>Launch Assistant</span>
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-headingtext hover:text-lavender-700 focus:outline-none"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 max-w-5xl mx-auto liquid-glass rounded-2xl p-5 flex flex-col gap-3.5 shadow-lavenderLg border border-lavender-300/80 animate-in fade-in slide-in-from-top-2 duration-200">
          <a
            href="#hero"
            onClick={() => setMobileMenuOpen(false)}
            className="text-bodytext hover:text-lavender-700 text-sm font-medium py-1"
          >
            Home
          </a>
          <a
            href="#capabilities"
            onClick={() => setMobileMenuOpen(false)}
            className="text-bodytext hover:text-lavender-700 text-sm font-medium py-1"
          >
            Capabilities
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="text-bodytext hover:text-lavender-700 text-sm font-medium py-1"
          >
            How it works
          </a>
          <a
            href="#support-workspace"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenWorkspace();
            }}
            className="text-bodytext hover:text-lavender-700 text-sm font-medium py-1"
          >
            Voice Assistant
          </a>
          <a
            href="#developer"
            onClick={() => setMobileMenuOpen(false)}
            className="text-bodytext hover:text-lavender-700 text-sm font-medium py-1"
          >
            Evaluation
          </a>
          <a
            href="#deliverables"
            onClick={() => setMobileMenuOpen(false)}
            className="text-bodytext hover:text-lavender-700 text-sm font-medium py-1"
          >
            Deliverables
          </a>

          <div className="pt-2 border-t border-lavender-200/80 flex items-center justify-between text-xs">
            <span className="text-bodytext">Voice Status</span>
            <span className="font-medium text-status-green flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
              {health?.gnani_configured ? "Gnani Voice Ready" : "Grounded Text Mode"}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
