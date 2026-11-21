# 🛡️ BaitCheck
> **"Don't take the bait."**  
> A mobile-first Progressive Web App (PWA) that tells anyone, in seconds, whether a message they received (SMS, WhatsApp, email) is a scam, and what to do next.  
> *Usable by a first-time smartphone user, an elderly person, or someone with low literacy, with zero training.*

---

## 🌟 Key Highlights

- **100% On-Device & Private**: Your messages **never** leave your phone. Zero network requests with user content.
- **Works Fully Offline**: Installs as an offline PWA via Service Worker (`sw.js`). No external CDNs, no external fonts.
- **Multilingual (3 Indian Languages)**: Complete support for **English**, **हिन्दी (Hindi)**, and **অসমীয়া (Assamese)** with native rendering of script-specific characters like ৰ and ৱ.
- **Elderly-Friendly & Calm UX**:
  - Minimum text size $\ge 18\text{px}$ with instant `A-` / `A+` font scaling.
  - Generous touch targets $\ge 48\text{px} \times 48\text{px}$.
  - Zero flashing alarms or anxiety-inducing dark patterns.
  - Text-to-speech voice playback in all languages.
  - Plain language verdicts: **LOOKS SAFE (Green ✓)**, **BE CAREFUL (Amber !)**, **LIKELY SCAM – DON'T BITE (Red ✗)**.
- **TDD Benchmarked (100% Pass Rate)**: Tested against 25 multilingual ground-truth cases across English, Hindi, Hinglish, and Assamese with **0% False Alarms**.

---

## 🚀 Quick Run Instructions

### Option 1: Open Directly in Any Web Browser
Simply double-click or open `index.html` in Chrome, Safari, Edge, or Firefox.
No build step, no npm install, no backend required!

### Option 2: Run Local Server (PWA & Service Worker Testing)
```bash
# Using Python
python -m http.server 8000

# OR using Node
npx serve .
```
Visit `http://localhost:8000` (or the port shown) on your phone or desktop.

---

## 🧪 Run Automated TDD Benchmark Tests

We follow Test-Driven Development (TDD). The test suite includes 25 realistic scam and safe messages across all supported scripts:

```bash
npm test
# OR
node run-tests.node.js
```

### In-Browser Interactive Test Runner
You can also open `tests.html` in your browser to run the benchmark visually:
- Click **"Run All Tests"** to see passing assertions, category breakdowns, and scores.
- Target achieved: **100% Accuracy (25/25), 0 False Alarms**.

---

## 🧠 How the Detection Engine Works (`engine.js` + `rules.json`)

The engine uses an explainable, weighted signal evaluation system with whitelist suppression:

1. **Whitelist Suppression (Zero False Alarms)**:
   - Genuine bank transaction notifications ("INR 25,000 credited to A/c ending 9012").
   - Official delivery updates ("Amazon order #402 is out for delivery").
   - Real bank OTPs with clear "do not share" warnings and **zero external links**.
   - Casual personal and family chats ("Maa, I reached the station").
   - When a whitelist rule matches, the score is set to `0/100` (`LOOKS SAFE`).

2. **Weighted Threat Signals**:
   - **Malware APK Downloads (+55)**: Direct links inviting users to download `.apk` files outside app stores.
   - **Digital Arrest Extortion (+55)**: Impersonating CBI, police, customs, or court judges over video calls/WhatsApp.
   - **Electricity Bill Disconnection Extortion (+50)**: Threatening power cuts tonight with personal 10-digit phone numbers.
   - **Bank KYC Suspension Traps (+45)**: Threatening account suspension unless an unverified SMS link is opened.
   - **Task & Daily Earning Scams (+45)**: YouTube video liking / Telegram recruitment traps.
   - **WhatsApp/KBC Lottery Scams (+45)**: Fake lucky draws demanding processing fees.
   - **India Post Parcel Redelivery Traps (+40)**: Small fees (₹25) used as credit/debit card credential harvesters.
   - **Suspicious Domain TLDs (+35)**: `.top`, `.xyz`, `.icu`, `.buzz`, `.club` often abused by scam syndicates.
   - **Obfuscated Link Shorteners (+20)**: `bit.ly`, `tinyurl`, `is.gd` hiding destination IPs.
   - **Synthetic Urgency Triggers (+25)**: "immediately", "within 24 hours", "blocked today".

3. **Link Defanging**:
   - Suspicious links inside messages are automatically neutralized (`http://` $\rightarrow$ `hxxp://`) and rendered inside `<span class="flagged-link">`. They are **never** clickable and **never** fetched.

---

## 🧰 Skills and Agents Used

1. **UI/UX Pro Max Principles** *(applied directly by hand)*:
   - Generated the comprehensive design system in [design-system/MASTER.md](file:///c:/Users/mkgsa/promptwar/design-system/MASTER.md).
   - Enforced calm palette, high-contrast text ($\ge 7:1$), concentric borders, $\ge 48\text{px}$ touch targets, and offline typography.
2. **ECC Planner/Architect**:
   - Created the detailed architecture and execution roadmap in [PLAN.md](file:///c:/Users/mkgsa/promptwar/PLAN.md).
3. **ECC TDD Guide**:
   - Built ground-truth test suite [test-messages.json](file:///c:/Users/mkgsa/promptwar/test-messages.json) and runner [run-tests.node.js](file:///c:/Users/mkgsa/promptwar/run-tests.node.js) before implementing the engine, iterating until green.
4. **ECC Security Reviewer**:
   - Verified strict Content-Security-Policy (CSP).
   - Verified zero HTML injection (strict entity escaping + textContent).
   - Verified links are non-clickable plain text.
   - Verified zero data egress (100% on-device).

---

## ⏱️ 2-Minute Demo Script for Judges

- **0:00 - 0:25 (The Problem & Vision)**:
  > *"Judges, 80% of digital fraud starts with a text message. Senior citizens and first-time smartphone users are flooded with fake electricity cutoff threats, SBI KYC blockages, and parcel delivery traps. We built **BaitCheck** with one core rule: 'Don't take the bait.' It requires zero training and runs 100% offline."*

- **0:25 - 0:50 (Live 5-Second Scan)**:
  > *"Watch this: I tap the preset 'SBI KYC Blocked'. In less than 1 second, with zero internet needed, BaitCheck delivers a clear, unmissable verdict: **'LIKELY SCAM – DON'T BITE' (Red ✗)**. It gives a plain-English explanation: 'Banks never ask for KYC over SMS links', highlights the fake domain, and gives 3 immediate action steps: 'Do not click', 'Do not call back', 'Block sender'."*

- **0:50 - 1:15 (Voice, Family Sharing & Multilingual)**:
  > *"If the user has low literacy or poor eyesight, they can tap **'Read aloud'** to hear the verdict spoken in their language. They can tap **'A+'** for extra-large text. If they switch to **हिन्दी** or **অসমীয়া**, every string, explanation, and action step updates instantly. Tapping **'Warn my family'** pre-formats a warning card ready to paste in WhatsApp."*

- **1:15 - 1:45 (TDD Benchmark & Safety Whitelist)**:
  > *"A scam detector that produces false alarms on real bank messages is useless. We ran BaitCheck against 25 ground-truth test cases across English, Hindi, Hinglish, and Assamese. It achieved **100% accuracy with zero false alarms** on genuine bank OTPs and courier notices."*

- **1:45 - 2:00 (Offline Tech & Golden Hour SOS)**:
  > *"Everything is packaged as an offline PWA under 1 MB. If a user already fell victim, the **'Help'** tab gives immediate golden-hour instructions and one-tap dialing to India's National Cyber Crime helpline: **1930**."*
