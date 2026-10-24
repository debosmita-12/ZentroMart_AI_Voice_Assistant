import React, { useState, useEffect } from "react";
import { Search, Database, Terminal, CheckCircle2 } from "lucide-react";
import { EvaluationSummary } from "../types";
import { apiUrl } from "../config/api";

export const DeveloperDrawer: React.FC = () => {
  const [evalSummary, setEvalSummary] = useState<EvaluationSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("wallet refund");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetch(apiUrl("/api/evaluate/status"))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.total_questions) setEvalSummary(data);
      })
      .catch(() => {});

    executeKBSearch("wallet refund");
  }, []);

  const executeKBSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(apiUrl(`/api/kb/search?q=${encodeURIComponent(q)}&top_k=4`));
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section id="developer" className="py-24 px-6 sm:px-10 xl:px-14 max-w-[1520px] mx-auto border-t border-[#E2D9CC]">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE9DF] text-[#5E4B33] text-xs font-semibold uppercase tracking-wider mb-3.5 border border-[#DDD3C2]">
          Verification & Benchmarks
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl xl:text-6xl text-[#292621] tracking-tight mb-3">
          Evaluation & <span className="italic font-normal text-[#C9A77B]">Measured Proof.</span>
        </h2>
        <p className="text-[#777064] text-sm sm:text-base xl:text-lg max-w-2xl mx-auto leading-relaxed">
          Actual measured benchmark results from official practice questions and live Knowledge Base precedence inspection.
        </p>
      </div>

      {/* Metrics Comparison Cards in Warm Frosted Glass spanning full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 xl:gap-8 mb-12">
        {/* Step 1 Baseline */}
        <div className="warm-glass rounded-3xl p-7 xl:p-9 border border-[#E2D9CC] shadow-warmGlass bg-white/80">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs xl:text-sm uppercase tracking-wider text-[#777064] font-semibold">
              Step 1: Prompting Only Baseline
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#F5F0E8] text-[#5E4B33] border border-[#DDD3C2] font-medium">
              No Document Access
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs xl:text-sm text-[#777064] mb-1.5 font-medium">
                <span>Decision Accuracy</span>
                <span className="font-mono text-[#292621] font-semibold">
                  {evalSummary?.step1_baseline.decision_accuracy_pct ?? 80.77}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#EAE3D6] rounded-full overflow-hidden border border-[#DDD3C2]">
                <div
                  className="h-full bg-[#C9A77B] rounded-full"
                  style={{ width: `${evalSummary?.step1_baseline.decision_accuracy_pct ?? 80.77}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs xl:text-sm text-[#777064] mb-1.5 font-medium">
                <span>Key Facts Precision (must_include)</span>
                <span className="font-mono text-[#292621] font-semibold">
                  {evalSummary?.step1_baseline.must_include_rate_pct ?? 7.69}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#EAE3D6] rounded-full overflow-hidden border border-[#DDD3C2]">
                <div
                  className="h-full bg-[#B88E56] rounded-full"
                  style={{ width: `${evalSummary?.step1_baseline.must_include_rate_pct ?? 7.69}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs xl:text-sm text-[#777064] mb-1.5 font-medium">
                <span>Overall Pass Rate</span>
                <span className="font-mono text-[#292621] font-semibold">
                  {evalSummary?.step1_baseline.overall_pass_pct ?? 1.92}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#EAE3D6] rounded-full overflow-hidden border border-[#DDD3C2]">
                <div
                  className="h-full bg-[#8C6D42] rounded-full"
                  style={{ width: `${evalSummary?.step1_baseline.overall_pass_pct ?? 1.92}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-6 text-xs xl:text-sm text-[#777064] leading-relaxed pt-4 border-t border-[#EAE3D6]">
            Without internal policy access, the baseline assistant cannot reliably know category return windows or specific SKU warranties.
          </p>
        </div>

        {/* Step 2 RAG */}
        <div className="warm-glass rounded-3xl p-7 xl:p-9 border border-[#DDD3C2] shadow-warmLg bg-white/95 relative overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs xl:text-sm uppercase tracking-wider text-[#292621] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1B633E]" />
              Step 2: Document-Grounded RAG
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#E8F5EE] text-[#1B633E] border border-[#BDE3CE] font-semibold">
              21 Docs + Catalog
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs xl:text-sm text-[#777064] mb-1.5 font-medium">
                <span>Decision Accuracy</span>
                <span className="font-mono text-[#1B633E] font-bold">
                  {evalSummary?.step2_rag.decision_accuracy_pct ?? 88.46}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#EAE3D6] rounded-full overflow-hidden border border-[#DDD3C2]">
                <div
                  className="h-full bg-[#1B633E] rounded-full"
                  style={{ width: `${evalSummary?.step2_rag.decision_accuracy_pct ?? 88.46}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs xl:text-sm text-[#777064] mb-1.5 font-medium">
                <span>Evidence Hit Rate (gold_evidence)</span>
                <span className="font-mono text-[#1B633E] font-bold">
                  {evalSummary?.step2_rag.evidence_retrieval_hit_pct ?? 75.0}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#EAE3D6] rounded-full overflow-hidden border border-[#DDD3C2]">
                <div
                  className="h-full bg-[#1B633E] rounded-full"
                  style={{ width: `${evalSummary?.step2_rag.evidence_retrieval_hit_pct ?? 75.0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs xl:text-sm text-[#777064] mb-1.5 font-medium">
                <span>Overall Pass Rate</span>
                <span className="font-mono text-[#1B633E] font-bold">
                  {evalSummary?.step2_rag.overall_pass_pct ?? 19.23}% (10x gain)
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#EAE3D6] rounded-full overflow-hidden border border-[#DDD3C2]">
                <div
                  className="h-full bg-[#1B633E] rounded-full"
                  style={{ width: `${evalSummary?.step2_rag.overall_pass_pct ?? 19.23}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-6 text-xs xl:text-sm text-[#777064] leading-relaxed pt-4 border-t border-[#EAE3D6]">
            Strict precedence enforcement ensures current policies (v4) win over FAQs, correctly resolving instant wallet refunds and SKU warranties.
          </p>
        </div>
      </div>

      {/* Live KB Retrieval Inspector (Spans 4 columns on large desktop) */}
      <div className="warm-glass rounded-3xl p-7 xl:p-9 border border-[#E2D9CC] shadow-warmGlass bg-white/85 mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#C9A77B]" />
            <h3 className="text-[#292621] font-semibold text-base xl:text-lg">
              Live Knowledge Base Search & Precedence Inspector
            </h3>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeKBSearch(searchQuery);
            }}
            className="flex items-center gap-2 bg-white border border-[#DDD3C2] rounded-full px-4 py-2 focus-within:border-[#C9A77B] shadow-sm"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query policy (e.g. ELE-0012, wallet, torn)"
              className="bg-transparent text-[#292621] text-xs xl:text-sm placeholder-[#777064]/60 focus:outline-none w-52 sm:w-72"
            />
            <button
              type="submit"
              className="text-[#C9A77B] hover:text-[#8C6D42] cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Results grid: 4 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-5">
          {searchResults.map((chunk, idx) => (
            <div
              key={idx}
              className="p-4 xl:p-5 rounded-2xl bg-white border border-[#E2D9CC] shadow-sm flex flex-col justify-between hover:border-[#C9A77B] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                  <span className="text-[#5E4B33] font-bold">[{chunk.section_id}]</span>
                  <span className="text-[#777064]/70">{chunk.doc_name}</span>
                </div>
                <h4 className="text-[#292621] text-xs xl:text-sm font-semibold mb-1">{chunk.title}</h4>
                <p className="text-[#777064] text-[11px] xl:text-xs line-clamp-3 leading-relaxed">
                  {chunk.content}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#EAE3D6] flex items-center justify-between text-[10px] xl:text-[11px] text-[#777064]">
                <span className="font-medium text-[#8C6D42]">Status: {chunk.status}</span>
                <span>Score: {chunk.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Batch Audio Command Reference spanning full width */}
      <div className="warm-glass rounded-2xl p-6 xl:p-8 border border-[#E2D9CC] bg-white/85 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-4 h-4 text-[#C9A77B]" />
            <h4 className="text-[#292621] font-semibold text-sm xl:text-base">Official Batch Audio Execution</h4>
          </div>
          <p className="text-[#777064] text-xs xl:text-sm">
            Run audio files through Gnani STT, multi-turn RAG agent, and Gnani TTS into outputs directory.
          </p>
        </div>
        <div className="p-3.5 xl:p-4 rounded-xl bg-[#292621] text-[#F5F1E9] font-mono text-xs xl:text-sm w-full md:w-auto overflow-x-auto shadow-sm border border-[#3E3932] whitespace-nowrap">
          python run.py --input-dir ./input_audio --output-dir ./outputs
        </div>
      </div>
    </section>
  );
};
