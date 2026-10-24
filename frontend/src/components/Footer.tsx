import React from "react";
import { Github, Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="py-16 px-6 sm:px-10 xl:px-14 border-t border-[#E2D9CC] bg-[#EFE9DF]/85 backdrop-blur-md text-xs text-[#777064]">
      <div className="max-w-[1520px] mx-auto flex flex-col gap-8">
        {/* Top Footer Row: Brand and Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-[#DDD3C2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#292621] to-[#433E36] flex items-center justify-center text-[#F5F1E9] shadow-sm">
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
              </svg>
            </div>
            <span className="text-[#292621] font-semibold text-sm xl:text-base">
              ZentroMart <span className="text-[#C9A77B]">AI</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs xl:text-sm text-[#777064]">
            <a href="#hero" className="hover:text-[#292621] transition-colors">
              Home
            </a>
            <a href="#capabilities" className="hover:text-[#292621] transition-colors">
              Capabilities
            </a>
            <a href="#how-it-works" className="hover:text-[#292621] transition-colors">
              How It Works
            </a>
            <a href="#support-workspace" className="hover:text-[#292621] transition-colors">
              Voice Assistant
            </a>
            <a href="#developer" className="hover:text-[#292621] transition-colors">
              Evaluation
            </a>
            <a href="#deliverables" className="hover:text-[#292621] transition-colors">
              Deliverables
            </a>
          </div>

          <a
            href="https://github.com/debosmita-12/ZentroMart_AI_Voice_Assistant"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#292621] hover:text-[#5E4B33] bg-white hover:bg-[#FAF7F2] px-4 py-2 rounded-full border border-[#DDD3C2] font-medium transition-all shadow-sm text-xs xl:text-sm"
          >
            <Github className="w-4 h-4 text-[#C9A77B]" />
            <span>GitHub Repository</span>
          </a>
        </div>

        {/* Bottom Footer Row: Personal Credit and Metadata */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Exact required creator credit */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 border border-[#DDD3C2] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A77B]" />
            <span className="font-semibold text-[#292621] text-xs xl:text-sm tracking-wide">
              Made by — <span className="text-[#C9A77B] font-bold">Debosmita</span>
            </span>
          </div>

          <p className="text-[#777064]/80 text-[11px] xl:text-xs">
            VoiceOps 2026 Capstone · IIT Guwahati × Gnani.ai
          </p>

          <p className="text-[#777064]/60 text-[11px] xl:text-xs">
            Reference Date: 20 October 2026 · All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};
