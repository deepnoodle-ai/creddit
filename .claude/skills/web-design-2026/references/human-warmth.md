# Human Warmth & Creative Process — Implementation Reference

Counter-trend to AI polish. Hand-drawn textures, organic shapes, intentional imperfection. Says "a human made this."

## Organic Shapes

```css
.blob {
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  animation: blobMorph 8s ease-in-out infinite;
}
@keyframes blobMorph {
  0%   { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
  50%  { border-radius: 50% 50% 34% 66% / 56% 68% 32% 44%; }
  100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
}
```

## Squiggly Underline
```css
.squiggly {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='8'%3E%3Cpath d='M0,4 Q12.5,0 25,4 T50,4 T75,4 T100,4' fill='none' stroke='%23ff6b2b' stroke-width='2'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-position: bottom;
  background-size: 50px 8px;
  padding-bottom: 6px;
}
```

## Grain Texture Overlay
```css
.grain::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

## Collage Effects
```css
.collage-item { transform: rotate(-2deg); box-shadow: 4px 4px 0 rgba(0,0,0,0.1); border: 3px solid white; }
.collage-item:nth-child(2) { transform: rotate(1.5deg); }
.collage-item:nth-child(3) { transform: rotate(-3deg); }
```

## Handwriting Fonts (Google Fonts — accents only, never body text)
```css
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
.handwritten { font-family: 'Caveat', cursive; font-size: 1.5rem; }
```

## Best For
Indie brands, creative portfolios, food/restaurant, personal blogs, children's brands — anywhere "corporate polish" would feel inauthentic.

## Common Mistakes
- Handwriting font for body text = unreadable
- Too many stacked textures = visual mud
- Grain overlay too strong = looks like a rendering bug
- Forced quirkiness on serious products = tone mismatch
