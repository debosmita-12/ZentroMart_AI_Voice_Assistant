import React from "react";
import { Mic, Headphones, Sparkles, Volume2, ArrowRight, Play, Cpu, Database } from "lucide-react";
import { motion } from "framer-motion";

export const HowItWorksSection: React.FC = () => {
  const pipeline = [
    {
      step: "01",
      title: "Customer Voice",
      sub: "Microphone Audio",
      desc: "Customer speaks an enquiry (e.g. order tracking or return policy) captured at 16kHz mono PCM.",
      icon: Mic,
    },
    {
      step: "02",
      title: "Gnani STT",
      sub: "Speech Recognition",
      desc: "Gnani speech-to-text converts voice to text, matching English, Hindi, or regional languages.",
      icon: Cpu,
    },
    {
      step: "03",
      title: "AI Agent + RAG",
      sub: "Tools & Verification",
      desc: "Agent checks 21 store policy documents with precedence rules, enforces verification, and queries order data.",
      icon: Sparkles,
    },
    {
      step: "04",
      title: "Gnani TTS",
      sub: "Speech Synthesis",
      desc: "Synthesizes conversational, friendly voice audio in the customer's selected language.",
      icon: Volume2,
    },
    {
      step: "05",
      title: "Spoken Response",
      sub: "Audio Playback",
      desc: "Browser plays synthesized voice response alongside interactive chat cards and evidence citations.",
      icon: Headphones,
    },
  ];

  return (
    <section id="how-it-works" className="py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-lavender-200/80">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lavender-200/90 text-lavender-900 text-xs font-semibold uppercase tracking-wider mb-3.5 border border-lavender-300">
          Visual Pipeline
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl text-headingtext tracking-tight mb-4">
          Five stages to <span className="italic font-normal text-lavender-700">intelligent resolution.</span>
        </h2>
        <p className="text-bodytext text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          How ZentroMart AI processes every customer utterance through the end-to-end voice and policy pipeline.
        </p>
      </div>

      {/* Horizontal Pipeline on Desktop / Vertical Sequence on Mobile */}
      <div className="relative">
        {/* Connecting Lavender Line on Desktop */}
        <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-[2px] bg-gradient-to-r from-lavender-300 via-lavender-400 to-lavender-300 -translate-y-8 z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 relative z-10">
          {pipeline.map((p, idx) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="liquid-glass rounded-3xl p-6 flex flex-col justify-between border border-lavender-300/80 shadow-organicGlass hover:border-lavender-400 transition-all bg-white/95 group"
              >
                <div>
                  {/* Top node header */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-xs font-bold text-lavender-800 bg-lavender-100 px-2.5 py-1 rounded-full border border-lavender-200">
                      {p.step}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-lavender-200 text-lavender-800 flex items-center justify-center border border-lavender-300 shadow-sm group-hover:bg-lavender-700 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-headingtext font-semibold text-base mb-1">
                    {p.title}
                  </h3>
                  <p className="text-lavender-700 text-xs font-medium mb-3">
                    {p.sub}
                  </p>
                  <p className="text-bodytext text-xs leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-lavender-100 flex items-center justify-between text-[11px] text-bodytext">
                  <span className="font-mono text-[10px] text-lavender-600">Stage {p.step}</span>
                  {idx < pipeline.length - 1 ? (
                    <ArrowRight className="w-3.5 h-3.5 text-lavender-400 lg:hidden" />
                  ) : (
                    <span className="text-[10px] text-status-green font-medium">Completed</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
