"""Evaluation Script: Step 1 (Prompting Baseline) vs Step 2 (Document-Grounded RAG).
Runs all 52 practice questions from practice/questions.csv and computes:
- Accuracy (Decision matching)
- Key facts precision (must_include adherence)
- Hallucination avoidance (must_not_include adherence)
- Retrieval quality (gold_evidence hit rate)
- Generates reports/evaluation_summary.json and reports/step1_vs_step2_results.csv
"""
from typing import Dict, Any, List
import csv
import json
import os
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from src.agent.baseline import BaselineAgent
from src.agent.rag_agent import RAGAgent
from src.rag.retriever import HybridRetriever

QUESTIONS_CSV = _ROOT / "Capstone_Project_Dataset_FTTT_2026" / "practice" / "questions.csv"
REPORTS_DIR = _ROOT / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def check_includes(text: str, pattern: str) -> bool:
    """Check if any alternative in pattern (separated by /) is in text."""
    if not pattern or not pattern.strip():
        return True
    text_lower = text.lower()
    alternatives = [a.strip().lower() for a in pattern.split("/") if a.strip()]
    return any(alt in text_lower for alt in alternatives)


def check_not_includes(text: str, pattern: str) -> bool:
    """Check that NONE of the items in pattern (separated by ;) is in text."""
    if not pattern or not pattern.strip():
        return True
    text_lower = text.lower()
    disallowed = [d.strip().lower() for d in pattern.split(";") if d.strip()]
    return not any(d in text_lower for d in disallowed)


def run_evaluation():
    print("=== Running Step 1 vs Step 2 Evaluation on 52 Practice Questions ===")
    
    baseline = BaselineAgent()
    rag = RAGAgent()
    retriever = HybridRetriever.get_instance()

    with open(QUESTIONS_CSV, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))

    print(f"Loaded {len(reader)} questions from {QUESTIONS_CSV.name}")

    results = []
    
    step1_correct = 0
    step2_correct = 0
    step1_must_inc = 0
    step2_must_inc = 0
    step1_no_hallucinate = 0
    step2_no_hallucinate = 0
    step2_evidence_hits = 0

    for idx, row in enumerate(reader, 1):
        qid = row["id"]
        q_text = row["question"]
        expected_dec = row["expected_decision"]
        acceptable_dec = [d.strip() for d in row.get("acceptable_decisions", "").split(";") if d.strip()]
        if expected_dec not in acceptable_dec:
            acceptable_dec.append(expected_dec)

        must_inc = row.get("must_include", "")
        must_not_inc = row.get("must_not_include", "")
        gold_ev = [e.strip() for e in row.get("gold_evidence", "").split(";") if e.strip()]

        # 1. Step 1 (Baseline)
        s1_res = baseline.respond(q_text)
        s1_reply = s1_res["reply"]
        s1_dec = s1_res["decision"]
        s1_dec_pass = s1_dec in acceptable_dec
        s1_inc_pass = check_includes(s1_reply, must_inc)
        s1_not_inc_pass = check_not_includes(s1_reply, must_not_inc)
        s1_overall = s1_dec_pass and s1_inc_pass and s1_not_inc_pass

        if s1_dec_pass: step1_correct += 1
        if s1_inc_pass: step1_must_inc += 1
        if s1_not_inc_pass: step1_no_hallucinate += 1

        # 2. Step 2 (RAG)
        s2_res = rag.answer_question(q_text, language=row.get("language", "en"))
        s2_reply = s2_res["reply"]
        s2_dec = s2_res["decision"]
        s2_ev_used = s2_res.get("all_retrieved", [])
        
        s2_dec_pass = s2_dec in acceptable_dec
        s2_inc_pass = check_includes(s2_reply, must_inc)
        s2_not_inc_pass = check_not_includes(s2_reply, must_not_inc)
        
        # Check evidence hit: does s2 retrieved evidence intersect with gold evidence?
        ev_hit = any(g in s2_ev_used for g in gold_ev) if gold_ev else (len(s2_res.get("evidence_used", [])) == 0)
        
        s2_overall = s2_dec_pass and s2_inc_pass and s2_not_inc_pass

        if s2_dec_pass: step2_correct += 1
        if s2_inc_pass: step2_must_inc += 1
        if s2_not_inc_pass: step2_no_hallucinate += 1
        if ev_hit: step2_evidence_hits += 1

        results.append({
            "id": qid,
            "question": q_text,
            "intent": row.get("intent", ""),
            "expected_decision": expected_dec,
            "gold_evidence": " ; ".join(gold_ev),
            "step1_reply": s1_reply,
            "step1_decision": s1_dec,
            "step1_overall": s1_overall,
            "step2_reply": s2_reply,
            "step2_decision": s2_dec,
            "step2_evidence_used": " ; ".join(s2_res.get("evidence_used", [])),
            "step2_evidence_hit": ev_hit,
            "step2_overall": s2_overall,
        })

        if idx % 10 == 0 or idx == len(reader):
            print(f"Processed {idx}/{len(reader)} questions...")

    total = len(reader)
    summary = {
        "total_questions": total,
        "step1_baseline": {
            "decision_accuracy_pct": round((step1_correct / total) * 100, 2),
            "must_include_rate_pct": round((step1_must_inc / total) * 100, 2),
            "hallucination_avoidance_pct": round((step1_no_hallucinate / total) * 100, 2),
            "overall_pass_pct": round((sum(1 for r in results if r["step1_overall"]) / total) * 100, 2),
        },
        "step2_rag": {
            "decision_accuracy_pct": round((step2_correct / total) * 100, 2),
            "must_include_rate_pct": round((step2_must_inc / total) * 100, 2),
            "hallucination_avoidance_pct": round((step2_no_hallucinate / total) * 100, 2),
            "evidence_retrieval_hit_pct": round((step2_evidence_hits / total) * 100, 2),
            "overall_pass_pct": round((sum(1 for r in results if r["step2_overall"]) / total) * 100, 2),
        },
    }

    # Save summary JSON
    summary_path = REPORTS_DIR / "evaluation_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    # Save detailed CSV
    csv_path = REPORTS_DIR / "step1_vs_step2_results.csv"
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        writer.writeheader()
        writer.writerows(results)

    print("\n=== Evaluation Complete ===")
    print(f"Step 1 Baseline Overall Pass: {summary['step1_baseline']['overall_pass_pct']}%")
    print(f"Step 2 RAG Overall Pass     : {summary['step2_rag']['overall_pass_pct']}%")
    print(f"Step 2 Evidence Hit Rate    : {summary['step2_rag']['evidence_retrieval_hit_pct']}%")
    print(f"Summary saved to: {summary_path}")
    print(f"CSV saved to    : {csv_path}")

    return summary


if __name__ == "__main__":
    run_evaluation()
