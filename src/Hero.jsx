import { useEffect, useRef } from "react";

function Hero() {
  const heroRef = useRef(null);
  const canvasRef = useRef(null);
  const ropeRef = useRef(null);
  const strandRef = useRef(null);
  const anchorRef = useRef(null);
  const tipRef = useRef(null);
  const astroImgRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    if (!hero || !canvas) return;

    const ctx = canvas.getContext("2d");
    const rope = ropeRef.current;
    const strand = strandRef.current;
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    const astroImg = astroImgRef.current;
    const layers = Array.from(document.querySelectorAll("[data-depth]"));

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(pointer: fine)");

    /* ---------------- stars ---------------- */
    const COLORS = [
      "255,255,255",
      "255,255,255",
      "255,255,255",
      "190,215,255",
      "255,200,240",
      "205,195,255",
    ];
    let w = 0,
      h = 0,
      stars = [],
      shot = null,
      nextShot = performance.now() + 3500;

    function buildStars() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(450, Math.max(90, Math.round((w * h) / 4200)));
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.3 + depth * depth * 1.5,
          alpha: 0.35 + depth * 0.5,
          amp: 0.2 + Math.random() * 0.5,
          speed: 0.6 + Math.random() * 2.6,
          phase: Math.random() * Math.PI * 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          drift: 0.4 + depth * 2.2,
        };
      });
    }

    function drawStars(now, dt, animate) {
      ctx.clearRect(0, 0, w, h);
      const t = now / 1000;
      for (const s of stars) {
        if (animate) {
          s.x -= s.drift * 2 * (dt / 1000);
          if (s.x < -4) s.x = w + 4;
        }
        const a = Math.min(
          1,
          Math.max(
            0.05,
            s.alpha +
              (animate ? Math.sin(t * s.speed + s.phase) * s.amp : 0),
          ),
        );
        ctx.fillStyle = `rgba(${s.color},${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.1) {
          ctx.fillStyle = `rgba(${s.color},${a * 0.12})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (!animate) return;

      if (!shot && now > nextShot) {
        const speed = 700 + Math.random() * 400;
        shot = {
          x: w * (0.45 + Math.random() * 0.55),
          y: Math.random() * h * 0.35,
          vx: -speed,
          vy: speed * 0.45,
          life: 1,
        };
        nextShot = now + 5000 + Math.random() * 7000;
      }
      if (shot) {
        shot.x += shot.vx * (dt / 1000);
        shot.y += shot.vy * (dt / 1000);
        shot.life -= dt / 900;
        if (shot.life <= 0 || shot.x < -100 || shot.y > h + 100) {
          shot = null;
          return;
        }
        const mag = Math.hypot(shot.vx, shot.vy);
        const tx = shot.x - (shot.vx / mag) * 140;
        const ty = shot.y - (shot.vy / mag) * 140;
        const g = ctx.createLinearGradient(shot.x, shot.y, tx, ty);
        g.addColorStop(0, `rgba(255,255,255,${shot.life})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(shot.x, shot.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    }

    /* ---------------- parallax (fine pointers only) ---------------- */
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0;
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    hero.addEventListener("pointerleave", () => {
      tx = 0;
      ty = 0;
    });

    function parallax() {
      if (!fine.matches || reduce.matches) return;
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      for (const el of layers) {
        const d = Number(el.dataset.depth);
        el.style.transform = `translate3d(${(cx * d).toFixed(2)}px, ${(cy * d).toFixed(2)}px, 0)`;
      }
    }

    /* ---------------- tether rope ---------------- */
    function updateRope(now) {
      const r = hero.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      const x0 = a.left - r.left,
        y0 = a.top - r.top;
      const x1 = t.left - r.left,
        y1 = t.top - r.top;
      const len = Math.max(Math.hypot(x1 - x0, y1 - y0), 80);
      const wave = reduce.matches ? 0 : Math.sin(now / 2600) * len * 0.05;
      const d = `M${x0.toFixed(1)} ${y0.toFixed(1)} C${(x0 + len * 0.1 + wave).toFixed(1)} ${(y0 + len * 0.42).toFixed(1)} ${(x1 - len * 0.16 - wave).toFixed(1)} ${(y1 - len * 0.38).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      const sw = Math.max(1.6, astroImg.offsetWidth * 0.011);
      rope.setAttribute("d", d);
      rope.setAttribute("stroke-width", sw.toFixed(2));
      strand.setAttribute("d", d);
      strand.setAttribute("stroke-width", (sw * 0.55).toFixed(2));
      strand.setAttribute(
        "stroke-dasharray",
        `${(sw * 0.7).toFixed(2)} ${(sw * 1.1).toFixed(2)}`,
      );
    }

    /* ---------------- one loop drives everything ---------------- */
    let raf = 0,
      last = 0,
      inView = true;

    function tick(now) {
      const dt = Math.min(now - last, 50);
      last = now;
      parallax();
      drawStars(now, dt, true);
      updateRope(now);
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (raf || reduce.matches || !inView || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function refresh() {
      buildStars();
      updateRope(0);
      if (reduce.matches) drawStars(0, 0, false);
      else start();
    }

    let resizeTimer = 0;
    new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refresh, 150); // avoids star reshuffle while mobile toolbars animate
      updateRope(0);
    }).observe(hero);

    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      inView ? start() : stop();
    }).observe(hero);
    document.addEventListener("visibilitychange", () =>
      document.hidden ? stop() : start(),
    );
    reduce.addEventListener("change", () => {
      stop();
      refresh();
    });

    refresh();

    // cleanup
    return () => {
      stop();
    };
  }, []);

  return (
    <>
      {/* site-wide cosmic backdrop (CSS only) */}
      <div className="cosmos" aria-hidden="true">
        <div className="cosmos__clouds"></div>
        <div className="cosmos__vignette"></div>
        <div className="cosmos__grain"></div>
      </div>

      <main>
        <section id="top" className="hero" aria-labelledby="hero-title" ref={heroRef}>
          <div className="hero-haze" aria-hidden="true"></div>
          <canvas id="hero-stars" className="hero-stars" ref={canvasRef} aria-hidden="true"></canvas>

          {/* Earth */}
          <div className="hero-earth" data-depth="-8" aria-hidden="true">
            <img
              src="/images/earth.webp"
              alt=""
              width="1720"
              height="1734"
              fetchPriority="high"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Space station (static) */}
          <div className="hero-station" aria-hidden="true">
            <img
              src="/images/station.webp"
              alt=""
              width="600"
              height="192"
              fetchPriority="high"
              loading="eager"
              decoding="async"
            />
            <span className="hero-station__anchor" data-tether-anchor ref={anchorRef}></span>
          </div>

          <div className="hero-scrim" aria-hidden="true"></div>

          {/* Tether rope: redrawn every frame from the station anchor to the astronaut's tether tip */}
          <svg
            className="hero-tether"
            width="100%"
            height="100%"
            aria-hidden="true"
            focusable="false"
          >
            <path
              id="rope-path"
              fill="none"
              stroke="#c0699a"
              strokeLinecap="round"
              ref={ropeRef}
            ></path>
            <path
              id="rope-strand"
              fill="none"
              stroke="rgba(255,214,236,.6)"
              strokeLinecap="round"
              ref={strandRef}
            ></path>
          </svg>

          {/* Astronaut */}
          <div className="hero-astro" data-depth="22" aria-hidden="true">
            <div className="astro-glow"></div>
            <div className="astro-drift">
              <div className="astro-swing">
                <div className="astro-tumble">
                  <img
                    src="/images/astronaut.webp"
                    alt=""
                    width="518"
                    height="587"
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    ref={astroImgRef}
                  />
                  <span className="hero-astro__tip" data-tether-tip ref={tipRef}></span>
                </div>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="hero-copy">
            <div className="hero-copy-inner">
              <span className="hero-copy-glow" aria-hidden="true"></span>

              <div className="soon-chip">
                <span className="soon-dot" aria-hidden="true"></span>
                <span className="sr-only">Coming soon</span>
                <span className="soon-letters" aria-hidden="true">
                  <span style={{ "--n": 0 }}>C</span>
                  <span style={{ "--n": 1 }}>O</span>
                  <span style={{ "--n": 2 }}>M</span>
                  <span style={{ "--n": 3 }}>I</span>
                  <span style={{ "--n": 4 }}>N</span>
                  <span style={{ "--n": 5 }}>G</span>
                  <span className="gap"></span>
                  <span style={{ "--n": 7 }}>S</span>
                  <span style={{ "--n": 8 }}>O</span>
                  <span style={{ "--n": 9 }}>O</span>
                  <span style={{ "--n": 10 }}>N</span>
                </span>
              </div>

              <h1 id="hero-title" className="rise" style={{ "--i": 1 }}>
                Make your brand
                <br />
                impossible to
                <br />
                <span className="grad">scroll past.</span>
              </h1>

              <p className="lead rise" style={{ "--i": 3 }}>
                Galacticos Media plans, shoots, and runs the social, search, and
                paid campaigns that turn attention into customers.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default Hero;
