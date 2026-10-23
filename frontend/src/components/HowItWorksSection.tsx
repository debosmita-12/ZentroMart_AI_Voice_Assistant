import React from "react";
import { MessageSquare, FileSearch, Layers, Mic } from "lucide-react";
import { motion } from "framer-motion";

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: "01",
      icon: MessageSquare,
      title: "Step 1: LLM Prompting Baseline",
      desc: "Persona-guided conversation without knowledge base access. Establishes the baseline benchmark on practice questions.",
    },
    {
      num: "02",
      icon: FileSearch,
      title: "Step 2: Document-Grounded RAG",
      desc: "Chunks all 21 Markdown policies and product catalogs. Strictly enforces document precedence and abstains on unsupported inquiries.",
    },
    {
      num: "03",
      icon: Layers,
      title: "Step 3: Multi-turn Agent & Tools",
      desc: "Maintains session context and resolves follow-ups. Gates order records behind verification and logs escalation tickets.",
    },
    {
      num: "04",
      icon: Mic,
      title: "Step 4: Gnani Speech Integration",
      desc: "Official gnani-vachana SDK integration for speech-to-text (10 Indian languages) and Kaveri voice text-to-speech synthesis.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 max-w-5xl mx-auto border-t border-white/5">
      <div className="text-center mb-16">
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white tracking-tight mb-4">
          Four steps to <span className="italic font-normal">intelligence.</span>
        </h2>
        <p className="text-white/60 text-sm max-w-lg mx-auto leading-relaxed">
          The IIT Guwahati VoiceOps 2026 progressive engineering architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((st, i) => {
          const Icon = st.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="liquid-glass rounded-2xl p-6 flex flex-col justify-between border border-white/10"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-white/40">{st.num}</span>
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-white font-medium text-sm mb-2">{st.title}</h3>
                <p className="text-white/60 text-xs leading-relaxed">{st.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
