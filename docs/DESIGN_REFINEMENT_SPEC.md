# Wedding Invitation — Design Refinement Spec (10/10 Polish)

**Context:** Digital wedding invitation with editorial, romantic, botanical aesthetic. This spec brings all UI and layout details up to the level of the hero typography, color palette, and cultural motifs.

---

## Design Principles

- **Every UI element should feel like part of the invitation**, not a separate interface
- **Vocabulary:** soft gradients, light borders, botanical accents, restrained motion
- **Avoid:** heavy shadows, strong contrast, generic UI patterns
- **Maintain:** generous whitespace, clear hierarchy

---

## 1. Font Switcher

### Current State
- Shown only in dev (`import.meta.env.DEV`) — ✅ already correct
- Dark pill (`rgba(18,15,12,0.88)`), gold border, `boxShadow: 0 4px 24px rgba(0,0,0,0.6)`
- Reads as a dev tool: "Font" label, uppercase DM Sans

### Refinement (when visible)

**Visibility logic (keep):**
- Production: hidden
- Development: visible
- Optional: add `?customize=1` query param to show in production for preview/testing

**Visual treatment when visible:**
- **Background:** `rgba(253,250,245,0.92)` with `backdropFilter: blur(16px)` — cream, not dark
- **Border:** `1px solid rgba(184,146,74,0.25)` — light gold, no heavy contrast
- **Shadow:** `0 2px 12px rgba(42,31,26,0.06)` — soft, editorial
- **Label:** "Choose your style" (invitation tone) instead of "Font"
- **Font previews:** Show each option with a short sample word (e.g. "Love" or couple initials) in that font
- **Active state:** Light gold wash `rgba(184,146,74,0.12)`, not solid gold
- **Position:** Bottom-left, but with more breathing room; consider a small botanical flourish (e.g. a tiny vine or leaf) as visual anchor

**Implementation notes:**
- Add `chooseYourStyle` to i18n (en: "Choose your style", tr: "Stilinizi seçin", uz: "Uslubingizni tanlang")
- Replace "Font" with translated string
- Swap dark pill styles for cream/light treatment
- Optionally add `window.location.search.includes('customize=1')` to show in production

---

## 2. Dot Navigation

### Current State
- Plain circles (6px inactive, 9px active)
- Colors: `G.rose` active, `G.espressoDim` inactive
- 44×44px hit area — ✅ good for touch

### Refinement — Botanical Theme

**Concept:** Small leaves, petals, or vine nodes instead of circles.

**Option A — Leaf silhouettes**
- Inactive: small elongated ellipse (leaf shape) in `G.espressoFaint` or `G.sage` at 40% opacity
- Active: same shape, filled with `G.rose` or `G.sage` (alternate by slide), slightly larger, subtle scale animation
- SVG path: `M 0,4 Q 4,0 8,4 Q 4,8 0,4` (simple leaf)

**Option B — Petal nodes**
- Inactive: small ellipse (petal) `rx:3 ry:5` in `G.rose` at 35% opacity
- Active: fuller petal, `G.rose` or `G.sage` at 70%, gentle rotation on active

**Option C — Vine nodes**
- Small circles with a thin connecting line (vine) between them
- Node: 6px circle, inactive = `G.sage` 40%, active = `G.rose` or `G.gold` 80%
- Optional: subtle vine path connecting nodes (dashed, very light)

**Motion:**
- `whileHover`: scale 1.1–1.15, opacity increase
- `whileTap`: scale 0.95
- Active transition: 0.3s ease-out
- Optional: active node has a soft "bloom" — radial gradient or subtle glow

**Palette rotation:**
- Slides 1–2: rose accent
- Slides 3–4: rose (Ankara) / sage (Tashkent) — can match event accent
- Slides 5–6: gold or rose

**Implementation notes:**
- Create `BotanicalDotNav` component with SVG leaf/petal icons
- Keep 44×44px min touch target; icon can be 12–16px
- Use `current` to pick accent color from `EVENTS` or a simple mapping

---

## 3. Countdown Card (HomePage event slides)

### Current State
- `borderRadius: 18px`, `border: 1px solid G.goldDim`
- `background: rgba(253,250,245,0.7)`, `backdropFilter: blur(16px)`
- Colons between digits
- Feels like an "app card"

### Refinement — Editorial Treatment

**Soften the card:**
- **Border:** `1px solid rgba(184,146,74,0.18)` — lighter
- **Background:** `rgba(253,250,245,0.5)` — more transparent, less boxy
- **Border radius:** `12px` or `999px` (pill) for a softer shape
- **Shadow:** remove or use `0 1px 3px rgba(42,31,26,0.04)`

**Editorial layout options:**

**Option A — Inline with subtle dividers**
- Remove card container; use inline flow
- Numbers: `1.2rem` serif, with thin vertical dividers (`|`) in `G.goldDim` at 30% opacity
- Labels below each digit, same as now

**Option B — Light ornamental frame**
- Thin decorative border (e.g. corner flourishes or a single gold line)
- No heavy box; numbers float inside a light frame
- Optional: small botanical corner (leaf or vine) at top-left

**Option C — Minimal card**
- Keep card structure but soften: no border, only subtle background gradient
- `background: linear-gradient(135deg, rgba(253,250,245,0.6) 0%, rgba(245,239,228,0.4) 100%)`
- Colons: replace with `·` (bullet) or thin decorative separator

**Implementation notes:**
- Reduce `border` opacity and `borderRadius`
- Consider removing `backdropFilter` for a lighter feel
- Keep `CountdownDigit` typography and spacing

---

## 4. Hierarchy on Event Slides (HomePage)

### Current State
- Chapter: `CHAPTER I · TÜRKİYE` — small caps, accent color
- City: large serif (e.g. `clamp(3rem, 11vw, 11rem)`)
- Date: `0.72rem` sans, `G.espressoDim`
- Venue: `1rem` serif, `G.espressoDim` — competes with chapter

### Refinement — Strengthen Venue, Clarify Secondary Block

**Venue (Sheraton Grand Ankara, Yulduzli Saroy):**
- **Size:** `clamp(1.1rem, 2.5vw, 1.35rem)` — larger than date
- **Weight:** 500 or 600 (semi-bold) so it reads as the main "where"
- **Color:** `G.espresso` (full, not dim) — same as city for importance
- **Font:** serif (display font) — already correct

**Chapter line (CHAPTER I · TÜRKİYE):**
- **Size:** `0.65rem` — slightly smaller
- **Letter-spacing:** `0.3em` — keep tight-tracked uppercase
- **Color:** keep accent (rose/sage) but at 85% opacity so it doesn’t overpower

**Date & Venue block:**
- Treat as one secondary block
- Date: `0.7rem`, `G.espressoDim` — tertiary
- Venue: primary within this block
- Add subtle separator (e.g. `·` or thin line) between date and venue if needed

**Layout:**
```
[Arch]
CHAPTER I · TÜRKİYE        ← smaller, accent
Ankara                     ← hero city (unchanged)
────────────
19 May 2026                 ← date, tertiary
Sheraton Grand Ankara      ← venue, prominent
[Countdown]
[View Invitation]
```

**Implementation notes:**
- Increase venue `fontSize` and `fontWeight`
- Reduce chapter `fontSize` to `0.65rem`
- Ensure date stays `G.espressoDim`; venue uses `G.espresso`

---

## 5. Scroll CTA

### Current State
- Text: `scrollDown` → "Scroll to RSVP" (generic)
- Scroll indicator: pill with dot, `G.rose`
- Used on hero (Slide 1) and InvitePage / EventPage

### Refinement — On-Brand Copy

**Replace with poetic, narrative alternatives:**

| Key | EN | TR | UZ |
|-----|----|----|-----|
| `scrollDown` | "Discover our story" | "Hikayemizi keşfedin" | "Hikoyamizni kashf eting" |
| Alt 1 | "Enter the garden" | "Bahçeye girin" | "Bog'ga kiring" |
| Alt 2 | "Turn the page" | "Sayfayı çevirin" | "Sahifani aylantiring" |

**Recommendation:** Use `scrollCta` as new key; keep `scrollDown` for fallback or rename.

**Scroll indicator:**
- Keep the pill + dot animation
- Soften border: `rgba(42,31,26,0.12)` instead of `G.espressoFaint`
- Dot: `G.rose` or `G.gold` — keep
- Optional: add a tiny leaf or vine accent near the indicator

**Implementation notes:**
- Add `scrollCta` to i18n (all three languages)
- Update HomePage, InvitePage, EventPage to use `scrollCta`
- Keep `aria-label` for accessibility (e.g. "Scroll to continue")

---

## 6. VIEW INVITATION Button

### Current State
- `border: 1px solid ${ev.accent}55` (rose/sage at 33% opacity)
- `background: rgba(253,250,245,0.5)`
- `padding: 0.7rem 1.6rem`, `borderRadius: 999px`
- Hover: `scale(1.04)`, `y: -2`

### Refinement — Editorial, Invitation CTA

**Lighter outline:**
- `border: 1px solid rgba(196,132,140,0.35)` for rose / `rgba(107,143,113,0.35)` for sage
- Softer, less "buttony"

**Hover state:**
- `scale: 1.02` (subtle)
- `y: -1` (lighter lift)
- Background: `rgba(253,250,245,0.8)` — slight fill
- Optional: border opacity increase to 0.5

**Botanical accent:**
- Small leaf or petal icon (8–10px) before or after the arrow
- Or: thin vine underline on hover

**Typography:**
- Keep: DM Sans, 0.75rem, letter-spacing 0.15em, uppercase
- Ensure it reads as "invitation" not "web button"

**Implementation notes:**
- Reduce hover scale and y
- Lighten border opacity
- Optional: add small SVG botanical icon from existing assets (VineCorner, etc.)

---

## 7. CountdownTimer (EventPage / InvitePage)

The `CountdownTimer` component uses flip-card style units. For consistency with the HomePage countdown refinement:

- **Soften the flip cards:** lighter border, less boxy
- **Border:** `1px solid rgba(184,146,74,0.2)`
- **Shadow:** reduce to `0 2px 8px rgba(42,31,26,0.04)`
- Align with the editorial treatment of the HomePage countdown card

---

## File Reference

| Element | Location |
|---------|----------|
| Font Switcher | `client/src/components/ui/FontSwitcher.tsx` |
| Dot Nav (HomePage) | `client/src/garden/pages/HomePage.tsx` — `DotNav` |
| Dot Nav (EventPage) | `client/src/pages/EventPage.tsx` — `EventDotNav` |
| Countdown (HomePage) | `client/src/garden/pages/HomePage.tsx` — `CountdownDigit` + wrapper |
| Event slide hierarchy | `client/src/garden/pages/HomePage.tsx` — EVENTS map, Date & Venue block |
| Scroll CTA | `client/src/garden/pages/HomePage.tsx`, `InvitePage.tsx`, `EventPage.tsx` |
| View Invitation button | `client/src/garden/pages/HomePage.tsx` — Link in event slides |
| i18n | `client/src/lib/i18n/en.ts`, `tr.ts`, `uz.ts` |
| CountdownTimer | `client/src/components/CountdownTimer.tsx` |

---

## Palette Quick Reference

```css
--parchment:  #FDFAF5
--cream:      #F5EFE4
--espresso:   #2A1F1A
--gold:       #B8924A
--rose:       #C4848C
--sage:       #6B8F71
```

Use `rgba()` with low opacity (0.15–0.35) for borders and washes.
