# Glassmorphism — Implementation Reference

Glassmorphism creates depth through translucent, frosted-glass surfaces layered over colorful or gradient backgrounds. It feels sleek, futuristic, and calm — the visual signature of "polished future" design in 2026.

## Core Mechanics

The effect relies on three CSS properties working together:

```css
.glass {
  /* 1. Semi-transparent background */
  background: rgba(255, 255, 255, 0.05);

  /* 2. Blur what's behind the element */
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);

  /* 3. Subtle border to define edges */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
}
```

**The background behind the glass matters.** Glassmorphism only works when there's something visible to blur — gradients, images, colored shapes, or other content. On a solid flat background it just looks like a faint card.

## Layered Depth System

Stack multiple glass layers at different opacities for depth hierarchy:

```css
/* Background layer — most transparent */
.glass-bg {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(40px);
}

/* Card layer — primary content surface */
.glass-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* Elevated layer — modals, tooltips, popovers */
.glass-elevated {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
}
```

## Background Patterns That Work Well Behind Glass

```css
/* Gradient mesh */
.glass-backdrop {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(120, 80, 255, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(255, 100, 50, 0.25) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(50, 200, 255, 0.2) 0%, transparent 50%),
    var(--bg-primary);
}

/* Floating orbs (animated) */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;
}
.orb-1 { width: 400px; height: 400px; background: #7c3aed; top: 10%; left: 20%; }
.orb-2 { width: 300px; height: 300px; background: #f97316; bottom: 20%; right: 15%; animation-delay: -7s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
}
```

## Light Mode Adaptation

In light mode, invert the opacity logic:

```css
@media (prefers-color-scheme: light) {
  .glass-card {
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
}
```

## Performance Notes

- `backdrop-filter` is GPU-accelerated but can be expensive with many overlapping layers
- Limit to 3-4 glass surfaces visible simultaneously
- On mobile, consider reducing blur radius (12px instead of 20px)
- Test on older devices — `backdrop-filter` can cause jank on budget Android phones
- Provide a solid-background fallback:

```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-card {
    background: rgba(20, 20, 22, 0.95);
  }
}
```

## Common Mistakes

- Glass on flat solid background = looks like nothing is happening
- Too much transparency = text becomes unreadable
- Missing `-webkit-` prefix = broken on Safari/iOS
- Too many glass layers overlapping = visual mud and performance hit
- Forgetting border = cards blend into each other with no definition
