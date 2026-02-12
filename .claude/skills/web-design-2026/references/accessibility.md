# Accessibility-First Design — Implementation Reference

Accessibility in 2026 is a design foundation, not a late-stage audit. Accessible sites reach 30% more users and directly impact conversion. Every pattern in this skill must pass these checks.

## Non-Negotiable Checklist

Every page must have:

- [ ] **Semantic HTML**: `<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`
- [ ] **Heading hierarchy**: One `<h1>`, then `<h2>`, `<h3>` in order. No skipping levels.
- [ ] **Alt text on all images**: Descriptive for content images, `alt=""` for decorative
- [ ] **ARIA labels on interactive elements**: Buttons, links, form inputs
- [ ] **Keyboard navigation**: Every interactive element reachable and operable via Tab/Enter/Space
- [ ] **Visible focus indicators**: Never `outline: none` without a replacement
- [ ] **Color contrast**: 4.5:1 for body text, 3:1 for large text (WCAG AA)
- [ ] **`prefers-reduced-motion`**: All animations disabled or simplified
- [ ] **`prefers-color-scheme`**: Dark/light mode support
- [ ] **Touch targets ≥ 48×48px**: Minimum interactive area on mobile
- [ ] **No color-only indicators**: Don't rely solely on color to convey meaning

## Focus Styles

The default browser outline is ugly but removing it is worse. Replace it:

```css
/* Remove default, add custom */
:focus {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 4px;
}

/* For dark backgrounds */
:focus-visible {
  outline: 2px solid var(--accent);
  box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.25);
}
```

**`:focus-visible`** only shows the outline when the user is navigating with keyboard, not on mouse click. This is the correct behavior.

## Skip Navigation Link

```html
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <nav>...</nav>
  <main id="main-content">...</main>
</body>
```

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: var(--accent-text);
  border-radius: 8px;
  z-index: 1000;
  font-weight: 600;
}

.skip-link:focus {
  top: 1rem;
}
```

## Accessible Forms

```html
<div class="form-field">
  <label for="email">Email address</label>
  <input
    type="email"
    id="email"
    name="email"
    required
    aria-describedby="email-hint email-error"
    autocomplete="email"
  >
  <span id="email-hint" class="hint">We'll never share your email</span>
  <span id="email-error" class="error" role="alert" aria-live="polite"></span>
</div>
```

Key points:
- Every input has a visible `<label>` linked by `for`/`id`
- `aria-describedby` links hints and errors
- Error messages use `role="alert"` and `aria-live="polite"`
- Use `autocomplete` attributes for autofill

## Accessible Buttons

```html
<!-- Good: text content explains the action -->
<button>Add to cart</button>

<!-- Good: icon button with aria-label -->
<button aria-label="Close dialog">
  <svg>...</svg>
</button>

<!-- Bad: no accessible name -->
<button><svg>...</svg></button>

<!-- Bad: div pretending to be a button -->
<div onclick="doThing()">Click me</div>
```

## Accessible Modals

```html
<dialog id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm action</h2>
  <p>Are you sure you want to proceed?</p>
  <button autofocus>Confirm</button>
  <button data-close>Cancel</button>
</dialog>
```

Key: trap focus inside the modal, return focus to trigger on close.

## Screen Reader Utilities

```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

Use for labels that are visually redundant but needed by screen readers:
```html
<button>
  <svg>...</svg>
  <span class="sr-only">Open navigation menu</span>
</button>
```

## Reduced Motion

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

## Testing Quick Checks

1. **Tab through the page** — Can you reach everything? Is the order logical?
2. **Zoom to 200%** — Does layout break?
3. **Turn off CSS** — Does the content still make sense in reading order?
4. **Use a screen reader** (VoiceOver on Mac: Cmd+F5) for 2 minutes
5. **Check contrast** — Browser DevTools → Accessibility panel
6. **Test with keyboard only** — No mouse for the entire flow

## Common Mistakes

- `outline: none` with no replacement = keyboard users are blind
- Placeholder text as the only label = disappears on input, screen readers may miss it
- Color-only error states (red border) = invisible to colorblind users
- Infinite scroll with no keyboard way to reach footer
- Modals that don't trap focus = screen reader escapes into background
- Images without alt text = screen reader says "image" with no context
