# Motion Design — Implementation Reference

Motion in 2026 is purposeful, not decorative. One well-choreographed entrance > 50 random hover effects. The goal: make the interface feel alive and responsive without being distracting.

## The Motion Hierarchy

1. **Page entrance choreography** (highest impact, do this first)
2. **Scroll reveals** (content appears as user discovers it)
3. **Hover/focus feedback** (interactive elements respond)
4. **Micro-interactions** (button clicks, toggles, state changes)
5. **Ambient motion** (floating elements, subtle background movement — lowest priority)

## Entrance Choreography

The hero section should unfold like a curtain:

```css
.hero > * {
  opacity: 0;
  transform: translateY(24px);
  animation: entrance 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.hero > *:nth-child(1) { animation-delay: 0.05s; }  /* nav or logo */
.hero > *:nth-child(2) { animation-delay: 0.15s; }  /* headline */
.hero > *:nth-child(3) { animation-delay: 0.3s; }   /* subtext */
.hero > *:nth-child(4) { animation-delay: 0.45s; }  /* CTA */

@keyframes entrance {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### The "Reveal Up" Pattern
Elements slide up from behind a clipping mask:

```css
.reveal-wrapper {
  overflow: hidden;
}

.reveal-content {
  transform: translateY(100%);
  animation: revealUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes revealUp {
  to { transform: translateY(0); }
}
```

## Hover States

### Scale + Shadow (universal)
```css
.card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### Background Slide
```css
.btn {
  position: relative;
  overflow: hidden;
  z-index: 1;
}
.btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent);
  transform: translateX(-101%);
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  z-index: -1;
}
.btn:hover::before {
  transform: translateX(0);
}
```

### Magnetic Button (JS)
Buttons that subtly follow the cursor:

```js
function magneticButton(el, strength = 0.3) {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });

  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform 0.4s ease';
    el.style.transform = 'translate(0, 0)';
    setTimeout(() => el.style.transition = '', 400);
  });
}
```

## Micro-Interactions

### Toggle Switch
```css
.toggle-track {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: var(--bg-elevated);
  transition: background 0.2s ease;
  cursor: pointer;
}
.toggle-track.active {
  background: var(--accent);
}
.toggle-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  transform: translateX(3px);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toggle-track.active .toggle-thumb {
  transform: translateX(23px);
}
```

### Button Click Ripple
```css
.btn-ripple {
  position: relative;
  overflow: hidden;
}
.btn-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--x) var(--y), rgba(255,255,255,0.3) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.4s;
}
.btn-ripple:active::after {
  opacity: 1;
  transition: opacity 0s;
}
```

## Easing Functions

```css
/* The 2026 defaults */
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);      /* Smooth deceleration — most animations */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Overshoot bounce — toggles, modals */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);    /* Symmetrical — looping, ambient */
```

Do NOT use `ease` or `linear` for UI animations. They feel robotic.

## Duration Guidelines

| Animation Type | Duration | Notes |
|---------------|----------|-------|
| Hover feedback | 150-250ms | Must feel instant |
| Button click | 100-200ms | Snappy |
| Card entrance | 400-700ms | Staggered |
| Page transition | 300-500ms | Smooth but quick |
| Modal open | 200-350ms | With slight scale |
| Scroll reveal | 500-800ms | Can be slower |
| Ambient float | 10-30s | Very slow, subtle |

## Reduced Motion

**Non-negotiable.** Every animation must have a fallback:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Or more granularly, show content instantly without motion:
```css
@media (prefers-reduced-motion: reduce) {
  [data-scroll-reveal] {
    opacity: 1;
    transform: none;
  }
}
```

## Common Mistakes

- Animating everything = nothing feels special, everything feels slow
- Duration too long (>1s for UI) = feels sluggish
- Linear easing = feels mechanical, not natural
- Animations that block interaction = user clicks but nothing happens yet
- No reduced-motion query = accessibility violation
- Animating layout properties (width, height, top, left) = jank on mobile
