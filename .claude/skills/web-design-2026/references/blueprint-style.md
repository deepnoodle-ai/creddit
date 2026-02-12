# Blueprint / Annotation Style — Implementation Reference

This aesthetic borrows from technical documentation, engineering blueprints, and sci-fi HUD interfaces. Thin annotation lines, monospace labels, exploded diagrams, and a clinical precision that says "we take our craft seriously." Ideal for developer tools, API products, and technical SaaS.

## Visual Language

- **Monospace typography** for labels, stats, and metadata
- **Thin lines** (1px, low opacity) connecting elements to annotations
- **Small uppercase labels** with wide letter-spacing
- **Muted color palette** with one bright accent (usually blue or green)
- **Diagrams over photographs** — show how things work, not how they look
- **Grid/dot backgrounds** — subtle structural texture

## Base Setup

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Inter:wght@300;400;500;600&display=swap');

:root {
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-sans: 'Inter', system-ui, sans-serif;

  --bg: #0a0d12;
  --bg-surface: #0f1318;
  --text: #c9d1d9;
  --text-muted: #6e7681;
  --accent: #58a6ff;
  --line: rgba(201, 209, 217, 0.1);
  --line-accent: rgba(88, 166, 255, 0.3);
}

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
}
```

## Annotation Labels

```css
.annotation-label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-muted);
}

.annotation-label.accent {
  color: var(--accent);
}
```

## Connector Lines

Lines that point from labels to elements, like a technical diagram:

```css
.annotated {
  position: relative;
  padding-left: 2rem;
}

.annotated::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--line);
}

.annotated::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 1.5rem;
  height: 1px;
  background: var(--line);
}
```

### Horizontal Annotation with Label

```html
<div class="annotation-row">
  <span class="annotation-label">latency</span>
  <span class="annotation-line"></span>
  <span class="annotation-value">12ms</span>
</div>
```

```css
.annotation-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-mono);
}

.annotation-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--line-accent), transparent);
}

.annotation-value {
  color: var(--accent);
  font-size: 0.875rem;
  font-weight: 500;
}
```

## Dot Grid Background

```css
.dot-grid {
  background-image: radial-gradient(circle, var(--line) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

## Code Block Styling

```css
.code-block {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.6;
  background: var(--bg-surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 1.5rem;
  overflow-x: auto;
}

.code-block .line-number {
  color: var(--text-muted);
  user-select: none;
  margin-right: 1.5rem;
  font-size: 0.75rem;
}
```

## Exploded View Pattern

Show product internals as if disassembled:

```css
.exploded-view {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2rem;
  align-items: center;
}

.exploded-labels {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exploded-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  text-align: right;
  position: relative;
}

/* Line from label to diagram */
.exploded-label::after {
  content: '';
  position: absolute;
  right: -2rem;
  top: 50%;
  width: 1.5rem;
  height: 1px;
  background: var(--line-accent);
}
```

## Stats Grid (Blueprint Style)

```html
<div class="stats-grid">
  <div class="stat">
    <span class="annotation-label">requests/sec</span>
    <span class="stat-value">14.2k</span>
  </div>
  <div class="stat">
    <span class="annotation-label">p99 latency</span>
    <span class="stat-value">23ms</span>
  </div>
</div>
```

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.stat {
  background: var(--bg-surface);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
}
```

## When to Use

- API documentation sites
- Developer tool landing pages
- Technical SaaS products (monitoring, infrastructure, DevOps)
- Engineering team portfolios
- Products where "we understand the details" is the brand message

## Common Mistakes

- Overusing annotations = looks like a wireframe, not a finished product
- Monospace for body text = hard to read at length (use for labels and data only)
- Too clinical with no warmth = feels cold and unapproachable
- Missing hierarchy = everything looks like a footnote
