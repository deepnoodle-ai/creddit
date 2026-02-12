# Color Systems — Implementation Reference

The 2026 philosophy: commit to one dominant color and build the system around it. Multi-accent palettes feel indecisive. Single-hue systems feel intentional.

## Strategy 1: Single-Hue System

Pick one saturated brand color. Derive everything else:

```css
:root {
  /* Base hue — orange example (the 2026 frontrunner) */
  --hue: 24;

  /* Dark mode default */
  --accent: hsl(var(--hue), 90%, 55%);
  --accent-hover: hsl(var(--hue), 90%, 65%);
  --accent-muted: hsl(var(--hue), 40%, 25%);
  --accent-subtle: hsl(var(--hue), 30%, 12%);

  --bg-primary: hsl(var(--hue), 5%, 5%);
  --bg-surface: hsl(var(--hue), 5%, 8%);
  --bg-elevated: hsl(var(--hue), 5%, 12%);

  --text-primary: hsl(var(--hue), 5%, 95%);
  --text-secondary: hsl(var(--hue), 5%, 55%);

  --border: hsl(var(--hue), 5%, 15%);
  --border-accent: hsla(var(--hue), 90%, 55%, 0.3);
}
```

To switch brand color, change ONE value (`--hue`). Everything cascades.

### Popular Hues for 2026
- **Orange** (24°) — warm, energetic, stands out from blue-tech sea
- **Coral/Red-Orange** (12°) — bolder, lifestyle brands
- **Electric Blue** (220°) — still strong for dev/enterprise tools
- **Violet** (270°) — creative tools, but avoid the cliché gradient
- **Mint Green** (160°) — fresh, health/eco-focused
- **Hot Pink** (330°) — Gen Z, beauty, entertainment

## Strategy 2: Neon on Dark

High-saturation accent colors on near-black backgrounds. The cyberpunk-meets-SaaS look.

```css
:root {
  --bg-primary: #07070a;
  --bg-surface: #0f0f14;
  --text-primary: #e8e8ec;

  --neon-green: #39ff14;
  --neon-pink: #ff2b7a;
  --neon-blue: #00d4ff;
  --neon-purple: #b44aff;
}

/* Glow effects for neon */
.neon-glow {
  text-shadow: 0 0 7px currentColor, 0 0 20px currentColor;
}

.neon-border {
  border: 1px solid var(--neon-green);
  box-shadow:
    0 0 8px rgba(57, 255, 20, 0.3),
    inset 0 0 8px rgba(57, 255, 20, 0.05);
}

/* Neon button */
.btn-neon {
  background: transparent;
  color: var(--neon-green);
  border: 1px solid var(--neon-green);
  padding: 0.75rem 2rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}
.btn-neon:hover {
  background: rgba(57, 255, 20, 0.1);
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.4);
}
```

## Strategy 3: Dopamine Palette

Multiple saturated colors that create energy. Use for lifestyle, creative, and youth-facing brands.

```css
:root {
  --dopamine-1: #ff4d6a; /* hot coral */
  --dopamine-2: #7c3aed; /* electric violet */
  --dopamine-3: #06d6a0; /* mint green */
  --dopamine-4: #fbbf24; /* golden yellow */
}
```

**Rule**: Max 4 dopamine colors. One dominant, one secondary, two accents. Don't give them equal weight.

### Gradient Mesh for Dopamine
```css
.dopamine-bg {
  background:
    radial-gradient(ellipse at 10% 20%, rgba(255, 77, 106, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 80%, rgba(124, 58, 237, 0.35) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(6, 214, 160, 0.2) 0%, transparent 50%),
    #0a0a0f;
}
```

## Strategy 4: Muted Editorial

Desaturated, warm, literary. Typography does the heavy lifting.

```css
:root {
  --bg-primary: #f5f0eb;
  --bg-surface: #faf7f3;
  --text-primary: #1a1815;
  --text-secondary: #6b6560;
  --accent: #c45d3e; /* muted terracotta */
  --border: #e0d8d0;
}
```

## Accessible Contrast Pairings

Always verify. Here are pre-checked combos:

| Background | Text | Ratio | Pass |
|-----------|------|-------|------|
| #0a0a0b | #f0f0f2 | 18.9:1 | AAA |
| #0a0a0b | #8a8a8e | 5.6:1 | AA |
| #0a0a0b | #ff6b2b | 5.3:1 | AA |
| #0a0a0b | #39ff14 | 12.1:1 | AAA |
| #fafaf9 | #1a1a1b | 17.8:1 | AAA |
| #fafaf9 | #6b6b70 | 5.0:1 | AA |
| #fafaf9 | #e85d1a | 3.4:1 | AA Large |

## Generating a Palette Programmatically (JS)

```js
function generatePalette(hue) {
  return {
    accent: `hsl(${hue}, 90%, 55%)`,
    accentHover: `hsl(${hue}, 90%, 65%)`,
    accentMuted: `hsl(${hue}, 40%, 25%)`,
    bgPrimary: `hsl(${hue}, 5%, 5%)`,
    bgSurface: `hsl(${hue}, 5%, 8%)`,
    bgElevated: `hsl(${hue}, 5%, 12%)`,
    textPrimary: `hsl(${hue}, 5%, 95%)`,
    textSecondary: `hsl(${hue}, 5%, 55%)`,
    border: `hsl(${hue}, 5%, 15%)`,
  };
}
```

## Common Mistakes

- Using 5+ accent colors at equal weight = visual noise
- Picking a muted accent for CTAs = invisible buttons
- Not testing contrast on actual backgrounds = WCAG failure
- Same color system in dark and light mode = broken contrast (adjust lightness per mode)
- Neon colors on white backgrounds = eye-searing, unreadable
