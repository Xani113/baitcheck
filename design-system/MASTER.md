# BaitCheck Design System: MASTER.md
*Project: BaitCheck ("Don't take the bait.")*  
*Target: Consumer Fraud-Protection Utility — Trustworthy, Calm, Accessibility-First, Elderly-Friendly Mobile PWA*

---

## 1. Core Design Philosophy
- **Calm & Reassuring**: Never use flashing alarms, high-anxiety sirens, dark neon, or shaming language. The user should feel protected, not panicked.
- **Clarity Over Cleverness**: Microcopy must be understandable by an elderly person, a first-time smartphone user, or someone with limited literacy.
- **Zero Training Required**: Single primary action per screen. Huge tap targets ($\ge 48\text{px}$), generous spacing ($\ge 8\text{px}$), high contrast ($\ge 7:1$ AAA for body text).
- **Offline-First & Sovereign**: 100% on-device analysis. No CDN assets, no external font loading, zero tracking.

---

## 2. Color Palette & Semantics

Green, Amber, and Red are strictly reserved for **Verdicts and Safety Status**. They are never used for general buttons or decorative cards.

| Token | Hex (Light Mode) | Hex (Dark Mode) | Purpose |
|:---|:---|:---|:---|
| `--color-bg` | `#F8FAFC` (Slate 50) | `#0B111E` (Deep Night) | Main surface background |
| `--color-surface` | `#FFFFFF` | `#131D31` | Cards, elevated containers |
| `--color-surface-subtle` | `#F1F5F9` | `#1A263E` | Input wells, inactive tabs |
| `--color-border` | `#CBD5E1` (4.5:1 on bg) | `#2A3B5C` | Structural boundaries, focus outlines |
| `--color-primary` | `#0E4F6E` (Deep Teal Blue) | `#38BDF8` (Bright Sky Teal) | Primary action buttons, brand accents |
| `--color-primary-text` | `#FFFFFF` | `#0B111E` | Text on primary buttons |
| `--color-text-main` | `#0F172A` (14.8:1 AAA) | `#F8FAFC` (15.2:1 AAA) | Headings, primary reading text |
| `--color-text-muted` | `#334155` (7.1:1 AAA) | `#94A3B8` (7.2:1 AAA) | Guidance notes, helper microcopy |
| **Verdict: Safe** | `#15803D` (Forest Green) | `#22C55E` | "LOOKS SAFE" verdict badge & border |
| **Verdict: Safe Bg** | `#F0FDF4` | `#0A2912` | Safe card background tint |
| **Verdict: Caution** | `#B45309` (Amber Brown) | `#FBBF24` | "BE CAREFUL" verdict badge & border |
| **Verdict: Caution Bg**| `#FFFBEB` | `#2D1E03` | Caution card background tint |
| **Verdict: Danger** | `#B91C1C` (Crimson) | `#F87171` | "LIKELY SCAM" verdict badge & border |
| **Verdict: Danger Bg** | `#FEF2F2` | `#320B0B` | Danger card background tint |

---

## 3. Typography & Multi-Script Scale

### Font Family
System and bundled sans-serif with native Devanagari (Hindi) and Bengali/Assamese script support (`system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Bengali', sans-serif`).
- Assamese specific characters (ৰ, ৱ) and conjuncts render without clipping or baseline shifts.
- Minimum line-height: `1.5` for English, `1.65` for Devanagari and Bengali/Assamese.

### Fluid Type Scale (Baseline at 360px viewport)
- **Huge Verdict**: `28px` (`1.75rem`), Bold, `letter-spacing: -0.02em`
- **Section Heading**: `20px` (`1.25rem`), Bold
- **Body / Input Text**: Minimum `18px` (`1.125rem`), Regular, `line-height: 1.6`
- **Helper / Microcopy**: `15px` (`0.9375rem`), Regular
- **Text-Size Controls (A- / A+)**:
  - Regular (`100%` root scale)
  - Large (`115%` root scale)
  - Extra Large (`130%` root scale for elderly eyesight)

---

## 4. Touch Targets & Accessibility Pre-Delivery Checklist

1. [x] **Touch Target Floor**: Every clickable item (buttons, tab pills, speech trigger, paste trigger) is $\ge 48\text{px} \times 48\text{px}$ with $\ge 8\text{px}$ gap.
2. [x] **Color Blindness Immunity**: Every verdict combines **Color + Large Icon + Bold Text Label** (Never color alone).
3. [x] **Focus Ring**: High-contrast 3px solid focus ring with 2px offset (`outline: 3px solid var(--color-primary); outline-offset: 2px`).
4. [x] **Motion Safety**: Wrapped in `@media (prefers-reduced-motion: reduce)` — instant state changes with no sliding or scaling transitions.
5. [x] **Screen Reader Architecture**:
   - `aria-live="polite"` container announces verdict changes automatically.
   - Meaningful `aria-label`s on icon-only or auxiliary buttons (e.g., "Speak message aloud").
6. [x] **Viewport Adaptation**: Clean single-column layout tested down to `360px` without horizontal scrolling.

---

## 5. Screen Layout & Component Patterns

### Single-Column Container
Max width `480px` centered on desktop; `100%` width with `16px` padding on mobile.

### Components
1. **Header Bar**:
   - Logo mark (Shield + Hook/Magnifier) + Title ("BaitCheck")
   - Language selector: `EN` | `हिन्दी` | `অসমীয়া`
   - Accessibility font-size toggles: `A-` / `A+`
2. **Input Station**:
   - Big, friendly text area (`min-height: 140px`) with clear placeholder.
   - Quick input buttons: `📋 Paste` | `🎙️ Speak` | `🖼️ Screenshot`
   - Primary action button: Huge, high-contrast, `56px` height: **"Check Message"**.
3. **Verdict Banner**:
   - 3-State Card:
     - 🟢 **LOOKS SAFE** (Icon: Check Shield, Copy: "No known scam tricks found.")
     - 🟡 **BE CAREFUL** (Icon: Warning Triangle, Copy: "Some suspicious patterns found. Proceed cautiously.")
     - 🔴 **LIKELY SCAM – DON'T BITE** (Icon: Hook Alert, Copy: "This looks like bait. Do not click or reply.")
   - Risk Meter: Simple horizontal meter with plain label (e.g. "Low Risk", "Medium Risk", "High Risk").
   - "Why we think so": 2–3 plain bullet points.
   - "What to do now": 2–3 clear step-by-step instructions.
   - Action toolbar: `🔊 Read aloud` | `👥 Warn family` | `🚨 Report it` | `🔄 Check another`.
4. **Bottom Navigation**:
   - 3 large tabs: `🛡️ Check` | `💡 Learn (Scam Cards)` | `🆘 Help & 1930`
