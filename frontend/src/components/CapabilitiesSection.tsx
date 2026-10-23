import React from "react";
import { Package, RotateCcw, Wallet, ShieldAlert, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export const CapabilitiesSection: React.FC = () => {
  const capabilities = [
    {
      icon: Package,
      title: "Order Tracking & Delays",
      description:
        "Instant delivery tracking across 36 Indian pincodes, checking promised dates, shipping status, and transit progress.",
      tag: "Live Data",
    },
    {
      icon: RotateCcw,
      title: "Return Eligibility & Deadlines",
      description:
        "Strict adherence to pol_returns_v4.md with calendar-day category windows, sealed beauty rules, and Plus member fee waivers.",
      tag: "Policy V4",
    },
    {
      icon: Wallet,
      title: "Wallet & Card Refund Timelines",
      description:
        "Instant wallet refunds within 2 hours. Card refunds counted in business days (Mon–Sat), correctly skipping warehouse closure dates.",
      tag: "Business Days",
    },
    {
      icon: ShieldAlert,
      title: "Identity Protection & Handover",
      description:
        "Withholds order data until verified with phone suffix or pincode. Escalates high-value damage (>₹10,000) with official support tickets.",
      tag: "Verified Tools",
    },
  ];

  return (
    <section id="capabilities" className="py-24 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white tracking-tight mb-4">
          Built for <span className="italic font-normal">absolute precision.</span>
        </h2>
        <p className="text-white/60 text-sm max-w-lg mx-auto leading-relaxed">
          ZentroMart AI Voice Assistant merges structured database lookups with strict
          evidence-grounded policy compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {capabilities.map((cap, i) => {
          const Icon = cap.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="liquid-glass liquid-glass-interactive rounded-3xl p-7 flex flex-col justify-between border border-white/10"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono tracking-wider px-3 py-1 rounded-full bg-white/5 text-white/60 border border-white/10">
                    {cap.tag}
                  </span>
                </div>
                <h3 className="text-white font-medium text-lg mb-2">{cap.title}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{cap.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-white/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80" />
                <span>Verified against synthetic test benchmarks</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
