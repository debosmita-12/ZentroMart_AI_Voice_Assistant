import React, { useState, useEffect } from "react";
import { Search, Database, BarChart2, Terminal, CheckCircle2, ShieldCheck } from "lucide-react";
import { EvaluationSummary } from "../types";

export const DeveloperDrawer: React.FC = () => {
  const [evalSummary, setEvalSummary] = useState<EvaluationSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("wallet refund");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Fetch evaluation summary
    fetch("/api/evaluate/status")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.total_questions) setEvalSummary(data);
      })
      .catch(() => {});

    // Initial search
    executeKBSearch("wallet refund");
  }, []);

  const executeKBSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/kb/search?q=${encodeURIComponent(q)}&top_k=4`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section id="developer" className="py-24 px-6 max-w-5xl mx-auto border-t border-white/5">
      <div className="text-center mb-16">
        <h2 className="font-serif text-3xl sm:text-4xl text-white tracking-tight mb-3">
          Evaluation & <span className="italic font-normal">Technical Proof.</span>
        </h2>
        <p className="text-white/60 text-sm max-w-lg mx-auto">
          Measured benchmarks on official practice questions and interactive Knowledge Base inspection.
        </p>
      </div>

      {/* Metrics Comparison Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Step 1 Baseline */}
        <div className="liquid-glass rounded-3xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-white/50 font-medium">
              Step 1: Prompting Only
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-white/60">
              No Documents
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Decision Accuracy</span>
                <span className="font-mono text-white">
                  {evalSummary?.step1_baseline.decision_accuracy_pct ?? 80.77}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/40"
                  style={{ width: `${evalSummary?.step1_baseline.decision_accuracy_pct ?? 80.77}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Key Facts Precision (must_include)</span>
                <span className="font-mono text-white">
                  {evalSummary?.step1_baseline.must_include_rate_pct ?? 7.69}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400/60"
                  style={{ width: `${evalSummary?.step1_baseline.must_include_rate_pct ?? 7.69}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Overall Pass Rate</span>
                <span className="font-mono text-white">
                  {evalSummary?.step1_baseline.overall_pass_pct ?? 1.92}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400/60"
                  style={{ width: `${evalSummary?.step1_baseline.overall_pass_pct ?? 1.92}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-5 text-[11px] text-white/40 leading-relaxed">
            Without internal policy access, the baseline assistant cannot reliably know category return windows or specific SKU warranties.
          </p>
        </div>

        {/* Step 2 RAG */}
        <div className="liquid-glass rounded-3xl p-6 border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-medium">
              Step 2: Document-Grounded RAG
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              21 KB Docs + Catalog
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Decision Accuracy</span>
                <span className="font-mono text-emerald-300">
                  {evalSummary?.step2_rag.decision_accuracy_pct ?? 88.46}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${evalSummary?.step2_rag.decision_accuracy_pct ?? 88.46}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Evidence Hit Rate (gold_evidence)</span>
                <span className="font-mono text-emerald-300">
                  {evalSummary?.step2_rag.evidence_retrieval_hit_pct ?? 75.0}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${evalSummary?.step2_rag.evidence_retrieval_hit_pct ?? 75.0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Overall Pass Rate</span>
                <span className="font-mono text-emerald-300">
                  {evalSummary?.step2_rag.overall_pass_pct ?? 19.23}% (10x gain)
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${evalSummary?.step2_rag.overall_pass_pct ?? 19.23}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-5 text-[11px] text-white/40 leading-relaxed">
            Strict precedence enforcement ensures current policies (v4) win over FAQs, correctly answering instant wallet refunds and SKU warranties.
          </p>
        </div>
      </div>

      {/* Live KB Retrieval Inspector */}
      <div className="liquid-glass rounded-3xl p-7 border border-white/10 mb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-medium text-base">
              Live Knowledge Base Search & Precedence Inspector
            </h3>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeKBSearch(searchQuery);
            }}
            className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-full px-3 py-1 focus-within:border-white/40"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query policy (e.g. ELE-0012, wallet, torn)"
              className="bg-transparent text-white text-xs placeholder-white/40 focus:outline-none w-48 sm:w-64"
            />
            <button
              type="submit"
              className="text-white/70 hover:text-white cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {searchResults.map((chunk, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                  <span className="text-emerald-400 font-bold">[{chunk.section_id}]</span>
                  <span className="text-white/40">{chunk.doc_name}</span>
                </div>
                <h4 className="text-white text-xs font-medium mb-1">{chunk.title}</h4>
                <p className="text-white/60 text-[11px] line-clamp-3 leading-relaxed">
                  {chunk.content}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                <span>Status: {chunk.status}</span>
                <span>Score: {chunk.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Batch Audio Command Reference */}
      <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-4 h-4 text-sky-400" />
            <h4 className="text-white font-medium text-sm">Official Batch Audio Execution</h4>
          </div>
          <p className="text-white/50 text-xs">
            Run audio through Gnani STT, multi-turn RAG agent, and Gnani TTS into outputs directory.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-black/80 border border-white/10 font-mono text-xs text-emerald-300 w-full md:w-auto overflow-x-auto">
          python run.py --input-dir ./input_audio --output-dir ./outputs
        </div>
      </div>
    </section>
  );
};
