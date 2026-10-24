import React from "react";
import { Github, Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="py-16 px-6 border-t border-lavender-200/90 bg-white/75 backdrop-blur-md text-xs text-bodytext">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Top Footer Row: Brand and Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-lavender-200/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-lavender-700 to-lavender-500 flex items-center justify-center text-white shadow-sm">
              <svg
                className="w-3.5 h-3.5 text-white"
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
              </svg>
            </div>
            <span className="text-headingtext font-semibold text-sm">
              ZentroMart <span className="text-lavender-700">AI</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 text-xs text-bodytext">
            <a href="#hero" className="hover:text-lavender-700 transition-colors">
              Home
            </a>
            <a href="#capabilities" className="hover:text-lavender-700 transition-colors">
              Capabilities
            </a>
            <a href="#how-it-works" className="hover:text-lavender-700 transition-colors">
              How It Works
            </a>
            <a href="#support-workspace" className="hover:text-lavender-700 transition-colors">
              Voice Assistant
            </a>
            <a href="#developer" className="hover:text-lavender-700 transition-colors">
              Evaluation
            </a>
            <a href="#deliverables" className="hover:text-lavender-700 transition-colors">
              Deliverables
            </a>
          </div>

          <a
            href="https://github.com/debosmita-12/ZentroMart_AI_Voice_Assistant"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-lavender-800 hover:text-lavender-900 bg-lavender-100 hover:bg-lavender-200 px-3.5 py-1.5 rounded-full border border-lavender-200 font-medium transition-all shadow-sm"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Repository</span>
          </a>
        </div>

        {/* Bottom Footer Row: Personal Credit and Metadata */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Exact required creator credit */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lavender-100/90 border border-lavender-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-lavender-700" />
            <span className="font-semibold text-headingtext text-xs tracking-wide">
              Made by — <span className="text-lavender-700 font-bold">Debosmita</span>
            </span>
          </div>

          <p className="text-bodytext/80 text-[11px]">
            VoiceOps 2026 Capstone · IIT Guwahati × Gnani.ai
          </p>

          <p className="text-bodytext/60 text-[11px]">
            Reference Date: 20 October 2026 · All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};
