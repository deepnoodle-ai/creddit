# Kinetic Typography — Implementation Reference

Typography is the hero element in 2026. Oversized, animated, variable-weight headlines communicate brand personality faster than any image. The trend is about type as experience, not just content.

## Variable Font Interactions

Variable fonts allow smooth transitions between weight, width, and slant on hover or scroll:

```css
/* Import a variable font with weight axis */
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@100..800&display=swap');

.hero-headline {
  font-family: 'Sora', sans-serif;
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 300;
  line-height: 1.05;
  letter-spacing: -0.03em;
  transition: font-weight 0.5s ease, letter-spacing 0.5s ease;
}

.hero-headline:hover {
  font-weight: 800;
  letter-spacing: -0.05em;
}
```

## Per-Character Animation

Split text into spans for per-letter stagger. In React:

```jsx
function KineticHeading({ text, className }) {
  return (
    <h1 className={className}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            animationDelay: `${i * 0.03}s`,
            ...(char === ' ' ? { width: '0.3em' } : {})
          }}
          className="char-animate"
        >
          {char}
        </span>
      ))}
    </h1>
  );
}
```

```css
.char-animate {
  opacity: 0;
  transform: translateY(40px) rotateX(-90deg);
  animation: charReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes charReveal {
  to {
    opacity: 1;
    transform: translateY(0) rotateX(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .char-animate {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
```

## Per-Word Animation (simpler, often better)

```jsx
function WordReveal({ text }) {
  return (
    <h1>
      {text.split(' ').map((word, i) => (
        <span key={i} className="word-wrap" style={{ display: 'inline-block', overflow: 'hidden' }}>
          <span
            className="word-inner"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {word}&nbsp;
          </span>
        </span>
      ))}
    </h1>
  );
}
```

```css
.word-inner {
  display: inline-block;
  transform: translateY(105%);
  animation: wordSlideUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes wordSlideUp {
  to { transform: translateY(0); }
}
```

## Scroll-Linked Weight Change

Change font weight as the user scrolls through a section:

```js
// Vanilla JS — progressive enhancement
const heading = document.querySelector('.scroll-weight');
if (heading) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      const weight = 300 + (entry.intersectionRatio * 500); // 300 → 800
      heading.style.fontVariationSettings = `'wght' ${weight}`;
    },
    { threshold: Array.from({ length: 20 }, (_, i) => i / 19) }
  );
  observer.observe(heading);
}
```

## Text Gradient Effect

```css
.gradient-text {
  background: linear-gradient(135deg, #ff6b2b, #ff2b7a, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

## Typography Scale for 2026

The trend favors extreme contrast between headline and body:

```css
:root {
  --text-display: clamp(3.5rem, 10vw, 9rem);
  --text-h1: clamp(2.5rem, 6vw, 5rem);
  --text-h2: clamp(1.8rem, 3.5vw, 3rem);
  --text-h3: clamp(1.2rem, 2vw, 1.75rem);
  --text-body: clamp(1rem, 1.1vw, 1.125rem);
  --text-small: clamp(0.75rem, 0.85vw, 0.875rem);
  --text-micro: 0.625rem;
}
```

## Font Pairing Strategies

- **Contrast pair**: Expressive display + neutral body (Clash Display + DM Sans)
- **Family pair**: Same superfamily, different optical sizes (Fraunces Display + Fraunces Text)
- **Mono accent**: Monospace for labels/captions, sans-serif for everything else

## Common Mistakes

- Animating too many characters = looks frantic, not elegant
- Missing `display: inline-block` on animated spans = transforms don't work on inline elements
- Font weight transitions without a variable font = jumpy discrete changes
- Oversized text without proper `line-height` (use 1.0-1.1 for display, 1.5+ for body)
- Forgetting the reduced-motion fallback = accessibility failure
