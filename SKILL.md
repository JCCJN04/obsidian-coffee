---
name: video-web
description: >
  Build immersive websites where a video file is the visual backbone of the entire experience —
  the page is constructed ON TOP of the video, making it feel alive, cinematic, and 3D.
  Use this skill whenever the user wants to: create a landing page using a video background,
  build a site that "looks animated" or "feels 3D" using a video, design a hero section driven by video,
  generate a full webpage from a video file, or make any site that should feel cinematic, immersive, or motion-based.
  Trigger even when the user says things like "usa este video para hacer la página", "que parezca 3D",
  "que se vea animada", "haz un sitio con el video de fondo", or "construye la web a partir del video".
---

# Video-Driven Web Skill

Build production-grade websites where a video is not decoration — it IS the page.
The final result should feel like the user is watching a living, breathing experience rather than
reading a static website.

---

## Core Concept

The technique: the video plays fullscreen (or section-wide), and ALL content — titles, CTAs,
nav, cards — is layered ON TOP using `position: absolute/fixed` + `z-index` stacking +
CSS `mix-blend-mode` / `backdrop-filter` / `clip-path` to make the text and UI feel
fused with the video, not pasted over it.

Combined with 3D CSS transforms (`perspective`, `rotateX`, `rotateY`, `translateZ`),
subtle parallax on scroll, and glassmorphism overlays, the result looks like a native
3D animated experience — without WebGL or any external libraries (unless the user requests them).

---

## Step-by-Step Workflow

### 1. Understand the video and goal

Ask (or infer from context):
- What is the video about / what brand/product does it represent?
- Is the video provided as a file path, URL, or `<video>` embed code? Or does the user want a placeholder?
- What sections should the site have? (hero, features, CTA, about, contact…)
- Preferred language: Spanish or English?
- Color palette or brand colors? If none, extract mood from the video description.

If the user hasn't provided the video yet, build with a clear `<!-- INSERT VIDEO HERE -->` placeholder and
`<source>` tag ready to receive the file.

### 2. Choose the visual language

Pick ONE strong aesthetic direction based on the video's mood. Examples:

| Video Mood | Recommended Aesthetic |
|---|---|
| Nature / outdoors | Organic, earthy overlays, serif titles |
| Tech / product | Dark glassmorphism, neon accents, monospace |
| Fashion / luxury | Editorial, high contrast, minimal UI |
| Food / lifestyle | Warm gradients, rounded cards, playful type |
| Corporate / B2B | Clean grid, blue accents, confident sans-serif |
| Action / sport | Bold, kinetic, oversized type, diagonal cuts |

Never use purple gradients on white or generic AI aesthetics. Commit fully to the chosen direction.

### 3. HTML Structure

Use this base structure:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nombre del Sitio</title>
  <style>/* All CSS inline or in <style> tag */</style>
</head>
<body>

  <!-- ░░ VIDEO LAYER (z-index: 0) ░░ -->
  <div class="video-wrap">
    <video autoplay muted loop playsinline>
      <source src="YOUR_VIDEO.mp4" type="video/mp4" />
    </video>
    <!-- Overlay gradient to make text readable -->
    <div class="video-overlay"></div>
  </div>

  <!-- ░░ CONTENT LAYER (z-index: 10+) ░░ -->
  <nav>...</nav>
  <main>
    <section class="hero">...</section>
    <section class="features">...</section>
    <section class="cta">...</section>
  </main>
  <footer>...</footer>

  <script>/* Scroll parallax + 3D tilt JS */</script>
</body>
</html>
```

### 4. Critical CSS Patterns

#### Fullscreen video base
```css
.video-wrap {
  position: fixed;        /* Stays behind everything on scroll */
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.video-wrap video {
  width: 100%;
  height: 100%;
  object-fit: cover;      /* Always fills viewport, no letterboxing */
  object-position: center;
}

.video-overlay {
  position: absolute;
  inset: 0;
  /* Tune opacity to balance readability vs video visibility */
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.45) 0%,
    rgba(0,0,0,0.15) 50%,
    rgba(0,0,0,0.7) 100%
  );
}
```

#### Content sits on top
```css
body {
  position: relative;
  z-index: 10;
  color: #fff;
  font-family: 'Your Chosen Font', sans-serif;
}

/* Sections with glass cards over the video */
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px) saturate(180%);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 16px;
  padding: 2rem;
}
```

#### 3D Perspective on hero content
```css
.hero-scene {
  perspective: 1000px;
  perspective-origin: 50% 40%;
}

.hero-card {
  transform-style: preserve-3d;
  transform: rotateX(4deg) rotateY(-2deg) translateZ(0);
  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.hero-card:hover {
  transform: rotateX(0deg) rotateY(0deg) translateZ(30px);
}
```

#### Scroll-based parallax (JS-free CSS approach)
```css
/* Works via CSS alone using sticky + translate */
.parallax-text {
  position: sticky;
  top: 20vh;
  transform: translateY(calc(var(--scroll-y, 0) * -0.3px));
}
```

### 5. JavaScript: 3D Tilt + Scroll Parallax

Add this minimal JS block at the bottom of `<body>`:

```js
// ── Scroll parallax ──────────────────────────
const parallaxEls = document.querySelectorAll('[data-parallax]');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.dataset.parallax) || 0.3;
    el.style.transform = `translateY(${y * speed}px)`;
  });
}, { passive: true });

// ── 3D Mouse Tilt on hero ────────────────────
const tiltEl = document.querySelector('.hero-scene');
if (tiltEl) {
  tiltEl.addEventListener('mousemove', e => {
    const { left, top, width, height } = tiltEl.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;   // -0.5 to 0.5
    const y = (e.clientY - top)  / height - 0.5;
    tiltEl.style.transform =
      `rotateY(${x * 12}deg) rotateX(${-y * 8}deg)`;
  });
  tiltEl.addEventListener('mouseleave', () => {
    tiltEl.style.transform = 'rotateY(0deg) rotateX(0deg)';
  });
}

// ── Intersection Observer: fade-in sections ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

CSS for `.reveal`:
```css
.reveal {
  opacity: 0;
  transform: translateY(40px) scale(0.97);
  transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.23,1,0.32,1);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

### 6. Typography Rules

- **Display / Hero titles**: Use a bold, high-contrast font. Examples: `Bebas Neue`, `Clash Display`,
  `Cabinet Grotesk`, `Syne`, `Anton`. Load from Google Fonts or Bunny Fonts.
- **Body**: Pair with a readable font: `DM Sans`, `Plus Jakarta Sans`, `Fraunces` (for luxury feel).
- **Size**: Hero h1 should be massive: `clamp(3.5rem, 10vw, 9rem)`.
- **Color**: White with high opacity (`rgba(255,255,255,0.95)`) for headlines.
  Use a brand accent color for highlights / CTAs.
- **Text shadow** to separate text from video:
  ```css
  text-shadow: 0 2px 20px rgba(0,0,0,0.5), 0 0 60px rgba(0,0,0,0.3);
  ```

### 7. Performance & Accessibility

- Always add `muted` + `autoplay` + `loop` + `playsinline` to `<video>` — required for autoplay in all browsers.
- Add `preload="auto"` if the video is self-hosted and small (<15MB). Use `preload="none"` for large files.
- Provide `aria-hidden="true"` on the video wrap — it's decorative.
- Add a `<noscript>` fallback poster image using `<video poster="thumbnail.jpg">`.
- For users who prefer reduced motion:
  ```css
  @media (prefers-reduced-motion: reduce) {
    video { display: none; }
    .video-wrap { background: var(--fallback-bg); }
  }
  ```
- Use `will-change: transform` sparingly — only on elements with active 3D transitions.

### 8. Sections Checklist

For a complete site, include:

- [ ] **Nav**: Transparent, `position: fixed`, `backdrop-filter: blur()` on scroll
- [ ] **Hero**: Fullscreen, large title, subtitle, 1–2 CTAs, 3D tilt enabled
- [ ] **Features / Benefits**: Glass cards over video (`reveal` animation)
- [ ] **Testimonial or Stats**: Numbers with count-up animation (optional)
- [ ] **CTA Section**: Bold call to action with accent background or solid strip
- [ ] **Footer**: Minimal, links, social icons

### 9. Output Format

Deliver the entire site as a **single `.html` file** with all CSS in `<style>` and JS in `<script>`.
No external dependencies except Google/Bunny Fonts CDN and optionally a lightweight icon set (Lucide via CDN).

Use:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />
```

If the user is building a React component instead, wrap everything in a single `.jsx` file using
`<video>` JSX with `autoPlay muted loop playsInline` props and inline Tailwind or CSS-in-JS.

---

## Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct |
|---|---|
| `position: absolute` on video-wrap | `position: fixed` — so video stays as you scroll |
| `z-index` not set on content | All content must have `z-index >= 10` |
| No overlay — text unreadable | Always add a gradient overlay on the video |
| `object-fit: contain` | Always use `object-fit: cover` |
| Forgetting `muted` on video | Browsers block autoplay without `muted` |
| Generic white background sections | Use glass cards or semi-transparent strips instead |
| Overlay too dark (>0.7 opacity) | Balance readability with video visibility |

---

## Quick-Start Template Snippet

Paste this as a starting point and customize:

```html
<!-- HERO with fullscreen video + 3D tilt -->
<div class="video-wrap" aria-hidden="true">
  <video autoplay muted loop playsinline poster="poster.jpg">
    <source src="hero.mp4" type="video/mp4" />
  </video>
  <div class="video-overlay"></div>
</div>

<section class="hero" style="perspective:1000px; min-height:100vh; display:grid; place-items:center; position:relative; z-index:10;">
  <div class="hero-scene" style="text-align:center; transform-style:preserve-3d;">
    <p class="eyebrow" data-parallax="0.2">Tu categoría o tagline</p>
    <h1 class="hero-title">Nombre del<br/>Producto</h1>
    <p class="hero-sub">Descripción breve que engancha en una línea.</p>
    <a href="#contact" class="btn-primary">Empieza Ahora</a>
  </div>
</section>
```

---

## Extending with Three.js (Advanced)

If the user wants true WebGL 3D effects on top of the video, use Three.js with a
`PlaneGeometry` as a video texture:

```js
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const video = document.getElementById('bg-video');
const texture = new THREE.VideoTexture(video);
// Use texture on a fullscreen plane behind UI elements
```

Only suggest this if the user explicitly wants 3D objects, particle effects, or shader distortions.
For most cases, CSS 3D + JS tilt is sufficient and far more performant.
