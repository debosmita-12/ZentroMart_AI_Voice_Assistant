# ZentroMart AI Voice Assistant — 2-Minute Demo Script & Walkthrough

This script provides the exact 120-second step-by-step recording sequence for presenting the ZentroMart AI Voice Assistant to the judges at the IIT Guwahati VoiceOps 2026 capstone presentation.

---

## ⏱️ Video Timing Breakdown (Total: 120 Seconds)

### Scene 1: Cinematic Entry & Architecture Overview (0:00 – 0:20 | 20s)
- **Visual:** Open browser at `http://localhost:5173` (or full-stack port `8000`). Show the full-screen cinematic hero with the looping ribbon background video (`hero-loop.mp4`), floating liquid-glass navigation bar, and Instrument Serif headline *"Support that truly listens."*
- **Spoken Narration:**
  > *"Welcome to ZentroMart AI Voice Assistant, our submission for the VoiceOps 2026 Capstone by IIT Guwahati and Gnani.ai. Inspired by the editorial minimalism of Cinematic Sites, our system combines an immersive web experience with an evidence-grounded multimodal support agent that listens, understands, and speaks."*
- **Action:** Scroll to the Support Workspace console or click the primary CTA *"Start chatting"*.

---

### Scene 2: Grounded Document Retrieval & Policy Precedence (0:20 – 0:45 | 25s)
- **Customer Query:**
  > *"How fast are refunds to the ZentroMart Wallet?"*
- **Assistant Response:**
  > *"Refunds to ZentroMart Wallet are instant, credited within 2 hours of pickup completion."*
- **Highlight to Judges:**
  - Click the **"Evidence: REF-2, KB-00.1"** badge to expand the grounded passages drawer.
  - Show how the retriever correctly prioritized current policy `pol_returns_v4.md` (`REF-2`) over the `FAQ-1` trap (which claimed 5 to 7 days).
- **Spoken Narration:**
  > *"Here, the agent answers strictly from company policy document REF-2. Notice how our precedence hierarchy avoids the trap in FAQ-1, correctly giving the 2-hour refund timeline and exposing the exact source clauses in the evidence drawer."*

---

### Scene 3: Multi-turn Context & Caller Identity Gating (0:45 – 1:15 | 30s)
- **Customer Query (Turn 1):**
  > *"Hello, mujhe order ke baare mein help chahiye."*
- **Assistant Response:**
  > *"Namaste! Main ZentroMart ka AI customer support assistant hoon. Main aapki kya madad kar sakta hoon? Kripya apna 8-digit Order ID share karein."*
- **Customer Query (Turn 2):**
  > *"Order number hai 8978 2837."*
- **Assistant Response:**
  > *"Aapke order 89782837 ki suraksha ke liye, kripya apne registered phone number ke aakhri 4 digits ya 6-digit delivery pincode batayein."*
- **Customer Query (Turn 3):**
  > *"Last four digits 4533 hain."*
- **Assistant Response:**
  > *"Thank you Kabir, your verification is successful. How can I assist you with order 89782837?"*
- **Highlight to Judges:**
  - Zero private order details leaked before Turn 3 verification.
  - The green **"Caller Verified"** badge turns active.
- **Spoken Narration:**
  > *"Notice our strict identity verification gate. The synthetic lookup_order tool withholds all order details until the customer proves ownership with their 4-digit phone suffix. The assistant securely verifies customer Kabir without ever reading expected secrets aloud."*

---

### Scene 4: Policy Enforcement, High-Value Damage Handover & Ticket Creation (1:15 – 1:40 | 25s)
- **Customer Follow-Up (Turn 4):**
  > *"Maine Zentro Vista 43-inch 4K Smart TV damage report kiya tha. Abhi replacement approve kar do na?"*
- **Assistant Response:**
  > *"For high-value electronics exceeding ₹10,000, replacement claims require physical inspection by our specialist team. I have logged ticket TKTa807e788b5284... for Priority Resolution."*
- **Highlight to Judges:**
  - Show the purple **Ticket Badge** appear with the generated UUID.
  - Explain that the tool logged the escalation to `tickets_created.csv` and confirmed `created=True`.
- **Spoken Narration:**
  > *"Because the damaged item is valued at ₹34,999, company policy mandates human review. The assistant politely refuses direct approval, invokes create_ticket, and hands over to our Priority Resolution team with the confirmed ticket ID."*

---

### Scene 5: Gnani Speech Demonstration & Closing (1:40 – 2:00 | 20s)
- **Action:** Demonstrate voice interaction by clicking the microphone button or uploading an audio file.
- **Visual:** Waveform pulses during listening, transcript renders in Latin script (`en-IN` / `hi-en`), and the response audio plays back with the Kaveri English voice via Gnani TTS.
- **Spoken Narration:**
  > *"Finally, all conversations can be spoken using Gnani STT and TTS across 10 Indian regional languages. The batch runner processes entire folders via `python run.py --input-dir ./input_audio --output-dir ./outputs`. Thank you!"*
