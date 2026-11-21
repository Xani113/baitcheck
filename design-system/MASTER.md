# BaitCheck Design System: MASTER.md
*Project: BaitCheck ("Don't take the bait.")*  
*Visual Style: Calm Paper-and-Ink Off-White Consumer Safety Utility, Deep Indigo Accent, Flat Minimal, High Contrast*

---

## 1. Design Language & Visual Tone
- **Paper & Ink Reality**: Flat, tactile off-white surface resembling trusted security gazettes and official consumer advisories.
- **Zero Distraction / Zero Fluff**: Strictly **no** glassmorphism, no neon glows, no futuristic gradients, no dark-pattern countdown timers, and no generic stock illustrations.
- **Microcopy Standard**: Clear, honest, and unpretentious. We never say "100% verified" or "Guaranteed Safe". Instead, we state: *"No warning signs found in 14 checks"*.
- **Touch & Accessibility Floor**:
  - Touch targets: Minimum $44\text{px} \times 44\text{px}$ with $\ge 8\text{px}$ clearance.
  - Text-size toggle (`A-` / `A` / `A+`): Root scale at `14px`, `16px`, and `18px`, remembered in `localStorage`.
  - Color contrast: All body text exceeds $7:1$ AAA contrast on `#F6F3EA` and `#FFFFFF`.

---

## 2. Palette (Single Light Theme for Paper & Ink Trust)

| Token | Hex Value | Semantic Usage |
|:---|:---|:---|
| `--color-page` | `#F6F3EA` | Main parchment off-white page canvas |
| `--color-surface` | `#FFFFFF` | Clean white card and container surface |
| `--color-surface-subtle` | `#ECE8DD` | Inputs, table rows, inactive segmented tabs |
| `--color-border` | `#E3DED1` | 1px clean hairline structural dividers |
| `--color-border-hover` | `#C8C2B3` | Interactive borders on hover |
| `--color-ink` | `#1C1B19` | Deep charcoal ink for headings and primary copy ($15.2:1$) |
| `--color-muted` | `#67635A` | Secondary descriptions, timestamps, metadata ($7.4:1$) |
| `--color-indigo` | `#2B3A8C` | Primary button, active tab indicator, links, focus ring |
| `--color-indigo-tint` | `#E8EAF7` | Soft indigo badge and highlight tint |
| **Result: Neutral/OK** | `#1F7A4D` | "No warning signs found" badge (Bg: `#EAF5EE`, Border: `#B6E0C9`) |
| **Result: Warning** | `#9A5B00` | "Be careful" badge (Bg: `#FDF4E6`, Border: `#F4D39C`) |
| **Result: Danger** | `#B42318` | "Likely scam — don't bite" badge (Bg: `#FDF0ED`, Border: `#F6B8B0`) |

---

## 3. Typography Hierarchy (Compact, Highly Legible)

### Font Stack
- **Primary Latin**: `system-ui, -apple-system, "Segoe UI", Roboto, "DM Sans", sans-serif`
- **Devanagari (Hindi)**: `system-ui, "Noto Sans Devanagari", sans-serif`
- **Bengali & Assamese (সহ ৰ, ৱ)**: `system-ui, "Noto Sans Bengali", sans-serif`
- **Monospace (URLs & Evidence)**: `ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace`

### Typography Scale (at Root 16px)
- **Page Title**: `1.6rem` (`25.6px`), Weight `600`, `letter-spacing: -0.02em`
- **Section Headings**: `1.15rem` (`18.4px`), Weight `600`
- **Card Titles**: `0.95rem` (`15.2px`), Weight `600`
- **Body Text**: `0.875rem` (`14px`), Weight `400`, Line-height `1.55` (Indic: `1.7`)
- **Metadata & Evidence**: `0.75rem` (`12px`), Weight `500`, Line-height `1.4`

---

## 4. Signature Motion: "Line and Hook"
- **Speed Floor**: Total duration $\le 900\text{ms}$. Results must never be artificially delayed.
- **Draw Line**: Thin 2px indigo line draws across under the input box ($200\text{ms}$, `ease-out`).
- **Checklist Ticks**: "Checks performed" rows tick in with a clean checkmark ($50\text{ms}$ stagger).
- **Case Card Reveal**: Card rises $8\text{px}$ while fading in ($220\text{ms}$, `cubic-bezier(0.2, 0.7, 0.2, 1)`).
- **Reduced Motion**: Under `@media (prefers-reduced-motion: reduce)`, all transitions are $0\text{ms}$ and states render instantly.

---

## 5. Pre-Delivery Checklist
- [x] Contrast ratio $\ge 7:1$ for body and $\ge 4.5:1$ for interactive chips.
- [x] All interactive targets $\ge 44\text{px} \times 44\text{px}$ with visible 2px indigo focus ring.
- [x] Tested at 360px mobile width with zero overflow-x and zero clipping of Assamese characters (ৰ, ৱ).
- [x] Result verdicts combine **Color + Icon + Text** (never color alone).
