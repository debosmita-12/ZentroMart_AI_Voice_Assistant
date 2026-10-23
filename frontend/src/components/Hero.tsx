import React, { useState } from "react";
import { ArrowRight, Mic, ShieldCheck, Database, Volume2 } from "lucide-react";
import { motion } from "framer-motion";

interface HeroProps {
  onSubmitPrompt: (text: string) => void;
  onOpenWorkspace: () => void;
  onStartVoice: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSubmitPrompt,
  onOpenWorkspace,
  onStartVoice,
}) => {
  const [inputVal, setInputVal] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSubmitPrompt(inputVal.trim());
      setInputVal("");
    } else {
      onOpenWorkspace();
    }
  };

  return (
    <section
      id="hero"
      className="relative w-full min-h-[100svh] overflow-hidden bg-black flex flex-col justify-center items-center"
    >
      {/* 1. Full-screen Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/media/hero-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-70 pointer-events-none"
      >
        <source src="/media/hero-loop.mp4" type="video/mp4" />
      </video>

      {/* 2. Soft Ambient Radial Glow Layer */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-0" />

      {/* 3. Subtle Bottom Fade Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10" />

      {/* 4. Centered Hero Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 pt-24 pb-16 flex flex-col items-center text-center">
        {/* Subtle pill tag */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="liquid-glass rounded-full px-4 py-1.5 mb-8 inline-flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[12px] uppercase tracking-widest text-white/80 font-medium">
            IIT Guwahati × Gnani.ai Capstone 2026
          </span>
        </motion.div>

        {/* Headline in Instrument Serif */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[84px] text-white tracking-tight leading-[1.05] mb-6 max-w-3xl"
        >
          Support that <span className="italic font-normal">truly listens.</span>
        </motion.h1>

        {/* Supporting subtext */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-white/75 text-sm sm:text-base max-w-xl leading-relaxed mb-10 font-normal"
        >
          Get clear answers about your orders, deliveries and returns. Ask in
          your own words, or simply speak to your AI support assistant.
        </motion.p>

        {/* Functional Liquid-Glass Prompt & Voice Input */}
        <motion.form
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          onSubmit={handleSubmit}
          className="liquid-glass rounded-full p-2 pl-6 max-w-xl w-full flex items-center justify-between gap-3 shadow-2xl hover:bg-white/[0.03] transition-all mb-8"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask ZentroMart anything (e.g. Can I cancel order 89782837?)"
            className="bg-transparent text-white placeholder-white/40 text-sm focus:outline-none w-full"
          />

          <div className="flex items-center gap-2 pr-1">
            <button
              type="button"
              onClick={onStartVoice}
              title="Speak to voice assistant"
              className="w-10 h-10 rounded-full liquid-glass liquid-glass-interactive flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              type="submit"
              title="Send message"
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all cursor-pointer shadow-lg"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.form>

        {/* Quick Trust / Architecture Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/50"
        >
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-white/70" />
            <span>21 KB Policies & Tools</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Identity Gated Privacy</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Gnani Speech Models</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
