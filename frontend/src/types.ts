export interface MessageEvidence {
  section_id: string;
  title: string;
  doc_name: string;
  doc_type: string;
  status: string;
  content_preview: string;
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "assistant";
  text: string;
  timestamp: string;
  decision?: string;
  evidence_used?: string[];
  detailed_evidence?: MessageEvidence[];
  tool_call?: string | null;
  audio_url?: string | null;
  verified?: boolean;
  ticket?: {
    created: boolean;
    ticket_id: string;
  } | null;
}

export interface BackendHealth {
  status: string;
  company: string;
  reference_date: string;
  gnani_configured: boolean;
  gnani_api_key_set: boolean;
  gemini_api_key_set: boolean;
  dataset_counts: {
    customers: number;
    orders: number;
    products: number;
    pincodes: number;
    kb_chunks: number;
  };
}

export interface EvaluationSummary {
  total_questions: number;
  step1_baseline: {
    decision_accuracy_pct: number;
    must_include_rate_pct: number;
    hallucination_avoidance_pct: number;
    overall_pass_pct: number;
  };
  step2_rag: {
    decision_accuracy_pct: number;
    must_include_rate_pct: number;
    hallucination_avoidance_pct: number;
    evidence_retrieval_hit_pct: number;
    overall_pass_pct: number;
  };
}
