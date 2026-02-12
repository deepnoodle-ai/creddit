# Scroll-Driven Narrative — Implementation Reference

Scroll-driven storytelling turns the page into a cinematic experience where content unfolds as the user scrolls. In 2026, this has moved beyond basic parallax into structured narrative with pinned sections, progress-linked animations, and CSS-native scroll timelines.

## CSS Scroll-Driven Animations (Modern, Progressive Enhancement)

The CSS `animation-timeline` API is the future. Use it with a fallback:

```css
/* Feature-detect and enhance */
@supports (animation-timeline: scroll()) {
  .scroll-reveal {
    opacity: 0;
    transform: translateY(30px);
    animation: revealUp linear both;
    animation-timeline: view();
    animation-range: entry 10% entry 80%;
  }
}

@keyframes revealUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Scroll Progress on a Container

```css
@supports (animation-timeline: scroll()) {
  .progress-bar {
    transform-origin: left;
    transform: scaleX(0);
    animation: fillBar linear both;
    animation-timeline: scroll(nearest block);
  }
}

@keyframes fillBar {
  to { transform: scaleX(1); }
}
```

## IntersectionObserver Approach (Broad Support)

For wider browser support, use IntersectionObserver to trigger CSS classes:

```js
function initScrollReveal() {
  const elements = document.querySelectorAll('[data-scroll-reveal]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // animate once
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}
```

```css
[data-scroll-reveal] {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

[data-scroll-reveal].revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger children */
[data-scroll-reveal].revealed .stagger:nth-child(1) { transition-delay: 0.1s; }
[data-scroll-reveal].revealed .stagger:nth-child(2) { transition-delay: 0.2s; }
[data-scroll-reveal].revealed .stagger:nth-child(3) { transition-delay: 0.3s; }
```

## Pinned Scroll Sections (CSS `position: sticky`)

Pin a section while scrolling through its content panels:

```html
<section class="sticky-section">
  <div class="sticky-visual">
    <!-- Stays pinned -->
    <div class="visual-frame" id="frame-1">Visual 1</div>
    <div class="visual-frame" id="frame-2">Visual 2</div>
  </div>
  <div class="scroll-panels">
    <div class="panel" data-target="frame-1">
      <h2>First point</h2>
      <p>Description...</p>
    </div>
    <div class="panel" data-target="frame-2">
      <h2>Second point</h2>
      <p>Description...</p>
    </div>
  </div>
</section>
```

```css
.sticky-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
}

.sticky-visual {
  position: sticky;
  top: 20vh;
  height: 60vh;
  align-self: start;
}

.visual-frame {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.visual-frame.active {
  opacity: 1;
}

.scroll-panels {
  display: flex;
  flex-direction: column;
  gap: 50vh; /* Space between triggers */
  padding: 30vh 0;
}

@media (max-width: 768px) {
  .sticky-section {
    grid-template-columns: 1fr;
  }
  .sticky-visual {
    position: relative;
    top: auto;
    height: auto;
  }
}
```

## Full-Screen Section Snap

```css
.snap-container {
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
}

.snap-section {
  height: 100vh;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Caution**: Scroll snap can feel jarring on trackpads. Consider using `scroll-snap-type: y proximity` for a gentler effect, or only enabling on touch devices.

## Choreography Pattern

For a hero section that unfolds on load:

```css
.hero-content > * {
  opacity: 0;
  transform: translateY(20px);
  animation: staggerIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.hero-content > *:nth-child(1) { animation-delay: 0.1s; }
.hero-content > *:nth-child(2) { animation-delay: 0.25s; }
.hero-content > *:nth-child(3) { animation-delay: 0.4s; }
.hero-content > *:nth-child(4) { animation-delay: 0.55s; }

@keyframes staggerIn {
  to { opacity: 1; transform: translateY(0); }
}
```

## Performance Rules

- Never animate `width`, `height`, or `top`/`left` — use `transform` and `opacity` only
- Use `will-change: transform` sparingly and only on elements that will animate
- Throttle scroll listeners with `requestAnimationFrame`
- Prefer CSS `animation-timeline` (GPU-composited) over JS scroll handlers
- Test on 60Hz mobile screens, not just 120Hz laptops

## Common Mistakes

- Scroll-jacking (overriding native scroll) — universally hated, don't do it
- Mandatory scroll-snap on long pages — feels like a trap
- Animations that only play once but the user scrolls back — use `animation-fill-mode: both`
- No mobile fallback for pinned sections — sticky + grid breaks on small screens
- Too many scroll-triggered animations = nothing feels special
