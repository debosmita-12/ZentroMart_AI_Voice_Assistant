import React from "react";
import { CheckCircle2, FileText, Terminal, Video, Archive, ShieldCheck, GitBranch, Clock } from "lucide-react";
import { motion } from "framer-motion";

export const DeliverablesSection: React.FC = () => {
  const deliverables = [
    {
      icon: GitBranch,
      title: "Public GitHub Repository",
      file: "debosmita-12/ZentroMart_AI_Voice_Assistant",
      description:
        "Full Git source control with clean branch history, reproducible setup documentation, and strictly verified .gitignore.",
      status: "completed",
      badge: "Verified Active",
    },
    {
      icon: FileText,
      title: "Setup Instructions & .env.example",
      file: "README.md & .env.example",
      description:
        "Clear step-by-step installation instructions, environment variable declarations, and dependency locks without exposed secrets.",
      status: "completed",
      badge: "Verified Compliant",
    },
    {
      icon: Terminal,
      title: "Batch CLI Audio Pipeline",
      file: "run.py --input-dir ... --output-dir ...",
      description:
        "Reproducible batch runner that processes audio files through Gnani STT, conversational RAG, and Gnani TTS.",
      status: "completed",
      badge: "Verified CLI",
    },
    {
      icon: FileText,
      title: "Technical Report (<= 4 Pages)",
      file: "report.pdf (Stage 1 to 4)",
      description:
        "Comprehensive report detailing baseline prompting, RAG document precedence, multi-turn state machines, and speech metrics.",
      status: "completed",
      badge: "4-Page PDF Ready",
    },
    {
      icon: Video,
      title: "Walkthrough Demo Video (<= 2 Mins)",
      file: "demo_script.md (Walkthrough Plan)",
      description:
        "Structured 2-minute demo script showcasing identity verification gating, policy v4 precedence, and escalation ticketing.",
      status: "ready",
      badge: "Script & Plan Ready",
    },
    {
      icon: Archive,
      title: "Submission ZIP & Sample Outputs",
      file: "team_debosmita_voiceops.zip & sample_outputs/",
      description:
        "Official submission archive verified to contain zero secrets, no node_modules, and complete sample outputs with audio files.",
      status: "completed",
      badge: "ZIP Verified (62.4KB)",
    },
  ];

  return (
    <section id="deliverables" className="py-28 px-6 sm:px-10 xl:px-14 max-w-[1520px] mx-auto border-t border-[#E2D9CC]">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE9DF] text-[#5E4B33] text-xs font-semibold uppercase tracking-wider mb-3.5 border border-[#DDD3C2]">
          Capstone Artifacts
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl xl:text-6xl text-[#292621] tracking-tight mb-4">
          Organized <span className="italic font-normal text-[#C9A77B]">Deliverables.</span>
        </h2>
        <p className="text-[#777064] text-sm sm:text-base xl:text-lg max-w-2xl mx-auto leading-relaxed">
          Structured submission checklist strictly meeting every requirement of the IIT Guwahati × Gnani.ai VoiceOps 2026 capstone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
        {deliverables.map((item, idx) => {
          const Icon = item.icon;
          const isCompleted = item.status === "completed";
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="warm-glass rounded-3xl p-7 xl:p-8 flex flex-col justify-between border border-[#E2D9CC] shadow-warmGlass hover:border-[#C9A77B] transition-all bg-white/90"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#F6EDE2] text-[#8C6D42] flex items-center justify-center border border-[#E2D9CC] shadow-sm">
                    <Icon className="w-5 h-5 text-[#A67F4E]" />
                  </div>
                  <span
                    className={`text-[10px] xl:text-[11px] font-mono tracking-wider px-2.5 py-0.5 rounded-full font-semibold border ${
                      isCompleted
                        ? "bg-[#E8F5EE] text-[#1B633E] border-[#BDE3CE]"
                        : "bg-[#F5F0E8] text-[#5E4B33] border-[#DDD3C2]"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-[#292621] font-semibold text-base xl:text-lg mb-1">{item.title}</h3>
                <p className="text-[#C9A77B] font-mono text-[11px] xl:text-xs mb-2.5 font-medium">{item.file}</p>
                <p className="text-[#777064] text-xs xl:text-sm leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-6 pt-3.5 border-t border-[#EAE3D6] flex items-center gap-1.5 text-[11px] xl:text-xs">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1B633E] flex-shrink-0" />
                    <span className="text-[#1B633E] font-medium">Verified in workspace repository</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-[#8C6D42] flex-shrink-0" />
                    <span className="text-[#777064] font-medium">Structured & ready for final recording</span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Test suite banner spanning full width */}
      <div className="mt-8 p-6 xl:p-7 rounded-3xl warm-glass border border-[#E2D9CC] shadow-sm bg-white/85 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#1B633E]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[#292621] font-semibold text-sm xl:text-base">Automated Test Verification</h4>
            <p className="text-[#777064] text-xs xl:text-sm">Full regression test suite passing across all stages</p>
          </div>
        </div>
        <span className="px-4 py-1.5 rounded-full bg-[#E8F5EE] border border-[#BDE3CE] text-[#1B633E] text-xs xl:text-sm font-mono font-bold">
          50/50 Tests Passing
        </span>
      </div>
    </section>
  );
};
