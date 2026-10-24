"""FastAPI application for ZentroMart VoiceOps 2026.
Serves text conversation, voice transcription & synthesis, KB retrieval inspection, and health.
"""
from typing import Optional, Dict, Any, List
import os
import sys
import shutil
import uuid
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Ensure src is on path
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from src.agent.conversational_agent import ConversationalAgent
from src.agent.baseline import BaselineAgent
from src.agent.rag_agent import RAGAgent
from src.voice.gnani_service import GnaniVoiceService
from src.rag.retriever import HybridRetriever
from src.data.loader import DataLoader

app = FastAPI(
    title="ZentroMart AI Voice Assistant API",
    description="IIT Guwahati VoiceOps 2026 AI Support Agent Backend",
    version="1.0.0",
)

# Configure CORS explicitly for Render & Vercel production frontend and local development.
# Avoids wildcard '*' when allow_credentials=True in accordance with W3C CORS specifications.
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://zentromart-ai.onrender.com",
    "https://zentromart-ai-backend.onrender.com",
    "https://zentro-mart-ai-voice-assistant.vercel.app",
    "https://zentromart-ai-voice-assistant.vercel.app",
]

extra_origins = os.environ.get("CORS_ALLOWED_ORIGINS", "")
if extra_origins:
    for origin in extra_origins.split(","):
        cleaned = origin.strip()
        if cleaned and cleaned not in cors_origins:
            cors_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount outputs/audio directory as static endpoint for audio playback
AUDIO_DIR = _ROOT / "outputs" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")

# Mount frontend dist if built
FRONTEND_DIST = _ROOT / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")
    if (FRONTEND_DIST / "media").exists():
        app.mount("/media", StaticFiles(directory=str(FRONTEND_DIST / "media")), name="media")

# Initialize core services
conv_agent = ConversationalAgent()
baseline_agent = BaselineAgent()
rag_agent = RAGAgent()
voice_service = GnaniVoiceService.get_instance()
retriever = HybridRetriever.get_instance()
loader = DataLoader.get_instance()


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    turn: Optional[int] = 1
    language: Optional[str] = "en-IN"


class ResetRequest(BaseModel):
    conversation_id: str


@app.get("/")
def serve_index():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "message": "ZentroMart AI Voice Assistant Backend API is running.",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "company": "ZentroMart",
        "reference_date": "2026-10-20",
        "gnani_configured": voice_service.is_configured(),
        "gnani_api_key_set": bool(os.environ.get("GNANI_API_KEY")),
        "gemini_api_key_set": bool(os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")),
        "dataset_counts": {
            "customers": len(loader.customers_by_id),
            "orders": len(loader.orders_by_id),
            "products": len(loader.products_by_sku),
            "pincodes": len(loader.pincodes_by_code),
            "kb_chunks": len(retriever.chunks),
        },
    }


class SessionInitRequest(BaseModel):
    conversation_id: Optional[str] = None
    language: Optional[str] = "en-IN"
    speak: Optional[bool] = False


@app.post("/api/session/init")
def init_session_post(req: Optional[SessionInitRequest] = None):
    cid = (req.conversation_id if req else None) or f"session_{uuid.uuid4().hex[:8]}"
    lang = (req.language if req else None) or "en-IN"
    speak = (req.speak if req else False)
    res = conv_agent.init_session(cid, language=lang)
    audio_url = None
    voice_available = voice_service.is_configured()
    voice_notice = None
    if speak:
        if voice_available:
            out_filename = f"welcome_{uuid.uuid4().hex[:8]}.wav"
            out_path = AUDIO_DIR / out_filename
            synth_res = voice_service.synthesize(
                res["reply"],
                output_file=out_path,
                voice="Kaveri",
                model="timbre-v2.5",
                language=lang,
            )
            if synth_res.get("success"):
                audio_url = f"/static/audio/{out_filename}"
        else:
            voice_notice = "Voice output is currently unavailable. Operating in text mode."
    return {
        **res,
        "audio_url": audio_url,
        "voice_available": voice_available,
        "voice_notice": voice_notice,
    }


@app.get("/api/session/init")
def init_session_get(
    conversation_id: Optional[str] = None,
    language: Optional[str] = "en-IN",
    speak: Optional[bool] = False,
):
    cid = conversation_id or f"session_{uuid.uuid4().hex[:8]}"
    res = conv_agent.init_session(cid, language=language or "en-IN")
    audio_url = None
    voice_available = voice_service.is_configured()
    voice_notice = None
    if speak:
        if voice_available:
            out_filename = f"welcome_{uuid.uuid4().hex[:8]}.wav"
            out_path = AUDIO_DIR / out_filename
            synth_res = voice_service.synthesize(
                res["reply"],
                output_file=out_path,
                voice="Kaveri",
                model="timbre-v2.5",
                language=language or "en-IN",
            )
            if synth_res.get("success"):
                audio_url = f"/static/audio/{out_filename}"
        else:
            voice_notice = "Voice output is currently unavailable. Operating in text mode."
    return {
        **res,
        "audio_url": audio_url,
        "voice_available": voice_available,
        "voice_notice": voice_notice,
    }


@app.post("/api/chat")
def handle_chat(req: ChatRequest):
    cid = req.conversation_id or f"session_{uuid.uuid4().hex[:8]}"
    turn = req.turn or 1
    
    result = conv_agent.process_turn(
        conversation_id=cid,
        customer_message=req.message,
        current_turn=turn,
        language=req.language,
    )
    
    # Retrieve evidence details for the drawer
    detailed_evidence = []
    for sec_id in result.get("evidence_used", []):
        chunk = retriever.chunks_by_id.get(sec_id)
        if chunk:
            detailed_evidence.append({
                "section_id": chunk.section_id,
                "title": chunk.section_title,
                "doc_name": chunk.doc_name,
                "doc_type": chunk.doc_type,
                "status": chunk.status,
                "content_preview": chunk.content[:150] + "...",
            })

    return {
        **result,
        "conversation_id": cid,
        "detailed_evidence": detailed_evidence,
    }


@app.post("/api/voice/process")
async def handle_voice_upload(
    audio: UploadFile = File(...),
    conversation_id: Optional[str] = Form(None),
    turn: Optional[int] = Form(1),
    language: Optional[str] = Form("en-IN"),
):
    cid = conversation_id or f"voice_{uuid.uuid4().hex[:8]}"
    
    # Save uploaded audio temporarily
    temp_in = AUDIO_DIR / f"input_{uuid.uuid4().hex[:8]}_{audio.filename}"
    with open(temp_in, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    try:
        # 1. Gnani STT with unified language selection
        stt_lang = language or "en-IN"
        if stt_lang == "auto":
            session = conv_agent.sessions.get(cid)
            stt_lang = session.language if (session and session.language != "auto") else "en-IN"

        stt_res = voice_service.transcribe(temp_in, language_code=stt_lang)
        if not stt_res.get("success"):
            return {
                "success": False,
                "error": stt_res.get("error", "Gnani STT failed"),
                "gnani_configured": voice_service.is_configured(),
                "transcript": "",
                "reply": "",
                "conversation_id": cid,
                "can_retry": True,
            }

        transcript = stt_res.get("transcript", "").strip()
        if not transcript:
            reply = "I didn't catch that clearly. Could you please speak a little closer to your microphone or repeat your order details?"
            agent_res = {
                "reply": reply,
                "decision": "clarify",
                "evidence_used": [],
                "tool_call": None,
                "verified": False,
                "state": "WAITING_FOR_CUSTOMER_REQUEST",
                "language": stt_lang,
            }
        else:
            # 2. Process through Step 3 Conversational Agent with language policy
            agent_res = conv_agent.process_turn(cid, transcript, current_turn=turn, language=language)
            reply = agent_res.get("reply", "")

        # 3. Gnani TTS with matched response language
        resolved_tts_lang = agent_res.get("language") or language or "en-IN"
        if resolved_tts_lang == "auto":
            resolved_tts_lang = "en-IN"

        out_audio_filename = f"reply_{uuid.uuid4().hex[:8]}.wav"
        out_audio_path = AUDIO_DIR / out_audio_filename
        tts_res = voice_service.synthesize(
            reply,
            output_file=out_audio_path,
            voice="Kaveri",
            model="timbre-v2.5",
            language=resolved_tts_lang,
        )

        audio_url = f"/static/audio/{out_audio_filename}" if tts_res.get("success") else None

        # Retrieve evidence details for the drawer
        detailed_evidence = []
        for sec_id in agent_res.get("evidence_used", []):
            chunk = retriever.chunks_by_id.get(sec_id)
            if chunk:
                detailed_evidence.append({
                    "section_id": chunk.section_id,
                    "title": chunk.section_title,
                    "doc_name": chunk.doc_name,
                    "doc_type": chunk.doc_type,
                    "status": chunk.status,
                    "content_preview": chunk.content[:150] + "...",
                })

        return {
            "success": True,
            "conversation_id": cid,
            "turn": turn,
            "transcript": transcript,
            "reply": reply,
            "audio_url": audio_url,
            "tts_success": tts_res.get("success", False),
            "tts_error": tts_res.get("error"),
            "decision": agent_res.get("decision"),
            "evidence_used": agent_res.get("evidence_used", []),
            "detailed_evidence": detailed_evidence,
            "tool_call": agent_res.get("tool_call"),
            "verified": agent_res.get("verified", False),
            "verification_required": agent_res.get("verification_required", False),
            "order_id": agent_res.get("order_id"),
            "ticket": agent_res.get("ticket"),
            "state": agent_res.get("state"),
            "language": resolved_tts_lang,
        }

    finally:
        # Cleanup temp upload file if exists
        if temp_in.exists():
            temp_in.unlink()


@app.post("/api/reset")
def reset_conversation(req: ResetRequest):
    conv_agent.reset_session(req.conversation_id)
    return {"success": True, "message": f"Session {req.conversation_id} reset successfully"}


@app.get("/api/kb/search")
def search_kb(q: str, top_k: int = 5):
    results = retriever.retrieve(q, top_k=top_k)
    return [
        {
            "chunk_id": c.chunk_id,
            "section_id": c.section_id,
            "title": c.section_title,
            "doc_name": c.doc_name,
            "doc_type": c.doc_type,
            "status": c.status,
            "score": round(score, 4),
            "content": c.content,
        }
        for c, score in results
    ]


@app.get("/api/evaluate/status")
def get_evaluation_status():
    summary_file = _ROOT / "reports" / "evaluation_summary.json"
    if summary_file.exists():
        import json
        with open(summary_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"status": "not_run_yet"}
