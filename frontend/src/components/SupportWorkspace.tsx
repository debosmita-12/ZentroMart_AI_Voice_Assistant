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
} from "lucide-react";
import { ChatMessage, BackendHealth } from "../types";

interface SupportWorkspaceProps {
  health: BackendHealth | null;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

const INDIAN_LANGUAGES = [
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
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState(
    () => `conv_${Math.random().toString(36).substring(2, 9)}`
  );
  const [verifiedCaller, setVerifiedCaller] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [activeAudioPlaying, setActiveAudioPlaying] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<{ [id: string]: boolean }>({});
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Handle incoming initial prompt from Hero
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendText(initialPrompt.trim());
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "customer",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsProcessing(true);

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

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();

      if (data.verified) {
        setVerifiedCaller(data.order_id || "Verified");
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
          text: "I experienced a brief connection interruption. Please retry your message or reach out to our team.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Recording controls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        stream.getTracks().forEach((track) => track.stop());
        await processAudioPayload(audioBlob, "recording.wav");
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setVoiceNotice("Microphone permission denied or device not supported.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
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
    setIsProcessing(true);
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
        setVoiceNotice(data.error || "Gnani Voice API key not configured on backend.");
        return;
      }

      // Add user transcribed message
      if (data.transcript) {
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

      if (data.verified) {
        setVerifiedCaller(data.conversation_id);
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
        tool_call: data.tool_call,
        audio_url: data.audio_url,
        verified: data.verified,
        ticket: data.ticket,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Auto-play audio if generated
      if (data.audio_url) {
        playAudio(data.audio_url);
      }
    } catch (err: any) {
      setVoiceNotice("Failed to send audio to backend voice service.");
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (url: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = url;
      audioPlayerRef.current.play();
      setActiveAudioPlaying(url);
      audioPlayerRef.current.onended = () => setActiveAudioPlaying(null);
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
    setActiveTicket(null);
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

      {/* Workspace Container with Liquid-Glass Treatment */}
      <div className="liquid-glass rounded-3xl p-5 sm:p-8 flex flex-col border border-white/10 shadow-2xl">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-white font-medium text-lg tracking-tight">
                ZentroMart Support Console
              </h2>
            </div>
            <p className="text-white/50 text-xs mt-1">
              Ref Date: <span className="text-white/80">20 Oct 2026</span> • Mon-Sat Business Days • Calendar Return Windows
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Verification State Pill */}
            {verifiedCaller ? (
              <div className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Caller Verified</span>
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Verification Gated</span>
              </div>
            )}

            {/* Ticket Badge */}
            {activeTicket && (
              <div className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5" />
                <span>{activeTicket.substring(0, 10)}...</span>
              </div>
            )}

            {/* Language Selector */}
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-black/60 border border-white/15 text-white/90 text-xs rounded-full px-3 py-1.5 focus:outline-none hover:border-white/30 transition-colors"
            >
              {INDIAN_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-neutral-900 text-white">
                  {l.label}
                </option>
              ))}
            </select>

            {/* Reset Button */}
            <button
              onClick={handleResetSession}
              title="Reset conversation"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Voice Warning / Notice Banner if needed */}
        {voiceNotice && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/50 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{voiceNotice}</span>
          </div>
        )}

        {/* Conversation Thread */}
        <div className="my-6 min-h-[380px] max-h-[500px] overflow-y-auto pr-2 space-y-4">
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
                      ? "bg-white text-black font-normal rounded-tr-sm"
                      : "liquid-glass text-white/95 border border-white/10 rounded-tl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Assistant Extra Metadata: Audio player, tools, evidence */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
                      {/* Audio playback button */}
                      {msg.audio_url && (
                        <button
                          onClick={() => playAudio(msg.audio_url!)}
                          className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {activeAudioPlaying === msg.audio_url ? (
                            <Pause className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Play className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>Listen (Gnani TTS)</span>
                        </button>
                      )}

                      {/* Tool Call Tag */}
                      {msg.tool_call && (
                        <span className="px-2.5 py-1 rounded-full bg-sky-950/70 border border-sky-500/30 text-sky-300 font-mono text-[11px]">
                          ⚡ {msg.tool_call}
                        </span>
                      )}

                      {/* Evidence Pill */}
                      {msg.evidence_used && msg.evidence_used.length > 0 && (
                        <button
                          onClick={() => toggleEvidence(msg.id)}
                          className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-emerald-400" />
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
                  <div className="mt-2 max-w-[85%] sm:max-w-[75%] p-3.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white/80 space-y-2 animate-in fade-in duration-200">
                    <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Grounded Official Passages:
                    </p>
                    {msg.detailed_evidence.map((ev, i) => (
                      <div key={i} className="p-2 rounded bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between font-mono text-[11px] text-white/60 mb-1">
                          <span className="text-white/90 font-bold">[{ev.section_id}] {ev.title}</span>
                          <span>{ev.doc_name}</span>
                        </div>
                        <p className="text-white/70 line-clamp-3">{ev.content_preview}</p>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-white/40 mt-1 px-1">{msg.timestamp}</span>
              </div>
            );
          })}

          {/* Typing / Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-white/60 liquid-glass px-4 py-2.5 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ZentroMart AI is checking documents & tools...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Voice Controls */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
          {/* Text Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendText(inputVal);
            }}
            className="w-full flex-1 flex items-center gap-2 bg-black/60 rounded-full border border-white/15 px-4 py-1.5 focus-within:border-white/40 transition-colors"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                isRecording
                  ? `Listening (${recordingSeconds}s)... click mic to stop`
                  : "Type your query (or click mic / upload audio)..."
              }
              disabled={isRecording}
              className="bg-transparent text-white placeholder-white/40 text-sm focus:outline-none w-full py-1.5"
            />

            <button
              type="submit"
              disabled={!inputVal.trim() || isProcessing}
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Audio Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Record Mic Button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? "Stop recording" : "Record audio (Gnani STT)"}
              className={`h-11 px-4 rounded-full flex items-center gap-2 text-xs font-medium transition-all cursor-pointer ${
                isRecording
                  ? "bg-red-500/90 text-white animate-pulse"
                  : "liquid-glass liquid-glass-interactive text-white/90 hover:bg-white/15"
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span>{isRecording ? `${recordingSeconds}s Stop` : "Record"}</span>
            </button>

            {/* Upload Audio File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload customer audio file (.wav, .mp3)"
              className="h-11 px-3.5 rounded-full liquid-glass liquid-glass-interactive flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
