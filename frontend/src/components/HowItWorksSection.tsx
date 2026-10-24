import React from "react";
import { Mic, Headphones, Sparkles, Volume2, ArrowRight, Cpu } from "lucide-react";
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
    <section id="how-it-works" className="py-28 px-6 sm:px-10 xl:px-14 max-w-[1520px] mx-auto border-t border-[#E2D9CC]">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE9DF] text-[#5E4B33] text-xs font-semibold uppercase tracking-wider mb-3.5 border border-[#DDD3C2]">
          Visual Pipeline
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl xl:text-6xl text-[#292621] tracking-tight mb-4">
          Five stages to <span className="italic font-normal text-[#C9A77B]">intelligent resolution.</span>
        </h2>
        <p className="text-[#777064] text-sm sm:text-base xl:text-lg max-w-2xl mx-auto leading-relaxed">
          How ZentroMart AI processes every customer utterance through the end-to-end voice and policy pipeline.
        </p>
      </div>

      {/* Horizontal Pipeline spanning full width on Desktop */}
      <div className="relative">
        {/* Connecting Champagne Gold Line on Desktop */}
        <div className="hidden lg:block absolute top-1/2 left-10 right-10 h-[2px] bg-gradient-to-r from-[#DDD3C2] via-[#C9A77B] to-[#DDD3C2] -translate-y-8 z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 xl:gap-6 relative z-10">
          {pipeline.map((p, idx) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="warm-glass rounded-3xl p-6 xl:p-7 flex flex-col justify-between border border-[#E2D9CC] shadow-warmGlass hover:border-[#C9A77B] transition-all bg-white/90 group"
              >
                <div>
                  {/* Top node header */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-xs font-bold text-[#5E4B33] bg-[#F5F0E8] px-2.5 py-1 rounded-full border border-[#DDD3C2]">
                      {p.step}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-[#F6EDE2] text-[#8C6D42] flex items-center justify-center border border-[#E2D9CC] shadow-sm group-hover:bg-[#292621] group-hover:text-[#F5F1E9] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-[#292621] font-semibold text-base xl:text-lg mb-1">
                    {p.title}
                  </h3>
                  <p className="text-[#C9A77B] text-xs font-medium mb-3">
                    {p.sub}
                  </p>
                  <p className="text-[#777064] text-xs xl:text-sm leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#EAE3D6] flex items-center justify-between text-[11px] text-[#777064]">
                  <span className="font-mono text-[10px] text-[#8C6D42]">Stage {p.step}</span>
                  {idx < pipeline.length - 1 ? (
                    <ArrowRight className="w-3.5 h-3.5 text-[#C9A77B] lg:hidden" />
                  ) : (
                    <span className="text-[10px] text-[#1B633E] font-medium">Completed</span>
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
