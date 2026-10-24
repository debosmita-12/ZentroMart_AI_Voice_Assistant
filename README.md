# ZentroMart AI Voice Assistant — VoiceOps 2026

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Gnani.ai](https://img.shields.io/badge/Speech-Gnani%20Vachana-emerald.svg)](https://app.gnani.ai/voice)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An evidence-grounded, multi-turn AI Customer Support Voice Assistant for **ZentroMart** (a fictional Indian e-commerce platform for groceries and electronics), built for the **IIT Guwahati × Gnani.ai VoiceOps 2026 Capstone**.

The project marries two rigorous objectives:
1. **IIT Guwahati VoiceOps 2026 Capstone Requirements:** All four progressive engineering stages, dataset-backed business logic, policy precedence enforcement, caller identity gating, official tool execution (`lookup_order`, `create_ticket`), Gnani speech integration (`gnani-vachana` SDK), batch audio CLI runner, automated evaluations, and reproducible outputs.
2. **Cinematic Lavender UI/UX:** A dedicated AI product landing page and interactive support console featuring a light lilac/lavender palette (`#F8F5FF`, `#C4B5FD`, `#6D4CC3`), subtle looping background video, liquid-glass frosted components, high-contrast dark purple typography, responsive layout, and prominent credit: **Made by — Debosmita**.

---

## 📑 Table of Contents

- [System Architecture](#system-architecture)
- [The 4 Capstone Stages](#the-4-capstone-stages)
- [Directory Structure](#directory-structure)
- [Prerequisites & Installation](#prerequisites--installation)
- [Dataset Placement & Validation](#dataset-placement--validation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Mandatory Batch Audio CLI Runner](#mandatory-batch-audio-cli-runner)
- [Automated Evaluations & Benchmarks](#automated-evaluations--benchmarks)
- [Test Suite](#test-suite)
- [Security & Dataset Handling](#security--dataset-handling)
- [Deliverables & Submission ZIP](#deliverables--submission-zip)

---

## 🏛️ System Architecture

```text
[ Customer Audio ] ──► [ Gnani STT (en-IN / hi-en / 10 langs) ] ──┐
                                                                   ▼
[ Customer Text  ] ──────────────────────────────────────────► [ Step 3 Conversational Agent ]
                                                                   │
                       ┌───────────────────────────────────────────┴───────────────────────────────────────────┐
                       ▼                                                                                       ▼
         [ Hybrid RAG Knowledge Base ]                                                           [ Official Tools ]
       • 21 Markdown Policies & Guides                                                         • lookup_order(id, proof)
       • Precedence: Policy > Guide > Help > FAQ > Mkt                                         • Caller ID Verification (4-digit phone / pincode)
       • Reference Date: 20 Oct 2026                                                           • create_ticket(summary, order_id)
       • Mon-Sat Business Days (Excl. 4 Holidays)                                              • Human Escalation (> ₹10k damage / compensation)
                       │                                                                                       │
                       └───────────────────────────────────────────┬───────────────────────────────────────────┘
                                                                   ▼
                                                       [ Grounded Agent Response ]
                                                                   │
                                                                   ▼
                                               [ Gnani TTS (timbre-v2.5, Kaveri Voice) ]
                                                                   │
                                                                   ▼
                                                        [ Spoken Output WAV ]
```

---

## 🚀 The 4 Capstone Stages

### Stage 1: LLM Prompting Baseline
- Implements a conversational support persona without access to ZentroMart's private policies or database.
- Introduces itself as an AI assistant in the opening turn (`STY-1`).
- Evaluated on `practice/questions.csv` to establish an honest baseline (1.92% overall pass rate due to lack of internal policy knowledge).

### Stage 2: Document-Grounded RAG Pipeline
- Ingests all 21 Markdown files in `kb/` with preserved section IDs (e.g. `[RET-2]`, `[IDV-2]`, `[WAR-2]`).
- Indexes 70 product rows from `products.csv` as catalog evidence chunks (`products.csv:<sku>`).
- Strictly enforces policy precedence: **Current Policy (Rank 1) > Agent Guides (Rank 2) > Help (Rank 3) > FAQs (Rank 4) > Marketing (Rank 5)**.
- `pol_returns_v4.md` overrides superseded v3, and policy `REF-2` overrides `FAQ-1` (instant 2-hour wallet refund vs 5-7 days).
- Uses **20 October 2026** as reference date. Business days run Monday–Saturday excluding warehouse holidays (`holidays.csv`). Return windows use calendar days.
- **Results:** Achieves **88.46% decision accuracy**, **75.0% evidence hit rate**, and a **10× improvement in overall pass rate** over baseline.

### Stage 3: Multi-turn Context & Tool Execution
- Maintains conversational memory, order tracking, and coreference resolution (e.g., *"How long will that take?"* -> wallet refund for active order).
- **Caller Identity Verification:** Integrates official `lookup_order(order_id)`. Withholds all order details until the customer provides the last 4 digits of their registered phone or 6-digit delivery pincode. Max one retry. Zero data leaks (**100% verification gate compliance**).
- **Human Escalation:** Demands for unauthorized compensation or high-value damage claims (> ₹10,000) invoke `create_ticket(summary, order_id, reason, intent)`. Confirms handover only after `created=True`.

### Stage 4: Gnani Speech Integration
- Uses official `gnani-vachana` SDK: `GnaniSTTClient` for audio transcription and `GnaniTTSClient` for spoken synthesis.
- **Strict Compliance:** No third-party STT/TTS fallbacks are permitted or used.
- Model: `timbre-v2.5` | English Voice: `Kaveri` | Supports 10 Indian regional languages + Hinglish (`en-IN`).

---

## 📁 Directory Structure

```text
ZentroMart_AI_Voice_Assistant/
├── Capstone_Project_Dataset_FTTT_2026/   # Official synthetic dataset
│   ├── data/                             # 7 CSV tables (customers, orders, items, products, etc.)
│   ├── kb/                               # 21 Markdown company policy documents
│   ├── practice/                         # 52 practice questions & 23 conversations (96 turns)
│   ├── tools/                            # Official synthetic Python tools (lookup_order, create_ticket)
│   ├── DATA_DICTIONARY.md                # Schema definitions
│   └── validate_dataset.py               # Dataset validator
├── frontend/                             # Cinematic React + Vite + Tailwind UI
│   ├── public/media/                     # Cinematic 5s looping video (hero-loop.mp4) & poster
│   ├── src/
│   │   ├── components/                   # Navbar, Hero, SupportWorkspace, Capabilities, etc.
│   │   ├── types.ts                      # TypeScript interfaces
│   │   ├── App.tsx                       # Unified application
│   │   └── index.css                     # Liquid-glass CSS specification
│   ├── package.json
│   └── vite.config.ts
├── src/
│   ├── agent/                            # Baseline, RAG Agent, Conversational Agent, LLM Client
│   ├── rag/                              # Ingestion, Chunking, Hybrid Retriever, Precedence Ranker
│   ├── data/                             # Pandas CSV Loader with strict string type preservation
│   ├── voice/                            # Gnani STT & TTS Service wrapper (gnani-vachana)
│   ├── api/                              # FastAPI endpoints (/api/chat, /api/voice/process, /api/health)
│   ├── evaluation/                       # Automated evaluators for Step 1 vs 2 and Conversations
│   └── utils/                            # Date rules (20 Oct 2026, Mon-Sat business days, holidays)
├── tests/                                # 18 PyTest unit & integration tests (100% pass)
├── scripts/
│   ├── generate_cinematic_loop.py        # Generates seamless 5s looping background video
│   └── generate_report.py                # Generates official 4-page report.pdf
├── input_audio/                          # Directory for customer audio files
├── outputs/                              # Batch runner output manifests, audio, and transcripts
├── sample_outputs/                       # Sanitized sample outputs for submission archive
├── reports/                              # Benchmark evaluation summaries (JSON and CSV)
├── run.py                                # Mandatory Batch Audio CLI Runner
├── requirements.txt                      # Python dependencies
├── .env.example                          # Configuration template
├── demo_script.md                        # 2-minute video presentation walkthrough
├── report.pdf                            # 4-page official submission report
└── README.md
```

---

## ⚙️ Prerequisites & Installation

### 1. Python Environment
Requires Python 3.10+ (tested on Python 3.14).
```bash
# Clone the repository
git clone https://github.com/debosmita-12/ZentroMart_AI_Voice_Assistant.git
cd ZentroMart_AI_Voice_Assistant

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Frontend Environment (Optional for standalone UI development)
Requires Node.js 18+ and npm.
```bash
cd frontend
npm install
npm run build
cd ..
```

---

## 🔍 Dataset Placement & Validation

The official synthetic dataset is located in `Capstone_Project_Dataset_FTTT_2026/`. To run the offline validation script:

```bash
python Capstone_Project_Dataset_FTTT_2026/validate_dataset.py
```
Expected output:
```text
PASS — all 9 CSVs, 21 KB documents, primary/foreign keys, order math,
       practice evidence, verification gates and company naming validated.
       1,000 orders | 1,783 items | 244 logs | 52 questions | 23 conversations
```

---

## 🔑 Environment Configuration

Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Populate the keys:
```dotenv
# Google Gemini API Key (for LLM generation and embeddings)
GOOGLE_API_KEY=your_google_gemini_api_key_here

# Gnani Voice API Key (for STT and TTS)
GNANI_API_KEY=your_gnani_api_key_here

# Model options
LLM_MODEL=gemini-2.5-flash
LOG_LEVEL=INFO
```

---

## 🖥️ Running the Application

### Option A: Full-Stack Mode (Single Command)
FastAPI serves both the backend API and the compiled cinematic frontend on port `8000`:
```bash
uvicorn src.api.main:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser at: **`http://localhost:8000`**

### Option B: Concurrent Frontend Dev Mode
For interactive frontend development with Vite HMR:
```bash
# Terminal 1: Backend API
uvicorn src.api.main:app --port 8000 --reload

# Terminal 2: Frontend Vite
cd frontend
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

## 🎙️ Mandatory Batch Audio CLI Runner

The project fulfills the capstone requirement for offline batch audio testing:

```bash
python run.py --input-dir ./input_audio --output-dir ./outputs
```

Optional arguments:
- `--language`: Language code (default: `en-IN`, also supports `hi-IN`, `gu-IN`, `ta-IN`, `te-IN`, etc.).

### What happens during a batch run:
1. Discovers all audio files in `--input-dir` (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`).
2. Transcribes customer speech using **Gnani STT**.
3. Evaluates transcript using the **Step 3 Conversational Agent**.
4. Grounds answers using **Knowledge Base evidence** and executes tools if applicable.
5. Synthesizes assistant reply audio using **Gnani TTS** (`timbre-v2.5`, `Kaveri` voice).
6. Generates reproducible outputs:
   - `outputs/manifest.json`: Full structured JSON execution manifest.
   - `outputs/results.csv`: Table containing file, transcript, reply, tool calls, and status.
   - `outputs/transcripts/<name>.txt`: Transcripts and reply texts.
   - `outputs/evidence/<name>_evidence.json`: Exact chunk IDs and tool records.
   - `outputs/audio/<name>_reply.wav`: Spoken output WAV files.

---

## 📊 Automated Evaluations & Benchmarks

To execute the automated evaluation pipelines:

### 1. Step 1 Baseline vs. Step 2 RAG (52 Questions)
```bash
python src/evaluation/eval_step1_vs_step2.py
```
**Measured Benchmarks:**
- Step 1 Baseline Decision Accuracy: **80.77%** | Overall Pass: **1.92%**
- Step 2 Grounded RAG Decision Accuracy: **88.46%** | Overall Pass: **19.23% (10× gain)**
- Step 2 Evidence Retrieval Hit Rate: **75.0%**
- Hallucination Avoidance: **100.0%** (zero false dates or policies promised)

### 2. Multi-turn Conversation Evaluation (23 Scenarios, 96 Turns)
```bash
python src/evaluation/eval_conversations.py
```
**Measured Benchmarks:**
- Verification Gate Compliance: **100.0%** (no order details disclosed before verification)
- Tool Call Matching Accuracy: **87.04%** (`lookup_order` & `create_ticket`)
- Turn Pass Rate: **75.0%**

---

## 🧪 Test Suite
 
Run the 46 automated unit, integration, and voice conversation regression tests using PyTest:

```bash
python -m pytest tests/
```
Output:
```text
tests/test_api.py ...                                                    [  6%]
tests/test_conversational_agent.py ...                                   [ 13%]
tests/test_dataset.py ...                                                [ 19%]
tests/test_date_utils.py ....                                            [ 28%]
tests/test_rag.py ...                                                    [ 34%]
tests/test_voice.py ..                                                   [ 39%]
tests/test_voice_conversation_flow.py ............................       [100%]
======================= 46 passed in 7.43s ========================
```

---

## 🔒 Security & Dataset Handling

- **Zero Secrets Committed:** `.env` is excluded in `.gitignore`. Only `.env.example` is committed.
- **Synthetic Data:** The dataset is synthetic. Customer phone numbers use the dummy prefix `+91 5...` and emails are on `example.com`.
- **Identity Gated Lookups:** Order data is locked behind caller verification. Lookups are not retained across sessions.
- **Submission ZIP Cleanliness:** The final submission ZIP contains no virtual environments, `node_modules`, API keys, or copies of the dataset.

---

## 📦 Deliverables & Submission ZIP

- **Made by — Debosmita** (IIT Guwahati × Gnani.ai VoiceOps 2026)
- **Public GitHub Repo:** [https://github.com/debosmita-12/ZentroMart_AI_Voice_Assistant](https://github.com/debosmita-12/ZentroMart_AI_Voice_Assistant)
- **4-Page Report:** [`report.pdf`](report.pdf)
- **Demo Script (120s):** [`demo_script.md`](demo_script.md)
- **Submission Archive:** `team_name_voiceops.zip` (generated via `python scripts/create_submission_zip.py`)