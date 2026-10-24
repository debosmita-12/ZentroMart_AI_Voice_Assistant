import React from "react";
import { ArrowRight, Mic, ShieldCheck, Database, Volume2, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { BackendHealth } from "../types";

interface HeroProps {
  health: BackendHealth | null;
  onOpenWorkspace: () => void;
  onStartVoice: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  health,
  onOpenWorkspace,
  onStartVoice,
}) => {
  return (
    <section
      id="hero"
      className="relative w-full min-h-[96svh] pt-32 pb-20 flex flex-col justify-center items-center overflow-hidden"
    >
      {/* 1. Subtle Architectural Perspective Grid */}
      <div className="absolute inset-0 architectural-grid opacity-70 pointer-events-none z-0" />

      {/* 2. Central Warm Illumination Aura behind the floating panel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[520px] bg-gradient-to-tr from-lavender-300/40 via-lavender-200/60 to-purple-300/30 rounded-full blur-3xl pointer-events-none z-0 animate-soft-glow" />

      {/* 3. Sculptural 3D Floating Forms framing the center (Left, Right, Depth) */}
      {/* Sculptural Slab Left */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute left-4 xl:left-12 top-1/3 -translate-y-1/4 w-52 h-72 rounded-[2rem] sculptural-slab opacity-80 pointer-events-none z-0 animate-float-slow transform -rotate-12 translate-x-2"
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 to-transparent rounded-t-[2rem]" />
        <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-white/60 border border-white/80 text-[10px] text-bodytext backdrop-blur-sm">
          <div className="flex items-center gap-1.5 font-medium text-headingtext mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
            <span>Policy Engine v4</span>
          </div>
          <span>Strict Precedence Grounded</span>
        </div>
      </div>

      {/* Sculptural Orb Top-Right */}
      <div
        aria-hidden="true"
        className="hidden md:block absolute right-12 xl:right-24 top-24 w-28 h-28 rounded-full sculptural-orb opacity-90 pointer-events-none z-0 animate-float-reverse"
      />

      {/* Sculptural Slab Right (Slanted Glass Form) */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute right-4 xl:right-16 bottom-20 w-56 h-64 rounded-[2.2rem] sculptural-slab opacity-75 pointer-events-none z-0 animate-float-gentle transform rotate-6"
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 to-transparent rounded-t-[2.2rem]" />
        <div className="absolute top-4 left-4 right-4 p-3 rounded-xl bg-white/60 border border-white/80 text-[10px] text-bodytext backdrop-blur-sm">
          <div className="flex items-center gap-1.5 font-medium text-headingtext mb-0.5">
            <Mic className="w-3 h-3 text-lavender-700" />
            <span>Gnani Voice Pipeline</span>
          </div>
          <span>10 Indian Languages & Audio</span>
        </div>
      </div>

      {/* Small floating pearl orb bottom-left */}
      <div
        aria-hidden="true"
        className="hidden sm:block absolute left-16 xl:left-32 bottom-24 w-16 h-16 rounded-full sculptural-orb opacity-80 pointer-events-none z-0 animate-float-gentle"
      />

      {/* 4. Foreground: Centered Organic Frosted Glass Hero Panel */}
      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="hero-glass-panel rounded-[2.5rem] p-8 sm:p-14 text-center flex flex-col items-center"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-lavender-300/80 shadow-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-lavender-700 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-lavender-900">
              VOICEOPS 2026 · AI CUSTOMER EXPERIENCE
            </span>
          </div>

          {/* Main Heading in Instrument Serif */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-[68px] text-headingtext tracking-tight leading-[1.08] max-w-3xl mb-5">
            Customer Support,{" "}
            <span className="font-serif bg-gradient-to-r from-lavender-700 via-purple-700 to-lavender-500 bg-clip-text text-transparent italic font-normal block sm:inline">
              Reimagined with AI.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-bodytext text-base sm:text-lg max-w-2xl leading-relaxed mb-8">
            A smarter way to resolve order enquiries, understand policies, and get customer support through natural conversation.
          </p>

          {/* Restrained Conversational Waveform Signal Illustration */}
          <div className="w-full max-w-md p-3.5 rounded-2xl bg-white/70 border border-lavender-200/90 shadow-sm mb-8 flex flex-col items-center gap-2">
            <div className="w-full flex items-center justify-between text-[11px] text-bodytext px-2">
              <div className="flex items-center gap-1.5 font-medium text-headingtext">
                <Volume2 className="w-3.5 h-3.5 text-lavender-700" />
                <span>Conversational Signal</span>
              </div>
              <span className="text-[10px] text-lavender-800 font-mono font-medium">
                Gnani Speech 16kHz PCM
              </span>
            </div>
            {/* Animated frequency bars */}
            <div className="flex items-center justify-center gap-1.5 h-7 px-3 w-full">
              {[8, 14, 22, 16, 26, 12, 20, 24, 10, 22, 18, 14, 26, 15, 9, 20, 24, 12, 7].map((h, i) => (
                <span
                  key={i}
                  style={{
                    height: `${h}px`,
                    animationDelay: `${(i % 6) * 0.12}s`,
                  }}
                  className="w-1 bg-lavender-500 rounded-full animate-wave-bar"
                />
              ))}
            </div>
          </div>

          {/* Primary CTA and Secondary Link */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <button
              onClick={() => {
                onOpenWorkspace();
                const el = document.getElementById("support-workspace");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-lavender-700 hover:bg-lavender-800 text-white font-medium px-8 py-3.5 rounded-full text-sm flex items-center gap-2.5 shadow-lavenderLg transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-lavender-300" />
              <span>Launch Assistant</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <a
              href="#capabilities"
              className="text-headingtext hover:text-lavender-700 font-medium px-6 py-3.5 rounded-full text-sm flex items-center gap-1.5 transition-colors group"
            >
              <span>Explore Capabilities</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Grounding & Trust Indicator Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-bodytext pt-6 border-t border-lavender-200/80 w-full">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  health ? (health.gnani_configured ? "bg-status-green" : "bg-lavender-600") : "bg-amber-400"
                } animate-pulse`}
              />
              <span className="font-medium text-headingtext">
                {health
                  ? health.gnani_configured
                    ? "Voice Engine Ready (Gnani)"
                    : "Grounded RAG Ready"
                  : "Connecting to Backend..."}
              </span>
            </div>

            <div className="w-1 h-1 rounded-full bg-lavender-300 hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-lavender-700" />
              <span>21 Store Documents Grounded</span>
            </div>

            <div className="w-1 h-1 rounded-full bg-lavender-300 hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-status-green" />
              <span>Identity Verification Gated</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
