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
    <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 xl:px-10">
      <nav className="warm-glass rounded-full w-full max-w-[1520px] mx-auto px-5 sm:px-8 py-3 flex items-center justify-between shadow-[0_12px_36px_rgba(60,50,40,0.07)] border border-white/95 backdrop-blur-xl bg-white/80">
        {/* Left: Brand Identity (flex-shrink-0 to prevent compression) */}
        <a href="#hero" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#292621] to-[#433E36] flex items-center justify-center text-[#F5F1E9] shadow-sm group-hover:scale-105 transition-all">
            <svg
              className="w-4 h-4 text-[#F5F1E9]"
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
          <span className="text-[#292621] font-semibold text-base sm:text-lg tracking-tight whitespace-nowrap">
            ZentroMart <span className="text-[#C9A77B] font-medium">AI</span>
          </span>
        </a>

        {/* Center: Desktop Navigation Links (strictly single-line, whitespace-nowrap, balanced spacing) */}
        <div className="hidden lg:flex items-center justify-center flex-1 mx-6 xl:mx-10 gap-5 xl:gap-8 2xl:gap-10">
          <a
            href="#hero"
            className="text-[#777064] hover:text-[#292621] text-xs uppercase tracking-wider font-medium transition-colors whitespace-nowrap flex-shrink-0"
          >
            Home
          </a>
          <a
            href="#capabilities"
            className="text-[#777064] hover:text-[#292621] text-xs uppercase tracking-wider font-medium transition-colors whitespace-nowrap flex-shrink-0"
          >
            Capabilities
          </a>
          <a
            href="#how-it-works"
            className="text-[#777064] hover:text-[#292621] text-xs uppercase tracking-wider font-medium transition-colors whitespace-nowrap flex-shrink-0"
          >
            How It Works
          </a>
          <a
            href="#support-workspace"
            onClick={onOpenWorkspace}
            className="text-[#777064] hover:text-[#292621] text-xs uppercase tracking-wider font-medium transition-colors whitespace-nowrap flex-shrink-0"
          >
            Voice Assistant
          </a>
          <a
            href="#developer"
            className="text-[#777064] hover:text-[#292621] text-xs uppercase tracking-wider font-medium transition-colors whitespace-nowrap flex-shrink-0"
          >
            Evaluation
          </a>
          <a
            href="#deliverables"
            className="text-[#777064] hover:text-[#292621] text-xs uppercase tracking-wider font-medium transition-colors whitespace-nowrap flex-shrink-0"
          >
            Deliverables
          </a>
        </div>

        {/* Right: Truthful Voice Ready Indicator & Compact Glowing Pill CTA (flex-shrink-0) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {health ? (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#E2D9CC] text-[11px] text-[#777064] shadow-sm whitespace-nowrap flex-shrink-0"
              title={
                health.gnani_configured
                  ? "Gnani Voice Engine Connected (16kHz Audio Pipeline)"
                  : "Grounded RAG & Gemini Connected"
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  health.gnani_configured ? "bg-[#1B633E]" : "bg-[#C9A77B]"
                } animate-pulse flex-shrink-0`}
              />
              <span className="font-medium text-[#292621] whitespace-nowrap">
                {health.gnani_configured ? "Voice Ready" : "Text Ready"}
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#E2D9CC] text-[11px] text-[#777064] shadow-sm whitespace-nowrap flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#C9A77B] animate-pulse flex-shrink-0" />
              <span className="font-medium text-[#777064] whitespace-nowrap">Connecting...</span>
            </div>
          )}

          {/* Compact Illuminated Glowing Pill CTA Button */}
          <button
            onClick={() => {
              onOpenWorkspace();
              const el = document.getElementById("support-workspace");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="glowing-cta-btn px-4 sm:px-5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A77B] flex-shrink-0" />
            <span>Launch Assistant</span>
          </button>

          {/* Mobile / Tablet Menu Trigger (visible on screens < lg) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-[#292621] hover:text-[#C9A77B] focus:outline-none flex-shrink-0"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile / Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 max-w-[1520px] mx-auto warm-glass rounded-2xl p-5 flex flex-col gap-3.5 shadow-warmLg border border-[#E2D9CC] bg-white/95 animate-in fade-in slide-in-from-top-2 duration-200">
          <a
            href="#hero"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#777064] hover:text-[#292621] text-sm font-medium py-1"
          >
            Home
          </a>
          <a
            href="#capabilities"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#777064] hover:text-[#292621] text-sm font-medium py-1"
          >
            Capabilities
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#777064] hover:text-[#292621] text-sm font-medium py-1"
          >
            How It Works
          </a>
          <a
            href="#support-workspace"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenWorkspace();
            }}
            className="text-[#777064] hover:text-[#292621] text-sm font-medium py-1"
          >
            Voice Assistant
          </a>
          <a
            href="#developer"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#777064] hover:text-[#292621] text-sm font-medium py-1"
          >
            Evaluation
          </a>
          <a
            href="#deliverables"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#777064] hover:text-[#292621] text-sm font-medium py-1"
          >
            Deliverables
          </a>

          <div className="pt-2 border-t border-[#E2D9CC] flex items-center justify-between text-xs">
            <span className="text-[#777064]">Voice Status</span>
            <span className="font-medium text-[#1B633E] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1B633E] animate-pulse" />
              {health?.gnani_configured ? "Gnani Voice Ready" : "Grounded Text Mode"}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
