# ZentroMart AI Voice Assistant
### VoiceOps 2026 · AI-Powered Customer Support

**An intelligent, voice-enabled customer support assistant that combines Retrieval-Augmented Generation (RAG), multi-turn conversational AI, and secure order-management tools to deliver grounded, policy-aware customer experiences.**

<p align="center">
  <a href="https://zentro-mart-ai-voice-assistant.vercel.app/"> Live Demo</a> ·
  <a href="https://github.com/debosmita-12/ZentroMart_AI_Voice_Assistant"> GitHub Repository</a> ·
  <a href="https://zentromart-ai-backend.onrender.com/api/health"> Backend Health</a>
</p>

---

## Overview

ZentroMart AI Voice Assistant is an AI-powered customer support application developed for **VoiceOps 2026**, the capstone project associated with the Consulting & Analytics Club, IIT Guwahati, in collaboration with Gnani.ai.

The application helps customers understand store policies, resolve order-related queries, and initiate support requests through natural-language conversations.

Rather than relying exclusively on an LLM's general knowledge, the system retrieves relevant information from a structured company knowledge base and uses backend tools for supported customer-service operations.

The project brings together four key capabilities:

- **Prompt Engineering:** Establishes a baseline for instruction-following customer support.
- **Retrieval-Augmented Generation (RAG):** Grounds responses in company documentation and relevant policy evidence.
- **Multi-Turn AI Agent:** Supports contextual conversations, verified order lookups, and ticket creation.
- **Voice Integration:** Uses Gnani.ai for speech-to-text (STT) and text-to-speech (TTS).

## Key Features

### Grounded AI Responses
- Retrieves relevant information from the company knowledge base.
- Uses policy documents and supporting evidence to inform responses.
- Helps reduce unsupported claims and inconsistent policy answers.
- Supports knowledge-base search for inspection and debugging.

### Multi-Turn Conversational Support
- Maintains conversational context across turns.
- Handles follow-up questions and requests for clarification.
- Guides users through customer-support workflows.
- Supports policy-aware responses and escalation where appropriate.

### Secure Order Lookup
- Integrates with the backend order-lookup tool.
- Requires customer verification before disclosing protected order details.
- Supports verification using the phone number's last four digits or the delivery pincode, according to the implemented workflow.
- Keeps order identifiers as strings to preserve their exact values.

### Support Ticket Creation
- Supports ticket creation through a backend tool.
- Uses tool results to determine whether ticket creation succeeded.
- Avoids claiming that a ticket was created when the tool does not confirm success.

### Voice-Enabled Interaction
- Integrates Gnani.ai for speech recognition and speech generation.
- Supports audio upload and spoken response playback through the application.
- Resolves generated audio URLs against the backend service.
- Keeps speech processing on the configured Gnani integration rather than silently switching to an alternative speech provider.

### Evaluation and Developer Tools
- Provides access to evaluation status and knowledge-base search endpoints.
- Supports testing of grounded responses, verification requirements, and tool execution.
- Includes automated tests for important API and application behaviours.

---

## System Architecture

```text
                    ┌───────────────────────────┐
                    │       User Interface      │
                    │       React + Vite        │
                    └─────────────┬─────────────┘
                                  │
                     Text Input / Audio Upload
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │       FastAPI Backend     │
                    │     API + Orchestration   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┼──────────────┐
                    │             │              │
                    ▼             ▼              ▼
             ┌────────────┐ ┌────────────┐ ┌──────────────┐
             │ Gemini LLM │ │ RAG / KB   │ │ Agent Tools  │
             │ Reasoning  │ │ Retrieval  │ │ Orders/Tickets│
             └────────────┘ └────────────┘ └──────────────┘
                    │             │              │
                    └─────────────┼──────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │     Response Generation   │
                    └─────────────┬─────────────┘
                                  │
                         Text or Audio Response
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │       Gnani.ai STT/TTS    │
                    └───────────────────────────┘
```

*Logical architecture overview; exact request flow depends on the selected interaction mode.*

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| Language model | Google Gemini API |
| Retrieval and knowledge base | RAG pipeline over company documentation |
| Speech processing | Gnani.ai STT and TTS |
| API communication | HTTP / REST |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Testing | Pytest, frontend production build |
| Version control | Git and GitHub |

## Repository Structure

```text
ZentroMart_AI_Voice_Assistant/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SupportWorkspace.tsx
│   │   │   └── DeveloperDrawer.tsx
│   │   ├── config/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── vite-env.d.ts
│   ├── .env.example
│   ├── .env.production
│   ├── package.json
│   └── vite.config.ts
│
├── src/
│   └── api/
│       └── main.py
│
├── tests/
│   └── test_api.py
│
├── Capstone_Project_Dataset_FTTT_2026/
│   ├── Knowledge Base Documents
│   ├── CSV Data Files
│   └── Practice / Evaluation Data
│
├── scripts/
├── input_audio/
├── reports/
├── sample_outputs/
├── .gitignore
└── README.md
```

*The tree highlights the principal application components. Refer to the repository for the complete file structure.*

---

## Getting Started

### Prerequisites

Install the following before running the application locally:

- Python 3.10 or a compatible version supported by the project's dependencies.
- Node.js and npm.
- Git.
- Google Gemini API credentials.
- Gnani.ai API credentials for live voice functionality.

### 1. Clone the Repository

```bash
git clone https://github.com/debosmita-12/ZentroMart_AI_Voice_Assistant.git

cd ZentroMart_AI_Voice_Assistant
```

### 2. Configure Environment Variables

Create a `.env` file in the repository root for backend configuration. Use `.env.example` as a reference if available.

```dotenv
GOOGLE_API_KEY=your_google_api_key
GNANI_API_KEY=your_gnani_api_key
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Never commit actual API keys or private credentials.

### 3. Set Up the Backend

Create and activate a virtual environment:

**Windows**

```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the backend dependencies using the dependency file provided by the repository:

```bash
pip install -r requirements.txt
```

Start the FastAPI application from the repository root:

```bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

If the repository uses a different dependency-file location or application entry point, follow the corresponding project configuration.

The local backend should be available at:

- API: `http://localhost:8000`
- Interactive API documentation, if enabled: `http://localhost:8000/docs`

### 4. Set Up the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local` if required:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`.

### 5. Verify the Backend

Open the health endpoint:

```text
http://localhost:8000/api/health
```

The endpoint should return a healthy JSON response when the backend is running correctly and its required configuration is available.

---

## Deployment

The application uses a separate frontend and backend deployment.

| Service | Platform | Purpose |
|---|---|---|
| Frontend | Vercel | Serves the React/Vite application |
| Backend | Render | Hosts the FastAPI service |
| LLM | Google Gemini API | Generates responses |
| Speech services | Gnani.ai | Processes speech input and output |

### Frontend — Vercel

Configure the following environment variable in the Vercel project settings:

```dotenv
VITE_API_BASE_URL=https://zentromart-ai-backend.onrender.com
```

Use the **Config** variable type for this non-sensitive URL. Vite variables prefixed with `VITE_` are exposed to client-side code, so never place API secrets in them.

Ensure that:

1. The Vercel project is connected to this GitHub repository.
2. The production branch is `main`.
3. The root directory is `frontend`.
4. A new production build is created after frontend or environment-variable changes.

### Backend — Render

Configure the backend environment variables in Render:

```dotenv
GOOGLE_API_KEY=your_google_api_key
GNANI_API_KEY=your_gnani_api_key
CORS_ALLOWED_ORIGINS=https://zentro-mart-ai-voice-assistant.vercel.app
```

Set the actual production origin in `CORS_ALLOWED_ORIGINS`. Add other trusted origins only when needed. The backend must explicitly permit the deployed frontend's origin through its CORS configuration.

Configure the Render start command to match the FastAPI entry point and hosting requirements.

**Important:** A successful frontend deployment does not necessarily mean the backend is reachable. Verify the health endpoint and inspect browser Network and Console errors if the interface remains in a connecting state.

---

## Security and Reliability

The application is designed around several important customer-support safeguards:

- **Server-side secrets:** Gemini and Gnani credentials belong in backend environment variables, never in frontend source code.
- **Caller verification:** Protected order details must not be disclosed before the required verification succeeds.
- **Tool-confirmed actions:** The assistant should report successful ticket creation only when confirmed by the backend tool.
- **Grounded responses:** Company policies and retrieved evidence should guide policy-related answers.
- **CORS restrictions:** Only trusted origins should be permitted.
- **Identifier preservation:** Order and customer identifiers should be handled as strings where leading zeros or exact formatting matter.
- **Honest failure handling:** API errors, missing data, and unavailable integrations should not be presented as successful operations.

Do not publish `.env` files, API keys, private customer information, or sensitive production logs.

---

## Testing and Evaluation

### Run Backend Tests

From the repository root, activate the virtual environment and run:

```bash
python -m pytest tests/ -v
```

### Build the Frontend

```bash
cd frontend
npm run build
```

### Recommended Evaluation Dimensions

| Evaluation area | What to verify |
|---|---|
| Response quality | Relevance, correctness, and instruction following |
| RAG grounding | Whether answers reflect the retrieved documentation |
| Evidence quality | Whether supporting source information is available when required |
| Verification | Whether protected order details remain gated |
| Tool execution | Whether order lookup and ticket creation behave correctly |
| Multi-turn dialogue | Whether follow-up questions preserve relevant context |
| Policy compliance | Whether unsupported requests are refused or escalated appropriately |
| Voice pipeline | Whether Gnani STT/TTS works with the configured credentials |
| Reliability | Whether errors and unavailable services are handled gracefully |
| Deployment | Whether frontend requests reach the intended backend |

Record evaluation results from actual test runs. Do not treat a successful build as proof that live LLM, voice, or deployment integrations are working.

---

## Knowledge Base and Data

The capstone dataset contains company knowledge documents and structured CSV files used by the application's retrieval and customer-support workflows.

The application is intended to use this material for policy answers and supported customer-service operations rather than relying on hardcoded responses.

When modifying or extending the dataset:

- Preserve identifier values and their original formatting.
- Follow the project's policy-precedence rules.
- Respect the documented date and business-day calculations.
- Keep test fixtures separate from live credentials and customer data.
- Validate retrieval behaviour after knowledge-base changes.

Consult the supplied capstone dataset documentation for the authoritative rules and data definitions.

---

## Project Workflow

The solution follows a staged development approach:

1. **Prompting baseline:** Establish a baseline for LLM-only customer support.
2. **RAG integration:** Retrieve relevant company documentation and ground responses in evidence.
3. **Agent workflows:** Add contextual dialogue, verified order lookup, ticket creation, and policy-aware escalation.
4. **Voice integration:** Connect Gnani.ai STT/TTS to the application.
5. **Evaluation and deployment:** Test the application, review failures, and deploy the frontend and backend independently.

This staged approach helps isolate the contribution of retrieval, tool use, and voice processing.

---

## Future Improvements

Potential next steps include:

- Expanded automated evaluation across customer-support scenarios.
- More detailed retrieval relevance and citation-quality metrics.
- Improved observability for API latency, model errors, and tool failures.
- Enhanced conversation-state management and session recovery.
- Broader accessibility and multilingual interaction testing.
- Automated deployment checks and integration tests against staging services.

## Author

**Debosmita Mukhopadhyay**  
B.Tech, Computer Science and Engineering — AI/ML

Project: ZentroMart AI Voice Assistant — VoiceOps 2026

- GitHub: [@debosmita-12](https://github.com/debosmita-12)
- Repository: [ZentroMart_AI_Voice_Assistant](https://github.com/debosmita-12/ZentroMart_AI_Voice_Assistant)

## Acknowledgements

Developed as part of **VoiceOps 2026**, associated with the Consulting & Analytics Club, IIT Guwahati, in collaboration with **Gnani.ai**.

## License

Refer to the repository's license file for the applicable terms of use.

---

<p align="center">
  <strong>ZentroMart AI — Smarter Support. Grounded Answers. Meaningful Conversations.</strong>
</p>
