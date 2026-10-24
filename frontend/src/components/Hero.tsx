import React from "react";
import { ArrowRight, Mic, Volume2, Sparkles, ChevronRight, FileText, BookOpen, ShoppingCart } from "lucide-react";
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
      className="relative w-full min-h-[96svh] pt-32 pb-20 flex flex-col justify-center items-center overflow-hidden bg-[#F5F1E9]"
    >
      {/* 1. Subtle 3D Architectural Perspective Grid across full width */}
      <div className="absolute inset-0 architectural-grid opacity-60 pointer-events-none z-0" />

      {/* 2. Central Warm Studio Illumination Aura behind the floating glass panel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] xl:w-[1100px] h-[580px] bg-gradient-to-tr from-[#FAF5EC]/90 via-[#EAE1D2]/70 to-[#DFD4C2]/50 rounded-full blur-3xl pointer-events-none z-0 animate-soft-glow" />

      {/* 3. Wide Relative Container for Hero Composition */}
      <div className="relative w-full max-w-[1560px] mx-auto px-4 sm:px-6 xl:px-8 z-10 flex flex-col items-center">

        {/* =========================================================================
            DESKTOP 4 FLOATING FEATURE CARDS (xl:block)
            Matching exact reference screenshot:
            Upper-Left: Policy Engine v4 on Glass Slab with Gold Beam & Orbs
            Lower-Left: Knowledge Base on Terrazzo Slab with Large Ground Sphere
            Upper-Right: Gnani Voice Pipeline on Tall Glass Slab with Diamond & Orb
            Lower-Right: Order & Identity on Ribbed Slab with Gold Arch & Ground Sphere
           ========================================================================= */}

        {/* 1. Upper-Left: Policy Engine v4 */}
        <div className="hidden xl:block absolute left-2 xl:left-6 2xl:left-10 top-8 2xl:top-12 w-64 xl:w-72 2xl:w-80 z-20 pointer-events-auto">
          <div className="relative w-full">
            {/* Floating Orb above the slab */}
            <div
              aria-hidden="true"
              className="absolute -top-12 left-16 w-16 xl:w-20 h-16 xl:h-20 rounded-full sculptural-orb opacity-95 animate-float-gentle pointer-events-none z-10 shadow-warmGlass"
            />
            {/* Ambient Orb to the far left */}
            <div
              aria-hidden="true"
              className="absolute top-28 -left-10 w-12 xl:w-14 h-12 xl:h-14 rounded-full sculptural-orb opacity-85 animate-float-slow pointer-events-none z-10 shadow-warmGlass"
            />

            {/* Sculptural Glass Slab Backing */}
            <div
              aria-hidden="true"
              className="w-full h-[370px] xl:h-[400px] rounded-[3rem] sculptural-glass-slab opacity-90 transform -rotate-2 relative overflow-hidden shadow-warmLg -z-10"
            >
              {/* Specular highlight arc at top */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
              {/* Thick Metallic Gold Beam cutting across diagonally */}
              <div className="absolute top-12 -left-6 -right-6 h-6 xl:h-7 sculptural-gold-beam rounded-full transform -rotate-12 shadow-lg" />
            </div>

            {/* Foreground Feature Card mounted on the slab */}
            <div className="absolute bottom-4 inset-x-2 p-5 rounded-2xl xl:rounded-3xl bg-white/92 border border-white/95 shadow-warmLg backdrop-blur-md transition-transform duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <FileText className="w-5 h-5 text-[#C9A77B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#292621] leading-tight">Policy Engine v4</h3>
                  <p className="text-[11px] text-[#777064] leading-tight mt-0.5">Strict Precedence Grounded</p>
                </div>
              </div>
              <p className="text-[11px] text-[#777064] leading-relaxed">
                v4 policies override store FAQs &amp; agent guides with clear hierarchy.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Lower-Left: Knowledge Base */}
        <div className="hidden xl:block absolute left-2 xl:left-6 2xl:left-10 bottom-6 2xl:bottom-10 w-64 xl:w-72 2xl:w-80 z-20 pointer-events-auto">
          <div className="relative w-full">
            {/* Ground wedge behind sphere */}
            <div
              aria-hidden="true"
              className="absolute -bottom-8 -left-8 w-44 h-24 sculptural-floor-wedge rounded-[2rem] transform -rotate-6 -z-20 opacity-70 pointer-events-none"
            />

            {/* Sculptural Terrazzo Slab Backing */}
            <div
              aria-hidden="true"
              className="w-full h-[320px] xl:h-[350px] rounded-[3rem] sculptural-terrazzo-slab opacity-95 transform rotate-2 relative overflow-hidden shadow-warmLg -z-10"
            >
              {/* Metallic Gold Ribbon Accent */}
              <div className="absolute top-8 -left-4 -right-4 h-5 metallic-gold-ribbon rounded-full transform rotate-6 opacity-90 shadow-md" />
            </div>

            {/* Massive 3D Ivory Sphere grounded at bottom-left */}
            <div
              aria-hidden="true"
              className="absolute -bottom-10 -left-6 xl:-left-8 w-36 h-36 xl:w-44 xl:h-44 rounded-full sculptural-orb opacity-95 animate-float-gentle pointer-events-none z-30 shadow-2xl"
            />

            {/* Foreground Feature Card mounted on the slab */}
            <div className="absolute top-4 inset-x-2 p-5 rounded-2xl xl:rounded-3xl bg-white/92 border border-white/95 shadow-warmLg backdrop-blur-md transition-transform duration-300 hover:scale-[1.02] z-20">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <BookOpen className="w-5 h-5 text-[#C9A77B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#292621] leading-tight">Knowledge Base</h3>
                  <p className="text-[11px] text-[#777064] leading-tight mt-0.5">21 Store Documents Grounded</p>
                </div>
              </div>
              <p className="text-[11px] text-[#777064] leading-relaxed">
                8 category policies, 6 store FAQs, and 7 SOP guides with 100% retrieval verification.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Upper-Right: Gnani Voice Pipeline */}
        <div className="hidden xl:block absolute right-2 xl:right-6 2xl:right-10 top-8 2xl:top-12 w-64 xl:w-72 2xl:w-80 z-20 pointer-events-auto">
          <div className="relative w-full">
            {/* Very Tall Sculptural Glass Slab Backing */}
            <div
              aria-hidden="true"
              className="w-full h-[470px] xl:h-[510px] rounded-[3.5rem] sculptural-glass-slab opacity-90 transform rotate-1 relative overflow-hidden shadow-warmLg -z-10"
            >
              {/* Specular highlight arc at top */}
              <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

              {/* Floating 3D Gold Cube / Diamond inside upper area */}
              <div className="absolute top-10 left-10 w-8 h-8 rounded-md bg-gradient-to-tr from-[#FAF3E6] via-[#D4B483] to-[#9C7748] transform rotate-45 shadow-md animate-float-slow" />

              {/* Floating 3D Orb inside upper area */}
              <div className="absolute top-8 right-8 w-16 xl:w-18 h-16 xl:h-18 rounded-full sculptural-orb opacity-95 shadow-warmGlass animate-float-gentle" />

              {/* Curved gold ribbon at lower area */}
              <div className="absolute bottom-10 -left-4 -right-4 h-4.5 metallic-gold-ribbon rounded-full transform -rotate-3 opacity-90 shadow-md" />
            </div>

            {/* Foreground Feature Card mounted on the tall slab */}
            <div className="absolute bottom-20 inset-x-2 p-5 rounded-2xl xl:rounded-3xl bg-white/92 border border-white/95 shadow-warmLg backdrop-blur-md transition-transform duration-300 hover:scale-[1.02] z-20">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Mic className="w-5 h-5 text-[#C9A77B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#292621] leading-tight">Gnani Voice Pipeline</h3>
                  <p className="text-[11px] text-[#777064] leading-tight mt-0.5">10 Indian Languages &amp; 16kHz Audio</p>
                </div>
              </div>
              <p className="text-[11px] text-[#777064] leading-relaxed">
                Real Gnani STT &amp; natural voice TTS for seamless conversations.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Lower-Right: Order & Identity */}
        <div className="hidden xl:block absolute right-2 xl:right-6 2xl:right-10 bottom-6 2xl:bottom-10 w-64 xl:w-72 2xl:w-80 z-20 pointer-events-auto">
          <div className="relative w-full">
            {/* Large Curved Golden Ring / Arch swooping across */}
            <div
              aria-hidden="true"
              className="absolute -top-6 -right-6 w-44 h-44 xl:w-52 xl:h-52 rounded-full border-[16px] xl:border-[20px] border-[#D4B483] opacity-85 transform rotate-12 pointer-events-none shadow-warmLg -z-10"
            />

            {/* Sculptural Ribbed Slab Backing */}
            <div
              aria-hidden="true"
              className="w-full h-[320px] xl:h-[350px] rounded-[3rem] sculptural-ribbed-slab opacity-95 transform -rotate-1 relative overflow-hidden shadow-warmLg -z-10"
            >
              {/* Metallic Gold Ribbon Accent at bottom */}
              <div className="absolute bottom-6 left-0 right-0 h-4 metallic-gold-ribbon rounded-full transform rotate-2 opacity-85" />
            </div>

            {/* Massive 3D Ivory Sphere grounded at bottom-right */}
            <div
              aria-hidden="true"
              className="absolute -bottom-10 -right-4 xl:-right-6 w-38 h-38 xl:w-46 xl:h-46 rounded-full sculptural-orb opacity-95 animate-float-slow pointer-events-none z-30 shadow-2xl"
            />
            {/* Companion medium sphere */}
            <div
              aria-hidden="true"
              className="absolute -bottom-6 right-28 w-18 xl:w-22 h-18 xl:h-22 rounded-full sculptural-orb opacity-90 pointer-events-none z-20 shadow-warmGlass"
            />

            {/* Foreground Feature Card mounted on the ribbed slab */}
            <div className="absolute top-4 inset-x-2 p-5 rounded-2xl xl:rounded-3xl bg-white/92 border border-white/95 shadow-warmLg backdrop-blur-md transition-transform duration-300 hover:scale-[1.02] z-20">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ShoppingCart className="w-5 h-5 text-[#C9A77B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#292621] leading-tight">Order &amp; Identity</h3>
                  <p className="text-[11px] text-[#777064] leading-tight mt-0.5">Verified Customer Support</p>
                </div>
              </div>
              <p className="text-[11px] text-[#777064] leading-relaxed">
                Secure order lookup, customer verification and ticket creation with proper escalation.
              </p>
            </div>
          </div>
        </div>


        {/* =========================================================================
            CENTRAL FROSTED GLASS HERO PANEL
            Preserving dimensions, headline, description, waveform, and buttons
           ========================================================================= */}
        <div className="w-full max-w-3xl xl:max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hero-glass-panel rounded-[2.5rem] p-6 sm:p-12 xl:p-14 text-center flex flex-col items-center bg-white/75 border border-white/95 shadow-heroPanel"
          >
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/90 border border-[#DDD3C2] shadow-sm mb-5 sm:mb-6">
              <span className="w-2 h-2 rounded-full bg-[#C9A77B] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-[#5E4B33]">
                VOICEOPS 2026 · AI CUSTOMER EXPERIENCE
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl sm:text-5xl md:text-[62px] xl:text-[68px] text-[#292621] tracking-tight leading-[1.08] max-w-3xl mb-5 sm:mb-6">
              Customer Support,{" "}
              <span className="font-serif text-[#C9A77B] italic font-normal">Reimagined</span>
              <br />
              <span className="font-serif text-[#C9A77B] italic font-normal">with AI.</span>
            </h1>

            {/* Supporting Text */}
            <p className="text-[#777064] text-sm sm:text-base xl:text-lg max-w-xl leading-relaxed mb-6 sm:mb-8">
              A smarter way to resolve order enquiries, understand policies, and get customer support through natural conversation.
            </p>

            {/* Conversational Waveform Signal Illustration */}
            <div className="w-full max-w-sm sm:max-w-md xl:max-w-lg p-3 sm:p-3.5 rounded-2xl bg-white/80 border border-[#E2D9CC] shadow-sm mb-6 sm:mb-8 flex flex-col items-center gap-2">
              <div className="w-full flex items-center justify-between text-[11px] xl:text-xs text-[#777064] px-2">
                <div className="flex items-center gap-1.5 font-medium text-[#292621]">
                  <Volume2 className="w-3.5 h-3.5 text-[#C9A77B]" />
                  <span>Conversational Signal</span>
                </div>
                <span className="text-[10px] xl:text-[11px] text-[#8C6D42] font-mono font-medium">
                  Gnani Speech 16kHz PCM
                </span>
              </div>
              {/* Animated frequency bars in champagne gold */}
              <div className="flex items-center justify-center gap-1.5 h-6 sm:h-7 px-3 w-full">
                {[8, 14, 22, 16, 26, 12, 20, 24, 10, 22, 18, 14, 26, 15, 9, 20, 24, 12, 7, 18, 12].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${h}px`,
                      animationDelay: `${(i % 6) * 0.12}s`,
                    }}
                    className="w-1 bg-[#C9A77B] rounded-full animate-wave-bar"
                  />
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
              <button
                onClick={() => {
                  onOpenWorkspace();
                  const el = document.getElementById("support-workspace");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="glowing-cta-btn font-semibold px-7 sm:px-8 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm flex items-center gap-2.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#C9A77B]" />
                <span>Launch Assistant</span>
                <ArrowRight className="w-4 h-4 text-[#C9A77B] ml-0.5" />
              </button>

              <a
                href="#capabilities"
                className="text-[#292621] hover:text-[#C9A77B] font-medium px-5 sm:px-6 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm flex items-center gap-1.5 transition-colors group"
              >
                <span>Explore Capabilities</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>


        {/* =========================================================================
            RESPONSIVE 2x2 GRID FOR TABLET & MOBILE (<1280px)
            Reflows gracefully below central panel without clipping or crowding
           ========================================================================= */}
        <div className="xl:hidden w-full max-w-4xl mx-auto mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 px-2 sm:px-4 relative z-10">
          
          {/* Card 1: Policy Engine v4 */}
          <div className="p-5 rounded-2xl bg-white/90 border border-white/95 shadow-warmLg backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8] flex items-center justify-center flex-shrink-0 shadow-sm">
                <FileText className="w-5 h-5 text-[#C9A77B]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#292621]">Policy Engine v4</h3>
                <p className="text-[11px] text-[#777064]">Strict Precedence Grounded</p>
              </div>
            </div>
            <p className="text-[11px] text-[#777064] leading-relaxed">
              v4 policies override store FAQs &amp; agent guides with clear hierarchy.
            </p>
          </div>

          {/* Card 2: Knowledge Base */}
          <div className="p-5 rounded-2xl bg-white/90 border border-white/95 shadow-warmLg backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8] flex items-center justify-center flex-shrink-0 shadow-sm">
                <BookOpen className="w-5 h-5 text-[#C9A77B]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#292621]">Knowledge Base</h3>
                <p className="text-[11px] text-[#777064]">21 Store Documents Grounded</p>
              </div>
            </div>
            <p className="text-[11px] text-[#777064] leading-relaxed">
              8 category policies, 6 store FAQs, and 7 SOP guides with 100% retrieval verification.
            </p>
          </div>

          {/* Card 3: Gnani Voice Pipeline */}
          <div className="p-5 rounded-2xl bg-white/90 border border-white/95 shadow-warmLg backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Mic className="w-5 h-5 text-[#C9A77B]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#292621]">Gnani Voice Pipeline</h3>
                <p className="text-[11px] text-[#777064]">10 Indian Languages &amp; 16kHz Audio</p>
              </div>
            </div>
            <p className="text-[11px] text-[#777064] leading-relaxed">
              Real Gnani STT &amp; natural voice TTS for seamless conversations.
            </p>
          </div>

          {/* Card 4: Order & Identity */}
          <div className="p-5 rounded-2xl bg-white/90 border border-white/95 shadow-warmLg backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8] flex items-center justify-center flex-shrink-0 shadow-sm">
                <ShoppingCart className="w-5 h-5 text-[#C9A77B]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#292621]">Order &amp; Identity</h3>
                <p className="text-[11px] text-[#777064]">Verified Customer Support</p>
              </div>
            </div>
            <p className="text-[11px] text-[#777064] leading-relaxed">
              Secure order lookup, customer verification and ticket creation with proper escalation.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
