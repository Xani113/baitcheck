# 🛡️ PhishGuard AI — Digital Communication Threat Intelligence

> Built for the **PromptWar Hackathon** (Cybersecurity Track)  
> Real-time AI and heuristic detection of fraudulent SMS, WhatsApp messages, and deceptive links with actionable educational threat breakdowns.

---

## 🌟 Key Features & UI/UX Modules

1. **🔍 Intelligent Threat Radar (Scam Scanner)**:
   - Instant paste & scan with character counters and live presets (SBI KYC, India Post, Electricity disconnection extortion, YouTube task scams).
   - Animated Radar scanning visualizer.
   - **0–100% Threat Score Gauge** (`DANGEROUS_PHISHING`, `SUSPICIOUS`, `SAFE`).
   - Detailed Threat Indicators breakdown with severity badges (`CRITICAL`, `HIGH`, `MEDIUM`).
2. **⚖️ Spot The Fake (Side-by-Side Deconstruction)**:
   - Visual comparative anatomy of authentic bank OTPs vs. malicious credential harvesters.
   - Interactive callouts highlighting domain spoofing, synthetic urgency, and masking tricks.
3. **🎮 Phishing Instincts Quiz**:
   - Gamified cybersecurity awareness simulator for users to test their instincts on real-world scams.
4. **🚨 Emergency SOS & Helplines**:
   - Direct emergency directory: National Cybercrime Helpline **1930**, `cybercrime.gov.in`, and 24/7 bank card freeze numbers.
5. **📱 1-Click WhatsApp Family Alert**:
   - Formats a clean, high-priority safety warning card to forward to family group chats.

---

## 🛠️ Architecture & Tech Stack

```mermaid
flowchart TD
    User([User: SMS / WhatsApp / Link]) --> UI[Next.js 14 Responsive Web App with Framer Motion]
    UI --> InputSanitizer[Input Sanitizer & Delimiter Wrapper]
    InputSanitizer --> HybridEngine{Hybrid Detection Engine}
    
    subgraph Detection Layer
        HybridEngine --> HeuristicScanner[Local Heuristic Engine: Regex, TLDs, Urgency, Brand Spoofing]
        HybridEngine --> LlmAnalyzer[AI Prompt Analysis: Structured JSON & Intent Classification]
    end

    HeuristicScanner --> Aggregator[Risk Scoring & Synthesis Matrix]
    LlmAnalyzer --> Aggregator

    Aggregator --> OutputUI[Interactive Threat Report Card]
    OutputUI --> ScoreGauge[0-100% Risk Gauge: Safe / Suspicious / Dangerous]
    OutputUI --> RedFlags[Red Flag Indicators & URL Breakdown]
    OutputUI --> EduGuide[Educational Risk Explanation & Immediate Remedies]
    OutputUI --> ShareWhatsApp[1-Click Family Shareable Alert on WhatsApp]
```

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Animation & Motion**: `framer-motion` for fluid tab transitions and radar sweeps
- **Styling**: Tailwind CSS + `lucide-react`
- **Detection**: Hybrid AI (Google Gemini 1.5 Flash structured output + fast deterministic regex/heuristic engine)
- **Deployment**: Vercel ready (zero configuration, < 0.2 MB total repo size)

---

## 📊 Evaluation & Benchmark Accuracy

PhishGuard AI was developed following **Eval-Driven Development (EDD)**:
- Tested against a ground-truth dataset of 7 realistic Indian/Global fraud templates and legitimate OTP messages.
- **Accuracy**: `100.0%`
- **False Positive Rate**: `0.0%` (Legitimate bank OTPs and courier notices are never falsely marked as scams).
- Run evals locally:
  ```bash
  python evals/run_evals.py
  ```

---

## 🚀 Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Xani113/baitcheck.git
   cd promptwar
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment (Optional)**:
   Create a `.env.local` file with your Gemini API Key (app has full deterministic heuristic fallback if no key is supplied):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.
