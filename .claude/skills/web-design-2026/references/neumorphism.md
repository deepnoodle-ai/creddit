# Neumorphism / Soft UI — Implementation Reference

Neumorphism creates tactile, extruded elements that appear to push out of or press into the background surface. It blends skeuomorphism's physicality with minimalism's restraint. Best for fintech dashboards, productivity tools, and premium UI.

## Core Technique

Two shadows — one light, one dark — on a matching background:

```css
:root {
  --neu-bg: #1a1a2e;
  --neu-light: rgba(255, 255, 255, 0.05);
  --neu-dark: rgba(0, 0, 0, 0.5);
  --neu-radius: 16px;
}

/* Raised element (outset) */
.neu-raised {
  background: var(--neu-bg);
  border-radius: var(--neu-radius);
  box-shadow:
    6px 6px 12px var(--neu-dark),
    -6px -6px 12px var(--neu-light);
}

/* Pressed element (inset) */
.neu-pressed {
  background: var(--neu-bg);
  border-radius: var(--neu-radius);
  box-shadow:
    inset 4px 4px 8px var(--neu-dark),
    inset -4px -4px 8px var(--neu-light);
}
```

## Button with Press Effect

```css
.neu-button {
  background: var(--neu-bg);
  border: none;
  border-radius: 12px;
  padding: 0.75rem 2rem;
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  box-shadow:
    5px 5px 10px var(--neu-dark),
    -5px -5px 10px var(--neu-light);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.neu-button:hover {
  box-shadow:
    3px 3px 6px var(--neu-dark),
    -3px -3px 6px var(--neu-light);
}

.neu-button:active {
  box-shadow:
    inset 3px 3px 6px var(--neu-dark),
    inset -3px -3px 6px var(--neu-light);
  transform: scale(0.98);
}
```

## Input Field

```css
.neu-input {
  background: var(--neu-bg);
  border: none;
  border-radius: 12px;
  padding: 0.875rem 1.25rem;
  color: var(--text-primary);
  font-size: 1rem;
  box-shadow:
    inset 3px 3px 6px var(--neu-dark),
    inset -3px -3px 6px var(--neu-light);
}

.neu-input:focus {
  outline: none;
  box-shadow:
    inset 3px 3px 6px var(--neu-dark),
    inset -3px -3px 6px var(--neu-light),
    0 0 0 2px var(--accent);
}
```

## Toggle / Switch

```css
.neu-toggle {
  width: 56px;
  height: 32px;
  border-radius: 16px;
  background: var(--neu-bg);
  box-shadow:
    inset 3px 3px 6px var(--neu-dark),
    inset -3px -3px 6px var(--neu-light);
  position: relative;
  cursor: pointer;
}

.neu-toggle-thumb {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--neu-bg);
  box-shadow:
    2px 2px 4px var(--neu-dark),
    -2px -2px 4px var(--neu-light);
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.neu-toggle.active .neu-toggle-thumb {
  transform: translateX(24px);
  background: var(--accent);
}
```

## Light Mode Variant

In light mode, neumorphism needs stronger shadows:

```css
@media (prefers-color-scheme: light) {
  :root {
    --neu-bg: #e0e5ec;
    --neu-light: rgba(255, 255, 255, 0.8);
    --neu-dark: rgba(0, 0, 0, 0.15);
  }
}
```

## Accessibility Concerns

Neumorphism's biggest weakness is low contrast between elements and background. Mitigations:

- Add a subtle border (1px, low opacity) to define edges
- Use accent colors for active/focused states with sufficient contrast
- Ensure focus indicators are clearly visible (outline or ring)
- Don't rely on shadow alone to indicate interactive elements
- Test with forced-colors mode (Windows High Contrast)

```css
.neu-raised {
  /* Add subtle border for definition */
  border: 1px solid rgba(255, 255, 255, 0.04);
}

/* High contrast mode fallback */
@media (forced-colors: active) {
  .neu-raised,
  .neu-pressed {
    border: 2px solid ButtonText;
  }
}
```

## When to Use

- Dashboard widgets and stat cards
- Form controls (inputs, toggles, sliders)
- Calculator or tool interfaces
- Settings panels
- Music player or media controls

## When NOT to Use

- Text-heavy content pages (low contrast hurts readability)
- E-commerce product grids (too subtle for scanning)
- Marketing hero sections (needs bolder visual impact)

## Common Mistakes

- Background color doesn't match element color = shadows look wrong
- Shadows too strong = looks like a 3D rendering, not subtle UI
- All elements neumorphic = monotonous, nothing stands out
- No border fallback = elements disappear on low-contrast displays
- Missing focus/active states = buttons look identical to cards
