import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Send,
  Upload,
  RefreshCw,
  Volume2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Headphones,
  Ticket,
  ChevronDown,
  ChevronUp,
  Wrench,
  HelpCircle,
  Layers,
  ArrowRight,
} from "lucide-react";
import { ChatMessage, BackendHealth } from "../types";
import { apiUrl, resolveAudioUrl } from "../config/api";

interface SupportWorkspaceProps {
  health: BackendHealth | null;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

const INDIAN_LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi (हिन्दी)" },
  { code: "ta-IN", label: "Tamil (தமிழ்)" },
  { code: "te-IN", label: "Telugu (తెలుగు)" },
  { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ml-IN", label: "Malayalam (മലയാളം)" },
  { code: "mr-IN", label: "Marathi (मराठी)" },
  { code: "bn-IN", label: "Bengali (বাংলা)" },
  { code: "gu-IN", label: "Gujarati (ગુજરાતી)" },
  { code: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)" },
];

interface CustomerCareWorkflow {
  category: string;
  prompt: string;
}

const AMAZON_CARE_WORKFLOWS: CustomerCareWorkflow[] = [
  { category: "Order Tracking", prompt: "Track order 89782837" },
  { category: "Return Policy", prompt: "What is the return window for grocery items?" },
  { category: "Wallet Refund", prompt: "How long do instant wallet refunds take under Policy v4?" },
  { category: "Damaged / Escalation", prompt: "My electronics item arrived broken and damaged" },
  { category: "Cancel in Transit", prompt: "Can I cancel my shipped order while in transit?" },
  { category: "Policy Precedence", prompt: "Does Policy v4 override store FAQs for returns?" },
];

const WELCOME_GREETING =
  "Hello! Welcome to ZentroMart Customer Care. I'm here to help you with your orders, deliveries, returns, refunds, products, and other queries. How may I assist you today?";

export const SupportWorkspace: React.FC<SupportWorkspaceProps> = ({
  health,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init_1",
      sender: "assistant",
      text: WELCOME_GREETING,
      timestamp: "Just now",
      evidence_used: ["STY-1"],
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [conversationId, setConversationId] = useState<string>(
    () => `conv_${Math.random().toString(36).substring(2, 9)}`
  );

  // Verification & escalation state
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [verifiedCaller, setVerifiedCaller] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [activeTicket, setActiveTicket] = useState<string | null>(null);

  // Voice Interaction state
  const [interactionState, setInteractionState] = useState<
    "ready" | "listening" | "transcribing" | "thinking" | "speaking"
  >("ready");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [lastVoiceTranscript, setLastVoiceTranscript] = useState<string | null>(null);
  const [activeAudioPlaying, setActiveAudioPlaying] = useState<string | null>(null);

  // Evidence expansion map
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});

  // Audio & media recording refs
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  // Scroll to bottom of message thread
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, interactionState]);

  // Initialize session greeting with backend
  useEffect(() => {
    const initializeGreeting = async () => {
      try {
        const res = await fetch(apiUrl("/api/session/init"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            language: selectedLang,
            speak: false,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.voice_available === false) {
            setVoiceNotice("Voice output is currently unavailable. Operating in text mode.");
          }
          if (data.audio_url) {
            setMessages((prev) =>
              prev.map((m, idx) => (idx === 0 ? { ...m, audio_url: data.audio_url } : m))
            );
          }
        }
      } catch (e) {
        // Fallback to text greeting
      }
    };
    initializeGreeting();
  }, [conversationId]);

  // Handle queued prompt from hero section
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendText(initialPrompt.trim());
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim() || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "customer",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setInteractionState("thinking");

    try {
      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          conversation_id: conversationId,
          turn: messages.length + 1,
          language: selectedLang,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.conversation_id && data.conversation_id !== conversationId) {
        setConversationId(data.conversation_id);
      }
      if (data.order_id) setActiveOrderId(data.order_id);
      if (data.verified) {
        setVerifiedCaller(data.order_id || "Verified");
        setVerificationRequired(false);
      } else if (data.verification_required) {
        setVerificationRequired(true);
      }

      if (data.ticket && data.ticket.created) {
        setActiveTicket(data.ticket.ticket_id);
      }

      const resolvedAudio = data.audio_url ? resolveAudioUrl(data.audio_url) : undefined;

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: "assistant",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        decision: data.decision,
        evidence_used: data.evidence_used || [],
        detailed_evidence: data.detailed_evidence || [],
        tool_call: data.tool_call,
        audio_url: resolvedAudio,
        verified: data.verified,
        ticket: data.ticket,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: "assistant",
          text: "Unable to reach ZentroMart backend service. If the server is waking up on Render, please wait a moment and retry your message.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setInteractionState("ready");
      isSubmittingRef.current = false;
    }
  };

  const startRecording = async () => {
    if (interactionState !== "ready" || isSubmittingRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          mimeType = "audio/ogg;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const actualType = recorder.mimeType || mimeType;
        const extension = actualType.includes("ogg")
          ? "ogg"
          : actualType.includes("mp4")
          ? "mp4"
          : "webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: actualType });
        stream.getTracks().forEach((track) => track.stop());
        await processAudioPayload(audioBlob, `browser_recording.${extension}`);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setInteractionState("listening");
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setVoiceNotice("Microphone permission was denied or audio device is unavailable.");
      setInteractionState("ready");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && interactionState === "listening") {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setInteractionState("transcribing");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAudioPayload(file, file.name);
    }
  };

  const processAudioPayload = async (blob: Blob, filename: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setInteractionState("transcribing");
    setVoiceNotice(null);

    const formData = new FormData();
    formData.append("audio", blob, filename);
    formData.append("conversation_id", conversationId);
    formData.append("turn", String(messages.length + 1));
    formData.append("language", selectedLang);

    try {
      const res = await fetch(apiUrl("/api/voice/process"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!data.success) {
        setVoiceNotice(data.error || "Gnani Voice service did not return a valid transcription.");
        setInteractionState("ready");
        isSubmittingRef.current = false;
        return;
      }

      setInteractionState("thinking");

      if (data.conversation_id && data.conversation_id !== conversationId) {
        setConversationId(data.conversation_id);
      }

      if (data.transcript) {
        setLastVoiceTranscript(data.transcript);
        setMessages((prev) => [
          ...prev,
          {
            id: `user_voice_${Date.now()}`,
            sender: "customer",
            text: data.transcript,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }

      if (data.order_id) setActiveOrderId(data.order_id);
      if (data.verified) {
        setVerifiedCaller(data.order_id || "Verified");
        setVerificationRequired(false);
      } else if (data.verification_required) {
        setVerificationRequired(true);
      }

      if (data.ticket && data.ticket.created) {
        setActiveTicket(data.ticket.ticket_id);
      }

      const resolvedAudio = data.audio_url ? resolveAudioUrl(data.audio_url) : undefined;

      const botMsg: ChatMessage = {
        id: `bot_voice_${Date.now()}`,
        sender: "assistant",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        decision: data.decision,
        evidence_used: data.evidence_used || [],
        detailed_evidence: data.detailed_evidence || [],
        tool_call: data.tool_call,
        audio_url: resolvedAudio,
        verified: data.verified,
        ticket: data.ticket,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (resolvedAudio) {
        playAudio(resolvedAudio);
      } else {
        setInteractionState("ready");
      }
    } catch (err: any) {
      setVoiceNotice("Network error communicating with backend voice endpoint. If the server is waking up on Render, please wait a moment and retry.");
      setInteractionState("ready");
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const playAudio = (url: string) => {
    if (audioPlayerRef.current) {
      const resolvedUrl = resolveAudioUrl(url);
      setInteractionState("speaking");
      audioPlayerRef.current.src = resolvedUrl;
      audioPlayerRef.current.play().catch(() => {
        setInteractionState("ready");
      });
      setActiveAudioPlaying(url);
      audioPlayerRef.current.onended = () => {
        setActiveAudioPlaying(null);
        setInteractionState("ready");
      };
    }
  };

  const handleResetSession = async () => {
    try {
      await fetch(apiUrl("/api/reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
    } catch (e) {
      // Ignore network errors on reset
    }

    const newId = `conv_${Math.random().toString(36).substring(2, 9)}`;
    setConversationId(newId);
    setVerifiedCaller(null);
    setVerificationRequired(false);
    setActiveOrderId(null);
    setActiveTicket(null);
    setLastVoiceTranscript(null);
    setVoiceNotice(null);
    setInteractionState("ready");
    setMessages([
      {
        id: `init_${Date.now()}`,
        sender: "assistant",
        text: WELCOME_GREETING,
        timestamp: "Just now",
        evidence_used: ["STY-1"],
      },
    ]);
  };

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="support-workspace" className="py-24 px-6 sm:px-10 xl:px-14 max-w-[1520px] mx-auto">
      {/* Hidden audio player */}
      <audio ref={audioPlayerRef} className="hidden" />

      {/* Hidden file input for audio upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE9DF] text-[#5E4B33] text-xs font-semibold uppercase tracking-wider mb-3.5 border border-[#DDD3C2]">
          Interactive Console
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl xl:text-6xl text-[#292621] tracking-tight mb-3">
          Experience <span className="italic font-normal text-[#C9A77B]">ZentroMart Support.</span>
        </h2>
        <p className="text-[#777064] text-sm sm:text-base xl:text-lg max-w-xl mx-auto leading-relaxed">
          Type queries or speak into your microphone with live RAG grounding, identity verification gating, and Gnani speech synthesis.
        </p>
      </div>

      {/* Spacious Full-Width Console Container */}
      <div className="hero-glass-panel rounded-[2.5rem] p-6 sm:p-10 xl:p-12 flex flex-col border border-white/95 shadow-heroPanel bg-white/80">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E2D9CC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1B633E] animate-pulse" />
              <h3 className="text-[#292621] font-semibold text-lg xl:text-xl tracking-tight">
                ZentroMart Support Operations Cockpit
              </h3>
            </div>
            <p className="text-[#777064] text-xs xl:text-sm mt-1">
              Ref Date: <span className="font-medium text-[#292621]">20 Oct 2026</span> • Mon-Sat Business Days • Calendar Return Windows
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Interactive State Indicator */}
            <div
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm border ${
                interactionState === "listening"
                  ? "bg-rose-50 text-rose-800 border-rose-300 animate-pulse"
                  : interactionState === "transcribing"
                  ? "bg-[#F5EFE6] text-[#7A5B2F] border-[#E2D3BE] animate-pulse"
                  : interactionState === "thinking"
                  ? "bg-[#FAF5EC] text-[#8C6D42] border-[#E2D9CC] animate-pulse"
                  : interactionState === "speaking"
                  ? "bg-[#E8F5EE] text-[#1B633E] border-[#BDE3CE] animate-pulse"
                  : "bg-white text-[#777064] border-[#DDD3C2]"
              }`}
            >
              {interactionState === "listening" && <Mic className="w-3.5 h-3.5 text-rose-600" />}
              {interactionState === "transcribing" && <Headphones className="w-3.5 h-3.5 text-[#C9A77B]" />}
              {interactionState === "thinking" && <Sparkles className="w-3.5 h-3.5 text-[#A67F4E]" />}
              {interactionState === "speaking" && <Volume2 className="w-3.5 h-3.5 text-[#1B633E]" />}
              {interactionState === "ready" && <CheckCircle2 className="w-3.5 h-3.5 text-[#1B633E]" />}
              <span className="capitalize font-semibold">
                {interactionState === "listening"
                  ? `Listening (${recordingSeconds}s)`
                  : interactionState === "transcribing"
                  ? "Transcribing (Gnani)"
                  : interactionState === "thinking"
                  ? "Thinking..."
                  : interactionState === "speaking"
                  ? "Speaking (Gnani TTS)"
                  : "Ready"}
              </span>
            </div>

            {/* Language Selector */}
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-white border border-[#DDD3C2] text-[#292621] text-xs rounded-full px-3.5 py-1.5 focus:outline-none focus:border-[#C9A77B] shadow-sm transition-colors cursor-pointer"
            >
              {INDIAN_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-white text-[#292621]">
                  {l.label}
                </option>
              ))}
            </select>

            {/* Reset Button */}
            <button
              onClick={handleResetSession}
              title="Reset conversation"
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF7F2] border border-[#DDD3C2] flex items-center gap-1.5 text-xs text-[#777064] hover:text-[#292621] transition-all cursor-pointer shadow-sm font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Body Layout (Sidebar + Chat Viewport) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Left Column: Live Context & Policy Starters (Fills the wide space) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Caller Verification & Session State Box */}
            <div className="p-5 rounded-2xl bg-white/70 border border-[#E2D9CC] shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#777064] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C9A77B]" />
                  Session Intelligence
                </span>
                <span className="font-mono text-[10px] text-[#777064]/80">
                  {conversationId.substring(0, 12)}
                </span>
              </div>

              {/* Verification status pill */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#EAE3D6]">
                <span className="text-[#777064]">Caller Gate</span>
                {verifiedCaller ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5EE] border border-[#BDE3CE] text-[#1B633E] font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified: {verifiedCaller}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F5F0E8] border border-[#DDD3C2] text-[#5E4B33] font-medium flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-[#A67F4E]" />
                    Verification Gated
                  </span>
                )}
              </div>

              {/* Active Order if tracked */}
              {activeOrderId && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#777064]">Active Order</span>
                  <span className="font-mono font-bold text-[#292621] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#DDD3C2]">
                    #{activeOrderId}
                  </span>
                </div>
              )}

              {/* Support ticket if created */}
              {activeTicket && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#777064]">Escalated Ticket</span>
                  <span className="font-mono font-medium text-[#A67F4E] bg-[#ECE5D8] px-2 py-0.5 rounded border border-[#DDD3C2] flex items-center gap-1">
                    <Ticket className="w-3 h-3" />
                    {activeTicket}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Action Inquiry Starters: Amazon-Style Customer Care Workflows */}
            <div className="p-5 rounded-2xl bg-white/70 border border-[#E2D9CC] shadow-sm flex flex-col gap-3">
              <span className="text-xs uppercase tracking-wider text-[#777064] font-semibold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#C9A77B]" />
                Customer Care Workflows
              </span>
              <p className="text-[11px] text-[#777064] leading-relaxed">
                Trigger Amazon-style customer care scenarios with verification gating and policy precedence:
              </p>
              <div className="flex flex-col gap-2">
                {AMAZON_CARE_WORKFLOWS.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendText(item.prompt)}
                    className="text-left p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F5F0E8] border border-[#E2D9CC] hover:border-[#C9A77B] text-xs text-[#292621] transition-all flex flex-col gap-1 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#ECE5D8] text-[#5E4B33] font-semibold">
                        {item.category}
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#777064] group-hover:text-[#292621] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </div>
                    <span className="text-[11px] text-[#292621] font-medium leading-snug">
                      {item.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Speech & Precedence Assurance */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2D9CC] text-xs text-[#777064] space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-[#292621]">
                <Layers className="w-3.5 h-3.5 text-[#C9A77B]" />
                <span>Policy Precedence Hierarchy</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#777064]">
                Current Policy v4 <span className="font-semibold text-[#292621]">&gt;</span> Agent Guides <span className="font-semibold text-[#292621]">&gt;</span> Help Docs <span className="font-semibold text-[#292621]">&gt;</span> FAQs. Instant 2-hr wallet refund guaranteed.
              </p>
            </div>
          </div>

          {/* Right Column: Live Conversation Thread & Controls */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            {/* Verification Alert Banner */}
            {verificationRequired && !verifiedCaller && (
              <div className="mb-4 p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E2D9CC] flex items-center justify-between gap-3 text-xs text-[#292621] shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#C9A77B] flex-shrink-0" />
                  <span>
                    <strong>Caller Verification Needed:</strong> Please speak or type the last 4 digits of your registered phone number or delivery pincode to unlock order details.
                  </span>
                </div>
                {activeOrderId && (
                  <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-[#DDD3C2] flex-shrink-0">
                    Order: {activeOrderId}
                  </span>
                )}
              </div>
            )}

            {/* Voice Notice Banner */}
            {voiceNotice && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{voiceNotice}</span>
                </div>
                <button
                  onClick={startRecording}
                  className="px-3 py-1 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-900 font-medium text-xs flex items-center gap-1 transition-all cursor-pointer flex-shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry Voice</span>
                </button>
              </div>
            )}

            {/* Last Understood Voice Transcript */}
            {lastVoiceTranscript && (
              <div className="mb-3 px-3.5 py-1.5 rounded-xl bg-white border border-[#E2D9CC] flex items-center gap-2 text-xs text-[#777064] shadow-sm w-fit">
                <Mic className="w-3.5 h-3.5 text-[#C9A77B]" />
                <span>Understood from voice:</span>
                <span className="font-medium text-[#292621]">"{lastVoiceTranscript}"</span>
              </div>
            )}

            {/* Conversation Messages Thread */}
            <div
              ref={messagesContainerRef}
              className="min-h-[420px] max-h-[520px] overflow-y-auto pr-2 space-y-4 mb-4"
            >
              {messages.map((msg) => {
                const isUser = msg.sender === "customer";
                const isExp = expandedEvidence[msg.id];

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                        isUser
                          ? "bg-[#292621] text-[#F5F1E9] font-normal rounded-tr-sm shadow-sm border border-[#3E3932]"
                          : "bg-white/95 text-[#292621] border border-[#E2D9CC] rounded-tl-sm shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {!isUser && (
                        <div className="mt-3 pt-2.5 border-t border-[#E2D9CC] flex flex-wrap items-center gap-2 text-xs">
                          {msg.audio_url && (
                            <button
                              onClick={() => playAudio(msg.audio_url!)}
                              className="px-2.5 py-1 rounded-full bg-[#F5EFE6] hover:bg-[#EFE5D5] text-[#7A5B2F] border border-[#E2D3BE] flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                            >
                              {activeAudioPlaying === msg.audio_url ? (
                                <Pause className="w-3 h-3 text-[#7A5B2F]" />
                              ) : (
                                <Play className="w-3 h-3 text-[#7A5B2F]" />
                              )}
                              <span>Listen (Gnani TTS)</span>
                            </button>
                          )}

                          {msg.tool_call && (
                            <span className="px-2.5 py-1 rounded-full bg-[#ECE5D8] border border-[#DDD3C2] text-[#292621] font-mono text-[11px] font-medium flex items-center gap-1.5">
                              <Wrench className="w-3 h-3 text-[#8C6D42] flex-shrink-0" />
                              <span>{msg.tool_call}</span>
                            </span>
                          )}

                          {msg.evidence_used && msg.evidence_used.length > 0 && (
                            <button
                              onClick={() => toggleEvidence(msg.id)}
                              className="px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F5F0E8] border border-[#DDD3C2] text-[#777064] flex items-center gap-1 transition-all cursor-pointer font-medium"
                            >
                              <FileText className="w-3 h-3 text-[#C9A77B]" />
                              <span>
                                Evidence: {msg.evidence_used.join(", ")}
                              </span>
                              {isExp ? (
                                <ChevronUp className="w-3 h-3 ml-0.5" />
                              ) : (
                                <ChevronDown className="w-3 h-3 ml-0.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {!isUser && isExp && msg.detailed_evidence && (
                      <div className="mt-2 max-w-[85%] sm:max-w-[80%] p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E2D9CC] text-xs text-[#777064] space-y-2 animate-in fade-in duration-200 shadow-sm">
                        <p className="font-semibold text-[#5E4B33] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#C9A77B]" />
                          Grounded Official Passages:
                        </p>
                        {msg.detailed_evidence.map((ev, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-white border border-[#E2D9CC]">
                            <div className="flex items-center justify-between font-mono text-[11px] text-[#777064] mb-1">
                              <span className="text-[#292621] font-bold">[{ev.section_id}] {ev.title}</span>
                              <span className="text-[#777064]/70">{ev.doc_name}</span>
                            </div>
                            <p className="text-[#777064] text-xs leading-relaxed">{ev.content_preview}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-[#777064]/60 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                );
              })}

              {interactionState === "thinking" && (
                <div className="flex items-center gap-2 text-xs text-[#5E4B33] bg-[#F5F0E8] border border-[#DDD3C2] px-4 py-2.5 rounded-full w-fit shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#C9A77B] animate-ping" />
                  <span>ZentroMart AI is checking documents & tools...</span>
                </div>
              )}

              {interactionState === "transcribing" && (
                <div className="flex items-center gap-2 text-xs text-[#5E4B33] bg-[#F5F0E8] border border-[#DDD3C2] px-4 py-2.5 rounded-full w-fit shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#C9A77B] animate-ping" />
                  <span>Transcribing speech with Gnani STT...</span>
                </div>
              )}
            </div>

            {/* Input Bar & Voice Controls */}
            <div className="pt-4 border-t border-[#E2D9CC] flex flex-col sm:flex-row items-center gap-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendText(inputVal);
                }}
                className="w-full flex-1 flex items-center gap-2 bg-white rounded-full border border-[#DDD3C2] px-4 py-1.5 focus-within:border-[#C9A77B] shadow-sm transition-colors"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={
                    interactionState === "listening"
                      ? `Listening (${recordingSeconds}s)... click mic to stop`
                      : interactionState !== "ready"
                      ? "Processing..."
                      : "Type your query (or click mic / upload audio)..."
                  }
                  disabled={interactionState !== "ready"}
                  className="bg-transparent text-[#292621] placeholder-[#777064]/60 text-sm focus:outline-none w-full py-1.5"
                />

                <button
                  type="submit"
                  disabled={!inputVal.trim() || interactionState !== "ready"}
                  className="w-8 h-8 rounded-full bg-[#292621] text-white flex items-center justify-center hover:bg-[#433E36] disabled:opacity-40 disabled:hover:bg-[#292621] transition-all cursor-pointer flex-shrink-0 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={interactionState === "listening" ? stopRecording : startRecording}
                  disabled={interactionState !== "ready" && interactionState !== "listening"}
                  title={interactionState === "listening" ? "Stop recording" : "Record audio (Gnani STT)"}
                  className={`h-11 min-w-[110px] justify-center px-4 rounded-full flex items-center gap-2 text-xs font-medium transition-all cursor-pointer shadow-sm ${
                    interactionState === "listening"
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-white hover:bg-[#FAF7F2] text-[#292621] border border-[#DDD3C2]"
                  }`}
                >
                  {interactionState === "listening" ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4 text-[#C9A77B]" />
                  )}
                  <span>{interactionState === "listening" ? `${recordingSeconds}s Stop` : "Record"}</span>
                </button>

                <button
                  type="button"
                  disabled={interactionState !== "ready"}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload customer audio file (.wav, .mp3, .webm)"
                  className="h-11 px-3.5 rounded-full bg-white hover:bg-[#FAF7F2] text-[#292621] border border-[#DDD3C2] flex items-center gap-1.5 text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-[#C9A77B]" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
