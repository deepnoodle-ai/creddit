# 3D, AR & Immersive Elements — Implementation Reference

Interactive 3D, AR previews, and immersive visuals are maturing in 2026. They reduce purchase hesitation in e-commerce and create memorable experiences for SaaS and brand sites. The key: use them purposefully, load them lazily.

## When to Use 3D

**Good use cases:**
- Product showcase (360° spin, zoom)
- Architecture/space visualization
- Data visualization with depth
- Hero section with one interactive 3D element
- AR "try before you buy" (furniture, fashion, cosmetics)

**Bad use cases:**
- Background decoration with no purpose
- Every page of a content-heavy site
- When a 2D image communicates the same info faster

## Three.js Basics (for HTML/JSX artifacts)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<script>
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap for performance
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // Simple rotating object
  const geometry = new THREE.TorusGeometry(1, 0.4, 16, 60);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff6b2b,
    metalness: 0.3,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const point = new THREE.PointLight(0xffffff, 1);
  point.position.set(5, 5, 5);
  scene.add(point);

  camera.position.z = 4;

  function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.x += 0.003;
    mesh.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
  animate();
</script>
```

## Mouse-Interactive 3D (follows cursor)

```js
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

function animate() {
  requestAnimationFrame(animate);
  // Smooth follow
  mesh.rotation.y += (mouseX * 0.5 - mesh.rotation.y) * 0.05;
  mesh.rotation.x += (mouseY * 0.3 - mesh.rotation.x) * 0.05;
  renderer.render(scene, camera);
}
```

## CSS 3D Transforms (lighter alternative)

For simple 3D card effects without Three.js:

```css
.card-3d {
  perspective: 1000px;
}

.card-3d-inner {
  transition: transform 0.6s ease;
  transform-style: preserve-3d;
}

.card-3d:hover .card-3d-inner {
  transform: rotateY(8deg) rotateX(-3deg);
}
```

### Tilt on Mouse Move (JS)
```js
function initTilt(el, maxTilt = 10) {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `
      perspective(1000px)
      rotateY(${x * maxTilt}deg)
      rotateX(${-y * maxTilt}deg)
      scale(1.02)
    `;
  });

  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform 0.5s ease';
    el.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale(1)';
    setTimeout(() => el.style.transition = '', 500);
  });
}
```

## Performance Guidelines

- **Lazy-load 3D**: Don't initialize Three.js until the element is near viewport
- **Cap pixel ratio**: `Math.min(window.devicePixelRatio, 2)` — 3x is wasteful
- **Reduce geometry on mobile**: Fewer polygons, simpler materials
- **Use `alpha: true`** for transparent canvas backgrounds (blends with page)
- **Dispose properly**: Call `.dispose()` on geometries, materials, and textures when removing
- **Avoid OrbitControls in r128** — it's not bundled. Use manual rotation or mouse-follow instead.
- **Do NOT use `THREE.CapsuleGeometry`** — added in r142, unavailable in r128. Use CylinderGeometry + SphereGeometry.

## Fallback for Non-3D Contexts

Always provide a static image fallback:

```html
<div id="3d-container">
  <img src="product-fallback.webp" alt="Product view" class="fallback-img">
</div>

<script>
  if (window.WebGLRenderingContext) {
    document.querySelector('.fallback-img').style.display = 'none';
    // Initialize Three.js...
  }
</script>
```

## Common Mistakes

- Loading Three.js (500KB+) for a spinning logo = overkill, use CSS transforms
- No fallback = blank space on older devices
- 3D on every page = slow site, exhausted GPU, drained mobile battery
- Forgetting to handle window resize = distorted canvas
- Using OrbitControls from examples in Claude artifacts = import will fail
