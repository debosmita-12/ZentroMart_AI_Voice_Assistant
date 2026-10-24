import React from "react";
import { Package, BookOpen, MessageSquare, Mic } from "lucide-react";
import { motion } from "framer-motion";

export const CapabilitiesSection: React.FC = () => {
  return (
    <section id="capabilities" className="py-28 px-6 sm:px-10 xl:px-14 max-w-[1520px] mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE9DF] text-[#5E4B33] text-xs font-semibold uppercase tracking-wider mb-3.5 border border-[#DDD3C2]">
          Core Capabilities
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl xl:text-6xl text-[#292621] tracking-tight mb-4">
          Engineered for <span className="italic font-normal text-[#C9A77B]">accurate support.</span>
        </h2>
        <p className="text-[#777064] text-sm sm:text-base xl:text-lg max-w-2xl mx-auto leading-relaxed">
          ZentroMart AI combines real-time customer database verification with strict evidence-grounded policy compliance.
        </p>
      </div>

      {/* Four Spacious Feature Cards spanning 4 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-7">
        {/* Card 1: Order Assistance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="warm-glass rounded-3xl p-7 xl:p-8 flex flex-col justify-between border border-[#E2D9CC] shadow-warmGlass hover:border-[#C9A77B] transition-all hover:-translate-y-1 bg-white/85"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#F6EDE2] text-[#8C6D42] flex items-center justify-center border border-[#E2D9CC] shadow-sm">
                <Package className="w-6 h-6 text-[#A67F4E]" />
              </div>
              <span className="text-[11px] font-mono tracking-wider px-3 py-1 rounded-full bg-[#F5F0E8] text-[#5E4B33] border border-[#DDD3C2] font-semibold">
                Order Lookup Flow
              </span>
            </div>

            <h3 className="text-[#292621] font-semibold text-lg xl:text-xl mb-2.5">
              Order Assistance
            </h3>
            <p className="text-[#777064] text-xs xl:text-sm leading-relaxed mb-6">
              Resolve order inquiries with accurate order status, item descriptions, carrier tracking, and estimated delivery dates sourced directly from the verified 1,000-order catalog.
            </p>
          </div>

          <div className="pt-4 border-t border-[#E2D9CC]">
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E2D9CC] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1B633E]" />
                <span className="font-mono font-medium text-[#292621]">Order #89782837</span>
              </div>
              <span className="text-[11px] text-[#777064] font-medium">Shipped · BlueDart</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Policy-Grounded Answers */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="warm-glass rounded-3xl p-7 xl:p-8 flex flex-col justify-between border border-[#E2D9CC] shadow-warmGlass hover:border-[#C9A77B] transition-all hover:-translate-y-1 bg-white/85"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#F6EDE2] text-[#8C6D42] flex items-center justify-center border border-[#E2D9CC] shadow-sm">
                <BookOpen className="w-6 h-6 text-[#A67F4E]" />
              </div>
              <span className="text-[11px] font-mono tracking-wider px-3 py-1 rounded-full bg-[#F5F0E8] text-[#5E4B33] border border-[#DDD3C2] font-semibold">
                RAG Precedence
              </span>
            </div>

            <h3 className="text-[#292621] font-semibold text-lg xl:text-xl mb-2.5">
              Policy-Grounded Answers
            </h3>
            <p className="text-[#777064] text-xs xl:text-sm leading-relaxed mb-6">
              Answer return windows, refund rules, and warranty questions strictly grounded in the 21 official knowledge base documents, honoring policy v4 precedence over legacy FAQs.
            </p>
          </div>

          <div className="pt-4 border-t border-[#E2D9CC]">
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E2D9CC] flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-[#292621] font-semibold">
                [Pol_returns_v4]
              </span>
              <span className="text-[11px] text-[#1B633E] font-medium">
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
          transition={{ duration: 0.5, delay: 0.15 }}
          className="warm-glass rounded-3xl p-7 xl:p-8 flex flex-col justify-between border border-[#E2D9CC] shadow-warmGlass hover:border-[#C9A77B] transition-all hover:-translate-y-1 bg-white/85"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#F6EDE2] text-[#8C6D42] flex items-center justify-center border border-[#E2D9CC] shadow-sm">
                <MessageSquare className="w-6 h-6 text-[#A67F4E]" />
              </div>
              <span className="text-[11px] font-mono tracking-wider px-3 py-1 rounded-full bg-[#F5F0E8] text-[#5E4B33] border border-[#DDD3C2] font-semibold">
                Multi-Turn Memory
              </span>
            </div>

            <h3 className="text-[#292621] font-semibold text-lg xl:text-xl mb-2.5">
              Conversational Intelligence
            </h3>
            <p className="text-[#777064] text-xs xl:text-sm leading-relaxed mb-6">
              Maintains multi-turn context across turns, resolves order references (e.g. "how long will that take?"), and escalates damaged items (&gt; ₹10,000) through synthetic support tickets.
            </p>
          </div>

          <div className="pt-4 border-t border-[#E2D9CC]">
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E2D9CC] flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-[#292621] font-medium">
                Ticket #ESC-40291
              </span>
              <span className="text-[11px] text-[#A67F4E] font-semibold">
                Human Escalation
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Gnani Speech Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="warm-glass rounded-3xl p-7 xl:p-8 flex flex-col justify-between border border-[#E2D9CC] shadow-warmGlass hover:border-[#C9A77B] transition-all hover:-translate-y-1 bg-white/85"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#F6EDE2] text-[#8C6D42] flex items-center justify-center border border-[#E2D9CC] shadow-sm">
                <Mic className="w-6 h-6 text-[#A67F4E]" />
              </div>
              <span className="text-[11px] font-mono tracking-wider px-3 py-1 rounded-full bg-[#F5F0E8] text-[#5E4B33] border border-[#DDD3C2] font-semibold">
                Speech Integration
              </span>
            </div>

            <h3 className="text-[#292621] font-semibold text-lg xl:text-xl mb-2.5">
              Gnani Speech Engine
            </h3>
            <p className="text-[#777064] text-xs xl:text-sm leading-relaxed mb-6">
              Native integration with Gnani Vachana STT and TTS across 10 Indian regional languages + Hinglish. Real-time microphone audio stream with zero third-party fallbacks.
            </p>
          </div>

          <div className="pt-4 border-t border-[#E2D9CC]">
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E2D9CC] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#777064] font-medium">
                Audio Spec
              </span>
              <span className="font-mono text-[11px] text-[#292621] font-semibold">
                16kHz PCM · Timbre-v2.5
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
