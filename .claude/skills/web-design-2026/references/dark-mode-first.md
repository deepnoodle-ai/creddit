# Dark Mode First — Implementation Reference

In 2026, dark mode is the default, not the alternative. 91%+ of users prefer it. Design the dark theme first, then derive light as the variant.

## Base Structure

```css
:root {
  color-scheme: dark light;

  /* === DARK (default) === */
  --bg-primary: #0a0a0b;
  --bg-surface: #141416;
  --bg-elevated: #1c1c1f;
  --bg-hover: #232326;

  --text-primary: #f0f0f2;
  --text-secondary: #8a8a8e;
  --text-tertiary: #5a5a5e;

  --accent: #ff6b2b;
  --accent-hover: #ff8550;
  --accent-text: #ffffff;

  --border: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.15);

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.5);
}

/* === LIGHT (variant) === */
@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: #fafaf9;
    --bg-surface: #ffffff;
    --bg-elevated: #f0f0ee;
    --bg-hover: #e8e8e5;

    --text-primary: #1a1a1b;
    --text-secondary: #6b6b70;
    --text-tertiary: #9a9a9e;

    --accent: #e85d1a;
    --accent-hover: #d04d10;
    --accent-text: #ffffff;

    --border: rgba(0, 0, 0, 0.08);
    --border-strong: rgba(0, 0, 0, 0.15);

    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.1);
  }
}
```

## Manual Toggle (JS)

If you want a toggle button in addition to system preference:

```js
function initThemeToggle() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const stored = localStorage?.getItem('theme'); // graceful if unavailable

  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  }

  toggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
  });
}
```

```css
/* Override system preference when user manually chooses */
[data-theme="light"] {
  --bg-primary: #fafaf9;
  --bg-surface: #ffffff;
  /* ... same light values ... */
}

[data-theme="dark"] {
  --bg-primary: #0a0a0b;
  --bg-surface: #141416;
  /* ... same dark values ... */
}
```

**Note**: In Claude.ai artifacts, `localStorage` is not available. For artifacts, use React state instead.

## OLED Optimization

True black (#000000) saves battery on OLED screens but can cause "smearing" on scroll. Use near-black instead:

```css
/* Good — dark but not pure black */
--bg-primary: #0a0a0b;

/* Avoid — pure black causes OLED smear */
--bg-primary: #000000;
```

## Image Handling in Dark Mode

Images can look too bright in dark contexts:

```css
@media (prefers-color-scheme: dark) {
  img:not([data-no-dim]) {
    filter: brightness(0.9) contrast(1.05);
  }
}
```

Or use `<picture>` with dark-mode-specific images:
```html
<picture>
  <source srcset="hero-dark.webp" media="(prefers-color-scheme: dark)">
  <img src="hero-light.webp" alt="Hero image">
</picture>
```

## Common Mistakes

- Pure black backgrounds (#000) = OLED smearing, feels harsh
- Same accent color at same lightness in both modes = broken contrast in one of them
- White shadows in dark mode = looks ghostly (use black shadows with more opacity)
- Forgetting to adjust image brightness = images blast your eyes in dark mode
- Not testing both modes = shipping a broken theme
