import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Upload,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Ticket,
  FileText,
  Volume2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Play,
  Pause,
  Sparkles,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Wrench,
} from "lucide-react";
import { ChatMessage, BackendHealth } from "../types";

interface SupportWorkspaceProps {
  health: BackendHealth | null;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

type InteractionState = "ready" | "listening" | "transcribing" | "thinking" | "speaking";

const INDIAN_LANGUAGES = [
  { code: "auto", label: "Auto Detect (Match Customer)" },
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi (हिंदी)" },
  { code: "hi-en", label: "Hinglish (Mixed Hindi-English)" },
  { code: "ta-IN", label: "Tamil (தமிழ்)" },
  { code: "te-IN", label: "Telugu (తెలుగు)" },
  { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
  { code: "bn-IN", label: "Bengali (বাংলা)" },
  { code: "gu-IN", label: "Gujarati (ગુજરાતી)" },
  { code: "mr-IN", label: "Marathi (मराठी)" },
  { code: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "ml-IN", label: "Malayalam (മലയാളം)" },
];

export const SupportWorkspace: React.FC<SupportWorkspaceProps> = ({
  health,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init_1",
      sender: "assistant",
      text: "Namaste! I am ZentroMart's AI Customer Support Assistant. How can I help you today? Please share your 8-digit Order ID if you are inquiring about an order.",
      timestamp: "Just now",
      evidence_used: ["STY-1"],
      detailed_evidence: [
        {
          section_id: "STY-1",
          title: "Initial Greeting & AI Disclosure",
          doc_name: "agent_conversation_style.md",
          doc_type: "agent_guide",
          status: "current",
          content_preview:
            "Agent must introduce itself as an AI assistant and ask for order details politely.",
        },
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [selectedLang, setSelectedLang] = useState("auto");
  const [interactionState, setInteractionState] = useState<InteractionState>("ready");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [conversationId, setConversationId] = useState(
    () => `conv_${Math.random().toString(36).substring(2, 9)}`
  );
  const [verifiedCaller, setVerifiedCaller] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [activeAudioPlaying, setActiveAudioPlaying] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<{ [id: string]: boolean }>({});
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [lastVoiceTranscript, setLastVoiceTranscript] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  // Auto-scroll container strictly on new messages (avoiding document scroll-jump on recording/state changes)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length]);

  // Handle incoming initial prompt from Hero
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendText(initialPrompt.trim());
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim() || isSubmittingRef.current || interactionState !== "ready") return;

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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          conversation_id: conversationId,
          turn: messages.length + 1,
          language: selectedLang,
        }),
      });

      if (!res.ok) throw new Error("Server communication error");
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

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: "assistant",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        decision: data.decision,
        evidence_used: data.evidence_used || [],
        detailed_evidence: data.detailed_evidence || [],
        tool_call: data.tool_call,
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
          text: "I experienced a temporary connection interruption. Please retry your message or reach out to our team.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setInteractionState("ready");
      isSubmittingRef.current = false;
    }
  };

  // Recording controls with true browser container detection and duplicate prevention
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
      e.target.value = "";
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
      const res = await fetch("/api/voice/process", {
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

      // Add user transcribed message if detected
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

      // Add assistant response
      const botMsg: ChatMessage = {
        id: `bot_voice_${Date.now()}`,
        sender: "assistant",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        decision: data.decision,
        evidence_used: data.evidence_used || [],
        detailed_evidence: data.detailed_evidence || [],
        tool_call: data.tool_call,
        audio_url: data.audio_url,
        verified: data.verified,
        ticket: data.ticket,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Auto-play audio if generated
      if (data.audio_url) {
        playAudio(data.audio_url);
      } else {
        setInteractionState("ready");
      }
    } catch (err: any) {
      setVoiceNotice("Network error communicating with backend voice endpoint.");
      setInteractionState("ready");
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const playAudio = (url: string) => {
    if (audioPlayerRef.current) {
      setInteractionState("speaking");
      audioPlayerRef.current.src = url;
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
      await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
    } catch (e) {}

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
        id: "init_fresh",
        sender: "assistant",
        text: "Session reset. I am ZentroMart's AI Customer Support Assistant. How may I assist you with your orders or returns?",
        timestamp: "Just now",
        evidence_used: ["STY-1"],
      },
    ]);
  };

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="support-workspace" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto">
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

      {/* Section Header: Launch Assistant Intro */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lavender-200 text-lavender-800 text-xs font-semibold uppercase tracking-wider mb-3">
          Interactive Console
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-headingtext tracking-tight mb-2">
          Experience <span className="italic font-normal text-lavender-700">ZentroMart Support.</span>
        </h2>
        <p className="text-bodytext text-sm max-w-md mx-auto">
          Type queries or speak into your microphone with live RAG grounding, identity verification gating, and Gnani speech synthesis.
        </p>
      </div>

      {/* Workspace Container with Organic Glass Styling */}
      <div className="hero-glass-panel rounded-[2.5rem] p-6 sm:p-10 flex flex-col border border-lavender-300/80 shadow-heroPanel bg-white/95">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-lavender-200/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-status-green animate-pulse" />
              <h3 className="text-headingtext font-semibold text-lg tracking-tight">
                ZentroMart Support Console
              </h3>
            </div>
            <p className="text-bodytext text-xs mt-1">
              Ref Date: <span className="font-medium text-headingtext">20 Oct 2026</span> • Mon-Sat Business Days • Calendar Return Windows
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Interactive State Indicator */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm border ${
                interactionState === "listening"
                  ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                  : interactionState === "transcribing"
                  ? "bg-lavender-200 text-lavender-900 border-lavender-300 animate-pulse"
                  : interactionState === "thinking"
                  ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                  : interactionState === "speaking"
                  ? "bg-status-greenLight text-status-green border-status-greenBorder animate-pulse"
                  : "bg-white text-bodytext border-lavender-300"
              }`}
            >
              {interactionState === "listening" && <Mic className="w-3.5 h-3.5 text-rose-600" />}
              {interactionState === "transcribing" && <Headphones className="w-3.5 h-3.5 text-lavender-700" />}
              {interactionState === "thinking" && <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
              {interactionState === "speaking" && <Volume2 className="w-3.5 h-3.5 text-status-green" />}
              {interactionState === "ready" && <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />}
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

            {/* Verification State Pill */}
            {verifiedCaller ? (
              <div className="px-3 py-1 rounded-full bg-status-greenLight border border-status-greenBorder text-status-green text-xs font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified: {verifiedCaller}</span>
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full bg-lavender-100 border border-lavender-300 text-lavender-800 text-xs font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-lavender-700" />
                <span>Verification Gated</span>
              </div>
            )}

            {/* Ticket Badge */}
            {activeTicket && (
              <div className="px-3 py-1 rounded-full bg-lavender-200 border border-lavender-400 text-lavender-900 text-xs font-mono font-medium flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-lavender-700" />
                <span>{activeTicket.substring(0, 10)}...</span>
              </div>
            )}

            {/* Language Selector */}
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-white border border-lavender-300 text-headingtext text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-lavender-500 shadow-sm transition-colors cursor-pointer"
            >
              {INDIAN_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-white text-headingtext">
                  {l.label}
                </option>
              ))}
            </select>

            {/* Reset Button */}
            <button
              onClick={handleResetSession}
              title="Reset conversation"
              className="w-8 h-8 rounded-full bg-white hover:bg-lavender-100 border border-lavender-300 flex items-center justify-center text-bodytext hover:text-lavender-800 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Verification Required Alert Prompt */}
        {verificationRequired && !verifiedCaller && (
          <div className="mt-4 p-3.5 rounded-2xl bg-lavender-100/90 border border-lavender-300 flex items-center justify-between gap-3 text-xs text-lavender-950 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-lavender-700 flex-shrink-0" />
              <span>
                <strong>Caller Verification Needed:</strong> Please speak or type the last 4 digits of your registered phone number or delivery pincode to unlock order details.
              </span>
            </div>
            {activeOrderId && (
              <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-lavender-300">
                Order: {activeOrderId}
              </span>
            )}
          </div>
        )}

        {/* Voice Warning / Notice Banner with Retry Action */}
        {voiceNotice && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{voiceNotice}</span>
            </div>
            <button
              onClick={startRecording}
              className="px-3 py-1 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-900 font-medium text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry Voice</span>
            </button>
          </div>
        )}

        {/* Last Understood Voice Transcript Indicator */}
        {lastVoiceTranscript && (
          <div className="mt-3 px-3.5 py-1.5 rounded-xl bg-white border border-lavender-200 flex items-center gap-2 text-xs text-bodytext shadow-sm w-fit">
            <Mic className="w-3.5 h-3.5 text-lavender-700" />
            <span>Understood from voice:</span>
            <span className="font-medium text-headingtext">"{lastVoiceTranscript}"</span>
          </div>
        )}

        {/* Conversation Thread */}
        <div ref={messagesContainerRef} className="my-6 min-h-[380px] max-h-[500px] overflow-y-auto pr-2 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === "customer";
            const isExp = expandedEvidence[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                    isUser
                      ? "bg-lavender-700 text-white font-normal rounded-tr-sm shadow-sm"
                      : "bg-white text-headingtext border border-lavender-200/90 rounded-tl-sm shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Assistant Extra Metadata: Audio player, tools, evidence */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-lavender-200/80 flex flex-wrap items-center gap-2 text-xs">
                      {/* Audio playback button */}
                      {msg.audio_url && (
                        <button
                          onClick={() => playAudio(msg.audio_url!)}
                          className="px-2.5 py-1 rounded-full bg-lavender-100 hover:bg-lavender-200 text-lavender-800 border border-lavender-200 flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                        >
                          {activeAudioPlaying === msg.audio_url ? (
                            <Pause className="w-3 h-3 text-lavender-700" />
                          ) : (
                            <Play className="w-3 h-3 text-lavender-700" />
                          )}
                          <span>Listen (Gnani TTS)</span>
                        </button>
                      )}

                      {/* Tool Call Tag */}
                      {msg.tool_call && (
                        <span className="px-2.5 py-1 rounded-full bg-lavender-200 border border-lavender-300 text-lavender-900 font-mono text-[11px] font-medium flex items-center gap-1.5">
                          <Wrench className="w-3 h-3 text-lavender-700 flex-shrink-0" />
                          <span>{msg.tool_call}</span>
                        </span>
                      )}

                      {/* Evidence Pill */}
                      {msg.evidence_used && msg.evidence_used.length > 0 && (
                        <button
                          onClick={() => toggleEvidence(msg.id)}
                          className="px-2.5 py-1 rounded-full bg-lavender-100 hover:bg-lavender-200 border border-lavender-300 text-lavender-800 flex items-center gap-1 transition-all cursor-pointer font-medium"
                        >
                          <FileText className="w-3 h-3 text-lavender-700" />
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

                {/* Expanded Evidence Drawer for this message */}
                {!isUser && isExp && msg.detailed_evidence && (
                  <div className="mt-2 max-w-[85%] sm:max-w-[75%] p-3.5 rounded-xl bg-lavender-50 border border-lavender-300 text-xs text-bodytext space-y-2 animate-in fade-in duration-200 shadow-sm">
                    <p className="font-semibold text-lavender-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-lavender-700" />
                      Grounded Official Passages:
                    </p>
                    {msg.detailed_evidence.map((ev, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-white border border-lavender-200">
                        <div className="flex items-center justify-between font-mono text-[11px] text-bodytext mb-1">
                          <span className="text-lavender-800 font-bold">[{ev.section_id}] {ev.title}</span>
                          <span className="text-bodytext/70">{ev.doc_name}</span>
                        </div>
                        <p className="text-bodytext text-xs leading-relaxed">{ev.content_preview}</p>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-bodytext/60 mt-1 px-1">{msg.timestamp}</span>
              </div>
            );
          })}

          {/* Typing / Processing indicator */}
          {interactionState === "thinking" && (
            <div className="flex items-center gap-2 text-xs text-lavender-800 bg-lavender-100 border border-lavender-300 px-4 py-2.5 rounded-full w-fit shadow-sm">
              <span className="w-2 h-2 rounded-full bg-lavender-700 animate-ping" />
              <span>ZentroMart AI is checking documents & tools...</span>
            </div>
          )}

          {interactionState === "transcribing" && (
            <div className="flex items-center gap-2 text-xs text-lavender-800 bg-lavender-100 border border-lavender-300 px-4 py-2.5 rounded-full w-fit shadow-sm">
              <span className="w-2 h-2 rounded-full bg-lavender-700 animate-ping" />
              <span>Transcribing speech with Gnani STT...</span>
            </div>
          )}

          <div className="h-2" />
        </div>

        {/* Input Bar & Voice Controls */}
        <div className="pt-4 border-t border-lavender-200/90 flex flex-col sm:flex-row items-center gap-3">
          {/* Text Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendText(inputVal);
            }}
            className="w-full flex-1 flex items-center gap-2 bg-white rounded-full border border-lavender-300 px-4 py-1.5 focus-within:border-lavender-500 shadow-sm transition-colors"
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
              className="bg-transparent text-headingtext placeholder-bodytext/60 text-sm focus:outline-none w-full py-1.5"
            />

            <button
              type="submit"
              disabled={!inputVal.trim() || interactionState !== "ready"}
              className="w-8 h-8 rounded-full bg-lavender-700 text-white flex items-center justify-center hover:bg-lavender-800 disabled:opacity-40 disabled:hover:bg-lavender-700 transition-all cursor-pointer flex-shrink-0 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Audio Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Record Mic Button */}
            <button
              type="button"
              onClick={interactionState === "listening" ? stopRecording : startRecording}
              disabled={interactionState !== "ready" && interactionState !== "listening"}
              title={interactionState === "listening" ? "Stop recording" : "Record audio (Gnani STT)"}
              className={`h-11 min-w-[110px] justify-center px-4 rounded-full flex items-center gap-2 text-xs font-medium transition-all cursor-pointer shadow-sm ${
                interactionState === "listening"
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-white hover:bg-lavender-100 text-headingtext border border-lavender-300"
              }`}
            >
              {interactionState === "listening" ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4 text-lavender-700" />
              )}
              <span>{interactionState === "listening" ? `${recordingSeconds}s Stop` : "Record"}</span>
            </button>

            {/* Upload Audio File Button */}
            <button
              type="button"
              disabled={interactionState !== "ready"}
              onClick={() => fileInputRef.current?.click()}
              title="Upload customer audio file (.wav, .mp3, .webm)"
              className="h-11 px-3.5 rounded-full bg-white hover:bg-lavender-100 text-headingtext border border-lavender-300 flex items-center gap-1.5 text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-lavender-700" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
