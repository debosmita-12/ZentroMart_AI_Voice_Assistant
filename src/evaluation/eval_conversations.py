"""Evaluation Script: Multi-turn Conversations Evaluation.
Runs all 23 multi-turn conversation scenarios (96 customer turns) in practice/conversations.csv
and verifies:
- State retention across turns
- Caller verification gates
- Tool invocation matching (lookup_order, create_ticket)
- Refusal and human escalation compliance
- Generates reports/conversation_evaluation_summary.json and reports/conversation_results.csv
"""
from typing import Dict, Any, List
import csv
import json
import os
import sys
from pathlib import Path
from collections import defaultdict

_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from src.agent.conversational_agent import ConversationalAgent

CONVERSATIONS_CSV = _ROOT / "Capstone_Project_Dataset_FTTT_2026" / "practice" / "conversations.csv"
REPORTS_DIR = _ROOT / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def check_includes(text: str, pattern: str) -> bool:
    if not pattern or not pattern.strip():
        return True
    text_lower = text.lower()
    alternatives = [a.strip().lower() for a in pattern.split("/") if a.strip()]
    return any(alt in text_lower for alt in alternatives)


def check_not_includes(text: str, pattern: str) -> bool:
    if not pattern or not pattern.strip():
        return True
    text_lower = text.lower()
    disallowed = [d.strip().lower() for d in pattern.split(";") if d.strip()]
    return not any(d in text_lower for d in disallowed)


def run_conversation_evaluation():
    print("=== Running Multi-turn Conversation Evaluation on 23 Scenarios (96 Turns) ===")
    
    agent = ConversationalAgent()

    with open(CONVERSATIONS_CSV, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    # Group by conversation_id in turn order
    groups = defaultdict(list)
    for r in rows:
        groups[r["conversation_id"]].append(r)

    print(f"Loaded {len(groups)} conversations with {len(rows)} turns total.")

    turn_results = []
    passed_turns = 0
    verification_gate_passes = 0
    total_verification_turns = 0
    tool_matches = 0
    total_expected_tools = 0

    for cid, turn_list in sorted(groups.items()):
        agent.reset_session(cid)
        # Sort by turn number
        turn_list.sort(key=lambda x: int(x["turn"]))

        for r in turn_list:
            t_num = int(r["turn"])
            c_msg = r["customer_message"]
            expected_dec = r["expected_decision"]
            must_inc = r.get("must_include", "")
            must_not_inc = r.get("must_not_include", "")
            expected_tool = r.get("expected_tool_calls", "")

            # Execute turn
            turn_out = agent.process_turn(cid, c_msg, current_turn=t_num)
            reply = turn_out["reply"]
            dec = turn_out["decision"]
            actual_tool = turn_out.get("tool_call") or ""

            # Check decision
            dec_pass = (dec == expected_dec)
            inc_pass = check_includes(reply, must_inc)
            not_inc_pass = check_not_includes(reply, must_not_inc)

            # Check verification gate
            if "lookup_order" in expected_tool and "verification_value=" not in expected_tool:
                total_verification_turns += 1
                if turn_out.get("verification_required") and not turn_out.get("verified"):
                    verification_gate_passes += 1

            # Check tool calls
            tool_match = True
            if expected_tool:
                total_expected_tools += 1
                if "lookup_order" in expected_tool:
                    tool_match = "lookup_order" in actual_tool
                elif "create_ticket" in expected_tool:
                    tool_match = "create_ticket" in actual_tool
                if tool_match:
                    tool_matches += 1

            overall_turn_pass = dec_pass and inc_pass and not_inc_pass and tool_match
            if overall_turn_pass:
                passed_turns += 1

            turn_results.append({
                "conversation_id": cid,
                "turn": t_num,
                "scenario": r.get("scenario", ""),
                "customer_message": c_msg,
                "expected_decision": expected_dec,
                "actual_decision": dec,
                "expected_tool": expected_tool,
                "actual_tool": actual_tool,
                "verified": turn_out.get("verified", False),
                "reply": reply,
                "passed": overall_turn_pass,
            })

    total_turns = len(rows)
    summary = {
        "total_conversations": len(groups),
        "total_turns": total_turns,
        "passed_turns": passed_turns,
        "turn_pass_rate_pct": round((passed_turns / total_turns) * 100, 2),
        "verification_gate_accuracy_pct": round((verification_gate_passes / max(1, total_verification_turns)) * 100, 2),
        "tool_call_accuracy_pct": round((tool_matches / max(1, total_expected_tools)) * 100, 2),
    }

    # Save summary JSON
    summary_path = REPORTS_DIR / "conversation_evaluation_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    # Save CSV
    csv_path = REPORTS_DIR / "conversation_results.csv"
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(turn_results[0].keys()))
        writer.writeheader()
        writer.writerows(turn_results)

    print("\n=== Conversation Evaluation Complete ===")
    print(f"Turn Pass Rate              : {summary['turn_pass_rate_pct']}%")
    print(f"Verification Gate Compliance: {summary['verification_gate_accuracy_pct']}%")
    print(f"Tool Matching Accuracy      : {summary['tool_call_accuracy_pct']}%")
    print(f"Summary saved to: {summary_path}")

    return summary


if __name__ == "__main__":
    run_conversation_evaluation()
