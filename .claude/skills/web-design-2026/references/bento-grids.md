# Bento Grids — Implementation Reference

Bento grids arrange content in modular cards of varying sizes, inspired by Japanese bento box compartments. The pattern dominates SaaS feature showcases, dashboards, and product landing pages in 2026.

## Base Grid

```css
.bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(200px, auto);
  gap: 16px;
  padding: 16px;
}

.bento-card {
  background: var(--bg-surface);
  border-radius: 20px;
  padding: 2rem;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* Size variants */
.bento-card.wide    { grid-column: span 2; }
.bento-card.tall    { grid-row: span 2; }
.bento-card.featured { grid-column: span 2; grid-row: span 2; }
.bento-card.full    { grid-column: 1 / -1; }
```

## Responsive Collapse

```css
/* Tablet: 2 columns */
@media (max-width: 1024px) {
  .bento {
    grid-template-columns: repeat(2, 1fr);
  }
  .bento-card.featured { grid-column: 1 / -1; }
}

/* Mobile: single column, everything stacks */
@media (max-width: 640px) {
  .bento {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .bento-card.wide,
  .bento-card.tall,
  .bento-card.featured {
    grid-column: auto;
    grid-row: auto;
  }
}
```

## Common Bento Layouts

### Feature Showcase (Apple-style)
```
┌──────────┬─────┬─────┐
│ featured │  sm │  sm │
│          ├─────┴─────┤
│          │   wide    │
├─────┬────┴───────────┤
│  sm │    wide        │
└─────┴────────────────┘
```

```css
.bento-features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 200px);
  gap: 16px;
}
.card-1 { grid-column: 1 / 3; grid-row: 1 / 3; }
.card-2 { grid-column: 3; grid-row: 1; }
.card-3 { grid-column: 4; grid-row: 1; }
.card-4 { grid-column: 3 / 5; grid-row: 2; }
.card-5 { grid-column: 1; grid-row: 3; }
.card-6 { grid-column: 2 / 5; grid-row: 3; }
```

### Dashboard Stats
```
┌──────────┬──────────┬─────┐
│   wide   │   wide   │tall │
├────┬─────┼──────────┤     │
│ sm │ sm  │   wide   │     │
└────┴─────┴──────────┴─────┘
```

## Card Content Patterns

Each card should contain one idea. Patterns that work:

- **Stat card**: Big number + label + sparkline
- **Feature card**: Icon + heading + one-liner + subtle visual
- **Visual card**: Full-bleed image or illustration, text overlay at bottom
- **Interactive card**: Mini demo, animated graphic, or live preview
- **Testimonial card**: Quote + avatar + name

## Hover Effects

```css
.bento-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.bento-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* Tilt on hover (subtle) */
.bento-card.tilt:hover {
  transform: perspective(1000px) rotateX(2deg) rotateY(-2deg) translateY(-4px);
}
```

## With Glassmorphism

Bento + glass is the quintessential 2026 combo:

```css
.bento-glass .bento-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

## Common Mistakes

- All cards the same size = boring grid, not bento
- Too many cards visible at once = overwhelming
- Cards without clear visual hierarchy = everything fights for attention
- Forgetting to simplify on mobile = broken layouts
- No content differentiation between cards = monotonous
