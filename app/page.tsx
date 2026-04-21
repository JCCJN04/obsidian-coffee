'use client'

import { useEffect, useRef, useState } from 'react'

const FRAME_COUNT = 121
const IMAGE_SCALE = 0.88

const STAGES = [
  { at: 0,    text: '' },
  { at: 0.05, text: 'Los granos toman forma…' },
  { at: 0.35, text: 'La presión se acumula…' },
  { at: 0.65, text: 'La explosión.' },
  { at: 0.85, text: 'El aroma lo inunda todo.' },
]

export default function Home() {
  const navRef         = useRef<HTMLElement>(null)
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const heroDriverRef  = useRef<HTMLDivElement>(null)
  const heroInnerRef   = useRef<HTMLDivElement>(null)
  const heroSceneRef   = useRef<HTMLDivElement>(null)
  const heroSectionRef = useRef<HTMLElement>(null)
  const barFillRef     = useRef<HTMLDivElement>(null)
  const slotARef       = useRef<HTMLParagraphElement>(null)
  const slotBRef       = useRef<HTMLParagraphElement>(null)
  const scrollHintRef  = useRef<HTMLDivElement>(null)
  const overlayRef     = useRef<HTMLDivElement>(null)

  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const nav         = navRef.current
    const canvas      = canvasRef.current
    const heroDriver  = heroDriverRef.current
    const heroInner   = heroInnerRef.current
    const heroScene   = heroSceneRef.current
    const heroSection = heroSectionRef.current
    const barFill     = barFillRef.current
    const slotA       = slotARef.current
    const slotB       = slotBRef.current
    const scrollHint  = scrollHintRef.current
    const overlay     = overlayRef.current

    if (!nav || !canvas || !heroDriver || !heroInner || !heroScene ||
        !heroSection || !barFill || !slotA || !slotB || !scrollHint || !overlay) return

    const cvs = canvas  // non-null alias for closures
    const ctx = cvs.getContext('2d')!
    const frames: HTMLImageElement[] = new Array(FRAME_COUNT).fill(null)
    let currentFrame    = -1
    let firstFrameReady = false

    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1
      cvs.width  = window.innerWidth  * dpr
      cvs.height = window.innerHeight * dpr
      if (currentFrame >= 0) drawFrame(currentFrame)
    }

    function drawFrame(index: number) {
      const img = frames[index]
      if (!img || !img.complete || img.naturalWidth === 0) return
      const cw = cvs.width, ch = cvs.height
      const iw = img.naturalWidth, ih = img.naturalHeight
      const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE
      const dw = iw * scale, dh = ih * scale
      ctx.fillStyle = '#0c0704'
      ctx.fillRect(0, 0, cw, ch)
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
    }

    function loadFrames() {
      const first = new Image()
      first.onload = () => {
        frames[0] = first
        firstFrameReady = true
        currentFrame = 0
        drawFrame(0)
        for (let i = 2; i <= FRAME_COUNT; i++) {
          const img = new Image()
          img.src = `/frames/frame_${String(i).padStart(4, '0')}.webp`
          img.onload = () => { frames[i - 1] = img }
        }
      }
      first.src = '/frames/frame_0001.webp'
    }

    window.addEventListener('resize', resizeCanvas, { passive: true })
    resizeCanvas()
    loadFrames()

    let targetProgress = 0
    let smoothProgress = 0
    const LERP         = 0.075
    let rafId: number
    let activeSlot     = 'A'
    let lastText       = ''
    let lastOverlayXP  = -1

    const handleScroll = () => {
      const driverH  = heroDriver.offsetHeight - window.innerHeight
      targetProgress = Math.min(Math.max(window.scrollY / driverH, 0), 1)
      nav.classList.toggle('scrolled', window.scrollY > 60)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    function rafLoop() {
      if (!barFill || !heroInner || !scrollHint || !overlay || !slotA || !slotB) return
      const diff = targetProgress - smoothProgress
      if (Math.abs(diff) < 0.0003) {
        smoothProgress = targetProgress
      } else {
        smoothProgress += diff * LERP
      }

      const p = smoothProgress

      // 1. Canvas frame — works identically forward and backward
      if (firstFrameReady) {
        const idx = Math.min(Math.floor(p * FRAME_COUNT), FRAME_COUNT - 1)
        if (idx !== currentFrame) {
          let best = idx
          if (!frames[idx]) {
            for (let d = 1; d < FRAME_COUNT; d++) {
              if (frames[idx - d]) { best = idx - d; break }
              if (frames[idx + d]) { best = idx + d; break }
            }
          }
          currentFrame = idx
          drawFrame(best)
        }
      }

      // 2. Progress bar
      barFill.style.height = (p * 100).toFixed(1) + '%'

      // 3. Hero text fade (first 28% of scroll)
      const textFade = p < 0.28 ? p / 0.28 : 1
      heroInner.style.opacity   = (1 - textFade).toFixed(3)
      heroInner.style.transform = `translateY(${(textFade * -70).toFixed(1)}px)`

      // 4. Scroll hint
      scrollHint.style.opacity = p < 0.03 ? '1' : '0'

      // 5. Dynamic overlay
      const xp = p > 0.48 ? (p - 0.48) / 0.52 : 0
      if (Math.abs(xp - lastOverlayXP) > 0.005) {
        lastOverlayXP = xp
        const mid = (0.12 + xp * 0.30).toFixed(2)
        const top = (0.50 + xp * 0.12).toFixed(2)
        overlay.style.background =
          `linear-gradient(180deg,rgba(6,3,1,${top}) 0%,rgba(6,3,1,${mid}) 45%,rgba(6,3,1,${(0.22 + xp * 0.22).toFixed(2)}) 65%,rgba(6,3,1,0.82) 100%)`
      }

      // 6. Cinematic phrases crossfade
      const showStage = textFade >= 0.95
      let stage = STAGES[0]
      for (const s of STAGES) { if (targetProgress >= s.at) stage = s }
      const newText = showStage ? stage.text : ''

      if (newText !== lastText) {
        lastText = newText
        const incoming = activeSlot === 'A' ? slotA : slotB
        const outgoing  = activeSlot === 'A' ? slotB : slotA
        incoming.textContent = newText
        requestAnimationFrame(() => requestAnimationFrame(() => {
          outgoing.classList.remove('visible')
          if (newText) incoming.classList.add('visible')
          else         incoming.classList.remove('visible')
        }))
        activeSlot = activeSlot === 'A' ? 'B' : 'A'
      }

      rafId = requestAnimationFrame(rafLoop)
    }

    rafId = requestAnimationFrame(rafLoop)

    // Hero 3D tilt
    const handleMouseMove = (e: MouseEvent) => {
      if (targetProgress > 0.08) return
      const r = heroSection.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width  - 0.5
      const y = (e.clientY - r.top)  / r.height - 0.5
      heroScene.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 6}deg)`
    }
    const handleMouseLeave = () => {
      heroScene.style.transform = 'rotateY(0deg) rotateX(0deg)'
    }

    heroSection.addEventListener('mousemove', handleMouseMove)
    heroSection.addEventListener('mouseleave', handleMouseLeave)

    // Reveal on scroll
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target) }
      })
    }, { threshold: 0.12 })
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el))

    // Count-up stats
    const countObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const el     = entry.target as HTMLElement
        const target = parseInt(el.dataset.target ?? '0', 10)
        const suffix = el.querySelector('sup')?.textContent ?? ''
        let current  = 0
        const step   = target / (1800 / 16)
        const tick = () => {
          current = Math.min(current + step, target)
          el.innerHTML = Math.floor(current) + `<sup>${suffix}</sup>`
          if (current < target) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        countObs.unobserve(el)
      })
    }, { threshold: 0.5 })
    document.querySelectorAll('.stat-num[data-target]').forEach(el => countObs.observe(el))

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', resizeCanvas)
      heroSection.removeEventListener('mousemove', handleMouseMove)
      heroSection.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(rafId)
      revealObs.disconnect()
      countObs.disconnect()
    }
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      {/* CANVAS FRAME LAYER */}
      <div className="video-wrap" aria-hidden="true">
        <canvas ref={canvasRef} id="bgCanvas" />
        <div className="video-overlay" ref={overlayRef} />
      </div>

      {/* NAVIGATION */}
      <nav ref={navRef}>
        <a href="#" className="nav-logo">OBSIDIAN<span>.</span></a>
        <ul className="nav-links">
          <li><a href="#origenes">Orígenes</a></li>
          <li><a href="#metodo">Método</a></li>
          <li><a href="#tienda">Tienda</a></li>
          <li><a href="#nosotros">Nosotros</a></li>
        </ul>
        <a href="#contacto" className="nav-cta">Ordenar</a>
      </nav>

      {/* CONTENT LAYER */}
      <div className="content-layer">

        {/* HERO */}
        <div className="hero-driver" ref={heroDriverRef}>
          <section className="hero" id="hero" ref={heroSectionRef}>
            <div className="hero-inner" ref={heroInnerRef}>
              <div className="hero-scene" ref={heroSceneRef}>
                <p className="hero-eyebrow">Café de Especialidad — Desde 2018</p>
                <h1 className="hero-title">
                  El sabor<br />
                  <em>que</em>
                  <span className="accent">despierta.</span>
                </h1>
                <p className="hero-subtitle">
                  Granos seleccionados a mano de las altitudes más extremas del mundo,
                  tostados con precisión milimétrica para revelar lo imposible.
                </p>
                <div className="hero-actions">
                  <a href="#tienda" className="btn-primary">Explorar la colección</a>
                  <a href="#origenes" className="btn-secondary">Nuestros orígenes</a>
                </div>
              </div>
            </div>

            <div className="scroll-bar" aria-hidden="true">
              <div className="scroll-bar-fill" ref={barFillRef} />
            </div>

            <p className="stage-slot" ref={slotARef} />
            <p className="stage-slot" ref={slotBRef} />

            <div className="hero-scroll-hint" aria-hidden="true" ref={scrollHintRef}>
              <div className="scroll-line" />
              <span>Scroll</span>
            </div>
          </section>
        </div>

        {/* FEATURES */}
        <section className="features" id="metodo">
          <div className="features-header reveal">
            <p className="section-label">Nuestra filosofía</p>
            <h2 className="section-title">El método <em>Obsidian</em></h2>
          </div>
          <div className="features-grid">
            {[
              {
                title: 'Selección por altitud',
                text: 'Solo trabajamos con granos cultivados por encima de los 1,700 msnm. La altitud extrema concentra los azúcares naturales y amplifica la complejidad aromática.',
              },
              {
                title: 'Tostión artesanal',
                text: 'Cada lote es tostado en pequeñas cantidades con curvas de temperatura personalizadas. Sin automatización. Sin compromiso.',
              },
              {
                title: 'Frescura garantizada',
                text: 'Despachamos dentro de las 48 horas post-tostión. Tu café llega en su punto exacto: el momento donde el aroma alcanza su plenitud.',
              },
              {
                title: 'Comercio directo',
                text: 'Relación directa con cada productor. Precios justos, trazabilidad total y un vínculo que trasciende lo transaccional.',
              },
            ].map((card, i) => (
              <div key={card.title} className={`glass-card reveal reveal-delay-${i + 1}`}>
                <span className="card-icon">◈</span>
                <div className="card-divider" />
                <h3 className="card-title">{card.title}</h3>
                <p className="card-text">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section className="stats">
          <div className="stats-inner">
            <div className="stats-copy reveal">
              <p className="section-label">En números</p>
              <h2 className="section-title">Una <em>obsesión</em><br />medida</h2>
              <p>
                Cada cifra es el resultado de años de trabajo silencioso, de madrugadas
                en fincas remotas y de una convicción irreductible: el café extraordinario
                no se descubre — se construye.
              </p>
            </div>
            <div className="stats-numbers">
              {[
                { target: 12,  sup: '+',  label: 'Países de origen' },
                { target: 340, sup: 't',  label: 'Horas de cata anuales' },
                { target: 97,  sup: '%',  label: 'Clientes que repiten' },
                { target: 6,   sup: 'k+', label: 'Kg tostados por mes' },
              ].map((s, i) => (
                <div key={s.label} className={`stat-item reveal reveal-delay-${i + 1}`}>
                  <div className="stat-num" data-target={s.target}>
                    0<sup>{s.sup}</sup>
                  </div>
                  <p className="stat-label">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ORIGINS */}
        <section className="origins" id="origenes">
          <div className="origins-inner">
            <div className="origins-header">
              <div className="reveal">
                <p className="section-label">Orígenes selectos</p>
                <h2 className="section-title">El terroir <em>del café</em></h2>
              </div>
              <p className="reveal reveal-delay-1">
                Exploramos los rincones más remotos del cinturón ecuatorial
                para traer expresiones únicas directamente a tu taza.
              </p>
            </div>
            <div className="origins-grid">
              {[
                {
                  country: 'Ethiopia — Yirgacheffe',
                  name: 'Kochere Natural',
                  desc: 'Notas de jazmín, bergamota y frutos rojos fermentados. Una experiencia floral que redefine lo que el café puede ser.',
                  tag: 'Proceso Natural',
                },
                {
                  country: 'Colombia — Huila',
                  name: 'El Paraíso Doble Anaeróbico',
                  desc: 'Melocotón, maracuyá y panela. Una fermentación controlada durante 72 horas que genera una complejidad estratosférica.',
                  tag: 'Anaeróbico',
                },
                {
                  country: 'Guatemala — Huehuetenango',
                  name: 'Cuilco Washed',
                  desc: 'Caramelo oscuro, nuez moscada y chocolate amargo. La expresión más pura del altiplano guatemalteco en cada sorbo.',
                  tag: 'Lavado',
                },
              ].map((o, i) => (
                <div key={o.name} className={`origin-item reveal${i > 0 ? ` reveal-delay-${i}` : ''}`}>
                  <p className="origin-country">{o.country}</p>
                  <h3 className="origin-name">{o.name}</h3>
                  <p className="origin-desc">{o.desc}</p>
                  <span className="origin-tag">{o.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* QUOTE */}
        <section className="quote-section">
          <blockquote className="quote-text reveal">
            El café extraordinario no es un lujo. Es la única forma honesta de empezar el día.
          </blockquote>
          <p className="quote-author reveal reveal-delay-1">— Fundadores, Obsidian Coffee</p>
        </section>

        {/* CTA */}
        <section className="cta-section" id="contacto">
          <div className="cta-inner">
            <div className="cta-copy reveal">
              <p className="section-label">Únete a la lista</p>
              <h2 className="section-title">Sé el primero<br /><em>en saberlo</em></h2>
              <p>
                Nuevos orígenes, lotes limitados y lanzamientos exclusivos.
                Sin spam. Solo café extraordinario cuando aparece.
              </p>
            </div>
            <div className="cta-form reveal reveal-delay-2">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <input type="text" placeholder="Tu nombre" required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Tu correo electrónico" required />
                </div>
                {submitted ? (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled
                    style={{
                      width: '100%',
                      border: '1px solid var(--amber)',
                      cursor: 'default',
                      background: 'rgba(200,120,26,0.3)',
                      color: 'var(--cream)',
                    }}
                  >
                    ✓ ¡Listo! Te avisamos.
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', border: 'none', cursor: 'pointer' }}
                  >
                    Suscribirme
                  </button>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="nav-logo">OBSIDIAN<span style={{ color: 'var(--amber)' }}>.</span></a>
              <p>
                Café de especialidad tostado en pequeños lotes. Porque el café que bebes
                cada mañana merece la misma atención que el vino que guardas para ocasiones especiales.
              </p>
            </div>
            <div className="footer-col">
              <h4>Tienda</h4>
              <ul>
                <li><a href="#">Suscripciones</a></li>
                <li><a href="#">Lotes únicos</a></li>
                <li><a href="#">Equipo de barismo</a></li>
                <li><a href="#">Gift cards</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Empresa</h4>
              <ul>
                <li><a href="#">Nuestra historia</a></li>
                <li><a href="#">Productores</a></li>
                <li><a href="#">Sostenibilidad</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contacto</h4>
              <ul>
                <li><a href="#">hola@obsidian.coffee</a></li>
                <li><a href="#">Instagram</a></li>
                <li><a href="#">WhatsApp</a></li>
                <li><a href="#">Distribuidores</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Obsidian Coffee. Todos los derechos reservados.</span>
            <span>Tostado con obsesión — Entregado con precisión.</span>
          </div>
        </footer>

      </div>
    </>
  )
}
