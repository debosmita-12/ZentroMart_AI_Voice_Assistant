import React from "react";
import { Package, BookOpen, MessageSquare, Mic, ShieldCheck, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export const CapabilitiesSection: React.FC = () => {
  return (
    <section id="capabilities" className="py-28 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lavender-200/90 text-lavender-900 text-xs font-semibold uppercase tracking-wider mb-3.5 border border-lavender-300">
          Core Capabilities
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl text-headingtext tracking-tight mb-4">
          Engineered for <span className="italic font-normal text-lavender-700">accurate support.</span>
        </h2>
        <p className="text-bodytext text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          ZentroMart AI combines real-time customer database verification with strict evidence-grounded policy compliance.
        </p>
      </div>

      {/* Four Spacious Feature Cards with Distinct Visual Variations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {/* Card 1: Order Assistance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="liquid-glass rounded-3xl p-8 sm:p-9 flex flex-col justify-between border border-lavender-300/80 shadow-organicGlass hover:border-lavender-400 transition-all hover:-translate-y-1 bg-white/90"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-lavender-200 text-lavender-800 flex items-center justify-center border border-lavender-300 shadow-sm">
                <Package className="w-6 h-6 text-lavender-700" />
              </div>
              <span className="text-[11px] font-mono tracking-wider px-3 py-1 rounded-full bg-lavender-100 text-lavender-800 border border-lavender-200 font-semibold">
                Order Lookup Flow
              </span>
            </div>

            <h3 className="text-headingtext font-semibold text-xl mb-2.5">
              Order Assistance
            </h3>
            <p className="text-bodytext text-sm leading-relaxed mb-6">
              Resolve order inquiries with accurate order status, item descriptions, carrier tracking, and estimated delivery dates sourced directly from the verified 1,000-order catalog.
            </p>
          </div>

          {/* Visual variation preview for Card 1 */}
          <div className="pt-4 border-t border-lavender-200/80">
            <div className="p-3 rounded-2xl bg-lavender-50 border border-lavender-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-green" />
                <span className="font-mono font-medium text-headingtext">Order #89782837</span>
              </div>
              <span className="text-[11px] text-bodytext font-medium">Shipped · BlueDart</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Policy-Grounded Answers */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="liquid-glass rounded-3xl p-8 sm:p-9 flex flex-col justify-between border border-lavender-300/80 shadow-organicGlass hover:border-lavender-400 transition-all hover:-translate-y-1 bg-white/90"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-lavender-200 text-lavender-800 flex items-center justify-center border border-lavender-300 shadow-sm">
                <BookOpen className="w-6 h-6 text-lavender-700" />
              </div>
              <span className="text-[11px] font-mono tracking-wider px-3 py-1 rounded-full bg-lavender-100 text-lavender-800 border border-lavender-200 font-semibold">
                RAG Precedence
              </span>
            </div>

            <h3 className="text-headingtext font-semibold text-xl mb-2.5">
              Policy-Grounded Answers
            </h3>
            <p className="text-bodytext text-sm leading-relaxed mb-6">
              Answer return windows, refund rules, and warranty questions strictly grounded in the 21 official knowledge base documents, honoring policy v4 precedence over legacy FAQs.
            </p>
          </div>

          {/* Visual variation preview for Card 2 */}
          <div className="pt-4 border-t border-lavender-200/80">
            <div className="p-3 rounded-2xl bg-lavender-50 border border-lavender-200 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-lavender-900 font-semibold">
                [Pol_returns_v4]
              </span>
              <span className="text-[11px] text-status-green font-medium">
                Overrides General FAQs
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Conversational Intelligence */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="liquid-glass rounded-3xl p-8 sm:p-9 flex flex-col justify-between border border-lavender-300/80 shadow-organicGlass hover:border-lavender-400 transition-all hover:-translate-y-1 bg-white/90"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-lavender-200 text-lavender-800 flex items-center justify-center border border-lavender-300 shadow-sm">
                <MessageSquare className="w-6 h-6 text-lavender-700" />
              </div>
              <span className="text-[11px] font-mono tracking-wider px-3 py-1 rounded-full bg-lavender-100 text-lavender-800 border border-lavender-200 font-semibold">
                Multi-Turn Gating
              </span>
            </div>

            <h3 className="text-headingtext font-semibold text-xl mb-2.5">
              Conversational Intelligence
            </h3>
            <p className="text-bodytext text-sm leading-relaxed mb-6">
              Maintain conversation state across multiple turns, handle follow-up inquiries, clarify ambiguous inputs, and strictly require caller phone/pincode verification before sharing order data.
            </p>
          </div>

          {/* Visual variation preview for Card 3 */}
          <div className="pt-4 border-t border-lavender-200/80">
            <div className="p-3 rounded-2xl bg-lavender-50 border border-lavender-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-lavender-800 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-status-green" />
                <span>Verification Gated</span>
              </div>
              <span className="text-[11px] text-bodytext">Phone / Pincode</span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Voice Interaction */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="liquid-glass rounded-3xl p-8 sm:p-9 flex flex-col justify-between border border-lavender-300/80 shadow-organicGlass hover:border-lavender-400 transition-all hover:-translate-y-1 bg-white/90"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-lavender-200 text-lavender-800 flex items-center justify-center border border-lavender-300 shadow-sm">
                <Mic className="w-6 h-6 text-lavender-700" />
              </div>
              <span className="text-[11px] font-mono tracking-wider px-3 py-1 rounded-full bg-lavender-100 text-lavender-800 border border-lavender-200 font-semibold">
                Gnani.ai Speech
              </span>
            </div>

            <h3 className="text-headingtext font-semibold text-xl mb-2.5">
              Voice Interaction
            </h3>
            <p className="text-bodytext text-sm leading-relaxed mb-6">
              Support spoken customer queries with Gnani STT speech recognition and respond naturally using Gnani TTS synthesis, respecting English, Hindi, and Indian regional languages.
            </p>
          </div>

          {/* Visual variation preview for Card 4 */}
          <div className="pt-4 border-t border-lavender-200/80">
            <div className="p-3 rounded-2xl bg-lavender-50 border border-lavender-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-lavender-800">
                <span className="w-1.5 h-1.5 rounded-full bg-lavender-600 animate-pulse" />
                <span className="font-mono text-[11px] font-medium">16kHz Mono PCM</span>
              </div>
              <span className="text-[11px] text-bodytext font-medium">STT & TTS Pipeline</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
