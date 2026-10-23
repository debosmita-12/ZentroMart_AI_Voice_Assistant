#!/usr/bin/env python3
"""Mandatory Batch Audio Runner for ZentroMart VoiceOps 2026.

Usage:
    python run.py --input-dir ./input_audio --output-dir ./outputs

Processes a folder of customer audio recordings:
- Transcribes with Gnani STT
- Evaluates with Step 3 conversational agent
- Grounded with official KB evidence and tool actions
- Synthesizes spoken reply via Gnani TTS
- Produces results.csv, manifest.json, transcripts, evidence, and audio outputs
"""
import argparse
import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Ensure src is on path
_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from src.voice.gnani_service import GnaniVoiceService
from src.agent.conversational_agent import ConversationalAgent


SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".flac"}


def parse_args():
    parser = argparse.ArgumentParser(description="ZentroMart VoiceOps 2026 Batch Audio Runner")
    parser.add_argument(
        "--input-dir",
        type=str,
        default="./input_audio",
        help="Directory containing customer audio files",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="./outputs",
        help="Directory where transcripts, evidence, and audio replies will be saved",
    )
    parser.add_argument(
        "--language",
        type=str,
        default="en-IN",
        help="Input language code (default: en-IN)",
    )
    return parser.parse_args()


def run_batch(input_dir: str, output_dir: str, language: str = "en-IN"):
    in_path = Path(input_dir).resolve()
    out_path = Path(output_dir).resolve()

    # Create directory structure
    audio_out = out_path / "audio"
    transcripts_out = out_path / "transcripts"
    evidence_out = out_path / "evidence"
    logs_out = out_path / "logs"

    for d in (audio_out, transcripts_out, evidence_out, logs_out):
        d.mkdir(parents=True, exist_ok=True)

    print(f"=== ZentroMart VoiceOps 2026 Batch Audio Runner ===")
    print(f"Input Directory : {in_path}")
    print(f"Output Directory: {out_path}")
    print(f"Language Code   : {language}")

    # Discover audio files deterministically
    audio_files = []
    if in_path.exists():
        for p in sorted(in_path.iterdir()):
            if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS:
                audio_files.append(p)

    print(f"Discovered {len(audio_files)} audio file(s) for processing.")

    # Initialize services
    voice_service = GnaniVoiceService.get_instance()
    agent = ConversationalAgent()

    results = []
    manifest = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "input_directory": str(in_path),
        "total_files": len(audio_files),
        "processed_files": 0,
        "successful_files": 0,
        "failed_files": 0,
        "items": [],
    }

    for idx, audio_file in enumerate(audio_files, 1):
        filename = audio_file.name
        stem = audio_file.stem
        session_id = f"batch_{stem}"
        print(f"\n[{idx}/{len(audio_files)}] Processing {filename}...")

        item_record = {
            "file": filename,
            "session_id": session_id,
            "transcript": "",
            "assistant_reply": "",
            "output_audio": "",
            "evidence_used": [],
            "tool_call": "",
            "verified": False,
            "status": "pending",
            "error": "",
        }

        try:
            # 1. Gnani STT
            stt_res = voice_service.transcribe(audio_file, language_code=language)
            if not stt_res.get("success"):
                item_record["status"] = "stt_error"
                item_record["error"] = stt_res.get("error", "Unknown STT error")
                print(f"  [STT Error] {item_record['error']}")
                results.append(item_record)
                manifest["failed_files"] += 1
                continue

            transcript = stt_res.get("transcript", "").strip()
            item_record["transcript"] = transcript

            # Handle empty transcript
            if not transcript:
                reply = "Sorry, I didn't catch that. Could you say it again?"
                item_record["assistant_reply"] = reply
                item_record["status"] = "empty_audio"
            else:
                # 2. Agent step
                agent_res = agent.process_turn(session_id, transcript, current_turn=1)
                reply = agent_res.get("reply", "")
                item_record["assistant_reply"] = reply
                item_record["evidence_used"] = agent_res.get("evidence_used", [])
                item_record["tool_call"] = str(agent_res.get("tool_call") or "")
                item_record["verified"] = agent_res.get("verified", False)

            # 3. Save transcript & reply text
            t_file = transcripts_out / f"{stem}.txt"
            t_file.write_text(transcript, encoding="utf-8")
            
            r_file = transcripts_out / f"{stem}_reply.txt"
            r_file.write_text(reply, encoding="utf-8")

            # 4. Save evidence used
            ev_file = evidence_out / f"{stem}_evidence.json"
            with ev_file.open("w", encoding="utf-8") as f:
                json.dump(
                    {
                        "file": filename,
                        "transcript": transcript,
                        "evidence_used": item_record["evidence_used"],
                        "tool_call": item_record["tool_call"],
                    },
                    f,
                    indent=2,
                )

            # 5. Gnani TTS
            out_audio_file = audio_out / f"{stem}_reply.wav"
            tts_res = voice_service.synthesize(
                reply,
                output_file=out_audio_file,
                voice="Kaveri",
                model="timbre-v2.5",
                language="en-IN",
            )

            if tts_res.get("success"):
                item_record["output_audio"] = str(out_audio_file)
                item_record["status"] = "success"
                manifest["successful_files"] += 1
                print(f"  [Success] Transcribed: \"{transcript[:50]}...\"")
                print(f"  [Success] Spoken reply saved to {out_audio_file.name}")
            else:
                item_record["status"] = "tts_error"
                item_record["error"] = tts_res.get("error", "Unknown TTS error")
                print(f"  [TTS Error] {item_record['error']}")
                manifest["failed_files"] += 1

        except Exception as ex:
            item_record["status"] = "execution_exception"
            item_record["error"] = str(ex)
            manifest["failed_files"] += 1
            print(f"  [Exception] {ex}")

        results.append(item_record)
        manifest["processed_files"] += 1

    manifest["items"] = results

    # Save manifest.json
    manifest_path = out_path / "manifest.json"
    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    # Save results.csv
    csv_path = out_path / "results.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "file",
                "session_id",
                "transcript",
                "assistant_reply",
                "output_audio",
                "evidence_used",
                "tool_call",
                "verified",
                "status",
                "error",
            ],
        )
        writer.writeheader()
        for r in results:
            row_copy = dict(r)
            row_copy["evidence_used"] = " ; ".join(r["evidence_used"])
            writer.writerow(row_copy)

    print("\n=== Batch Processing Complete ===")
    print(f"Total Processed: {manifest['processed_files']}")
    print(f"Successful     : {manifest['successful_files']}")
    print(f"Failed         : {manifest['failed_files']}")
    print(f"Manifest saved : {manifest_path}")
    print(f"Results CSV    : {csv_path}")


if __name__ == "__main__":
    args = parse_args()
    run_batch(args.input_dir, args.output_dir, args.language)
