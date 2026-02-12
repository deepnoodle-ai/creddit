---
name: web-design-2026
description: Design and build consumer-facing websites using 2025-2026 web design trends. Use when the user asks to create a website, landing page, SaaS marketing site, product page, or consumer-facing web UI and wants it to look modern and current. Extends the frontend-design skill with specific trend knowledge, CSS patterns, and implementation guidance.
---

# Web Design 2025-2026 Trends Skill

Build consumer-facing websites that look and feel like they were designed in 2026, not 2023. This skill encodes the dominant visual, interaction, and structural trends shaping modern web design and provides concrete implementation patterns.

**This skill is a companion to `frontend-design`.** Read `frontend-design/SKILL.md` first for general design thinking and aesthetics principles. This skill adds trend-specific direction and code patterns on top of that foundation.

## When to Use This Skill

- User asks for a "modern" website, landing page, or consumer-facing product UI
- User references any 2025-2026 trend by name (glassmorphism, bento grid, etc.)
- User wants a site that feels current, fresh, or cutting-edge
- User is building for e-commerce, SaaS, fintech, lifestyle, or brand sites
- User says "make it look like a real startup site" or similar

## Design Decision Framework

Before writing code, make three choices:

### 1. Pick a Trend Cluster (1-2 primary, 1 accent)

Trends group into compatible clusters. Don't mix everything — pick a lane:

| Cluster | Primary Trends | Best For |
|---------|---------------|----------|
| **Polished Future** | Glassmorphism + kinetic type + dark mode | SaaS, fintech, dev tools |
| **Expressive Energy** | Dopamine colors + maximalism + motion narrative | Lifestyle, beauty, Gen Z brands |
| **Technical Precision** | Blueprint annotations + monospace + barely-there UI | Dev tools, API products, technical SaaS |
| **Human Warmth** | Hand-drawn textures + creative process + organic shapes | Indie brands, portfolios, creative agencies |
| **Retro Digital** | Retrofuturism + neon accents + pixel art + Y2K nostalgia | Entertainment, gaming, music, youth culture |
| **Editorial Calm** | Archival index + content-first + oversized serif type | Media, publishing, luxury, long-form content |

### 2. Pick a Color Strategy

The 2026 palette philosophy: **one dominant color, commit hard.**

- **Single-hue system**: Pick one saturated color, build the entire palette from it (tints, shades, desaturated variants). Orange is the current frontrunner but any bold choice works.
- **Neon-on-dark**: High-saturation accents (#39FF14, #FF69B4, #00D4FF) on near-black backgrounds. Glows via `box-shadow` with color spread.
- **Dopamine palette**: 3-4 clashing brights that shouldn't work but do. Jewel tones, unexpected combos. Test with WCAG contrast.
- **Muted editorial**: Desaturated earth tones, cream backgrounds, dark text. Let typography carry the visual weight.

### 3. Pick a Layout Pattern

- **Bento grid**: Modular cards of varying sizes, rounded corners (16-24px), slight gaps. Cards can tilt or overlap.
- **Scroll narrative**: Full-viewport sections revealed sequentially. Pin elements, animate on scroll progress.
- **Asymmetric editorial**: Off-center content, overlapping elements, diagonal flow, generous whitespace.
- **Content-first minimal**: Nearly invisible UI chrome. Navigation as floating pills. Content is the design.

---

## Implementation Patterns

Detailed CSS/JS patterns for each major trend are in the references directory. **Read the relevant reference before coding:**

```
references/glassmorphism.md      — Frosted glass panels, layered depth, blur effects
references/kinetic-typography.md — Animated headlines, variable fonts, scroll-triggered type
references/bento-grids.md        — Modular card layouts, responsive bento patterns
references/scroll-narrative.md   — Scroll-driven animations, pinned sections, CSS scroll-timeline
references/color-systems.md      — Single-hue systems, neon-on-dark, dopamine palettes
references/dark-mode-first.md    — Dark-first design, OLED palettes, auto-switching
references/blueprint-style.md    — Technical annotation aesthetic, monospace, diagrams
references/motion-design.md      — Micro-animations, hover states, entrance choreography
references/accessibility.md      — Inclusive design patterns, ARIA, contrast, reduced-motion
references/3d-ar-immersive.md    — WebGL, Three.js, AR previews, interactive 3D
references/neumorphism.md        — Soft UI, inset/outset shadows, tactile elements
references/human-warmth.md       — Hand-drawn textures, organic shapes, creative process aesthetic
```

---

## Critical Rules

### Always Do
- **Design dark mode first** — it's the majority preference (91%+). Light mode is the variant.
- **Ship `prefers-reduced-motion`** from the start — wrap all animations in the media query.
- **Ship `prefers-color-scheme`** from the start — auto-switch dark/light.
- **Use CSS custom properties** for the entire color system — makes theme switching trivial.
- **Use a variable font** — one font file, infinite expressiveness. Weight, width, and optical size axes.
- **Test contrast ratios** — 4.5:1 minimum for body text, 3:1 for large text. Non-negotiable.
- **Lazy-load heavy assets** — 3D models, large images, video. First paint must be fast.
- **Use semantic HTML** — `<nav>`, `<main>`, `<article>`, `<section>`. Screen readers depend on it.
- **Touch targets ≥ 48px** — mobile-first means finger-first.

### Never Do
- **Never use Inter, Roboto, Arial, or system-ui as the display font.** These scream "default." Pick something with character. Google Fonts has hundreds of distinctive options.
- **Never use a purple-gradient-on-white hero.** This is the #1 "AI-generated site" tell.
- **Never animate everything.** One hero animation + subtle hover states > chaos.
- **Never ignore mobile.** Design mobile-first, expand to desktop. Not the reverse.
- **Never skip the `alt` attribute** on images or `aria-label` on interactive elements.
- **Never use `localStorage`/`sessionStorage` in artifacts** — not supported in Claude.ai rendering.

---

## Trend-Specific Quick Reference

### Glassmorphism (CSS)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Kinetic Typography (CSS)
```css
@property --font-weight {
  syntax: '<number>';
  inherits: false;
  initial-value: 400;
}
.kinetic-heading {
  font-variation-settings: 'wght' var(--font-weight);
  transition: --font-weight 0.4s ease;
}
.kinetic-heading:hover {
  --font-weight: 900;
}
```

### Bento Grid (CSS)
```css
.bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(180px, auto);
  gap: 16px;
}
.bento-card {
  border-radius: 20px;
  padding: 2rem;
  overflow: hidden;
}
.bento-card.wide { grid-column: span 2; }
.bento-card.tall { grid-row: span 2; }
.bento-card.featured { grid-column: span 2; grid-row: span 2; }
```

### Scroll-Driven Animation (CSS — progressive enhancement)
```css
@supports (animation-timeline: scroll()) {
  .reveal-on-scroll {
    animation: fadeSlideUp linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 100%;
  }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Neon Glow (CSS)
```css
.neon-accent {
  color: #39FF14;
  text-shadow:
    0 0 7px #39FF14,
    0 0 10px #39FF14,
    0 0 21px #39FF14,
    0 0 42px #0fa,
    0 0 82px #0fa;
}
.neon-button {
  border: 1px solid #39FF14;
  box-shadow: 0 0 12px rgba(57, 255, 20, 0.4),
              inset 0 0 12px rgba(57, 255, 20, 0.1);
}
```

### Dark Mode First (CSS)
```css
:root {
  /* Dark is default */
  --bg-primary: #0a0a0b;
  --bg-surface: #141416;
  --bg-elevated: #1c1c1f;
  --text-primary: #f0f0f2;
  --text-secondary: #8a8a8e;
  --accent: #ff6b2b;
}
@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: #fafaf9;
    --bg-surface: #ffffff;
    --bg-elevated: #f0f0ee;
    --text-primary: #1a1a1b;
    --text-secondary: #6b6b70;
    --accent: #e85d1a;
  }
}
```

### Blueprint / Annotation Style (CSS)
```css
.blueprint-container {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  background: #0d1117;
  color: #c9d1d9;
}
.annotation-line {
  border-left: 1px solid rgba(201, 209, 217, 0.2);
  padding-left: 1rem;
  position: relative;
}
.annotation-line::before {
  content: attr(data-label);
  position: absolute;
  left: -120px;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #58a6ff;
  opacity: 0.7;
}
```

### Reduced Motion Safety Net (CSS)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Font Recommendations by Cluster

| Cluster | Display Font | Body Font |
|---------|-------------|-----------|
| Polished Future | Sora, Outfit, Plus Jakarta Sans | DM Sans, Geist |
| Expressive Energy | Clash Display, Cabinet Grotesk, Unbounded | Satoshi, General Sans |
| Technical Precision | JetBrains Mono, Space Mono, IBM Plex Mono | IBM Plex Sans, Geist |
| Human Warmth | Fraunces, Playfair Display, Lora | Source Serif 4, Literata |
| Retro Digital | Press Start 2P, Silkscreen, VT323 | Share Tech Mono, Overpass Mono |
| Editorial Calm | Instrument Serif, Cormorant, Newsreader | Inter (body only is fine), Source Sans 3 |

Import from Google Fonts or use `@font-face` with WOFF2 files. Always include `font-display: swap`.

---

## Putting It Together

When the user asks for a site, follow this sequence:

1. **Read `frontend-design/SKILL.md`** for general design principles
2. **Read this skill** for trend-specific guidance
3. **Read the relevant reference files** for the chosen trend cluster
4. **Choose cluster → color strategy → layout pattern**
5. **Build mobile-first**, dark-mode-first
6. **Add motion last** — get the static layout right first, then choreograph
7. **Test**: contrast ratios, reduced-motion, touch targets, semantic HTML

The goal is a site that looks like a human designer with taste built it in 2026 — not like an AI generated a template.
