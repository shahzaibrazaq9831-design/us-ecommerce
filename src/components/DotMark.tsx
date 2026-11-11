"use client";
// remove if you're not using Next.js
import { useEffect, useRef } from "react";

/**
 * DotMark – fine dotted text with a cursor ball + ring.
 * Near the cursor the dots scatter messily (drifting upward) so the letters
 * become unreadable, then slowly re-arrange into the text.
 *
 *   <DotMark text="YOUR STORE" height={180} />
 */
interface Dot {
  ox: number;
  oy: number;
  x: number;
  y: number;
  k: number;
  rx: number;
  ry: number;
  back: number;
  sx: number; // intro start x
  sy: number; // intro start y
  idelay: number; // intro stagger delay
  ialpha: number; // intro alpha
}

export default function DotMark({
  text = "DAMSA COTURE",
  height = 160, // canvas height
  stretch = true, // true = letters grow taller to fill the height
  fontFamily = "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
  fontWeight = 900,
  gap = 3,
  dotSize = 0.7,
  color = "#b8b8b8",
  radius = 75, // area of influence
  spread = 160, // how far dots fly
  messy = 1, // random scatter amount (0 = clean push, 1.5 = very messy)
  upward = 160, // extra upward drift of scattered dots
  spreadEase = 0.09, // speed dots move OUT
  returnEase = 0.032, // speed dots come BACK (lower = slower re-arrange)
  mouseEase = 0.2, // how smoothly ball/ring follow the mouse
  showRing = true,
  ringSize = 22,
  ballSize = 3.5, // black ball at the cursor
  ringColor = "#111",
  ballColor = "#111",
  style = {},
  intro = true,
  introEase = 0.06, // movement speed toward the text; lower = slower
  introStagger = 500, // ms, total stagger window left→right
  introDistance = 300, // px, how far dots start from their origin
  replay = false, // replay intro each time the section re-enters viewport
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let dots: Dot[] = [];
    let w = 0,
      h = 0,
      dpr = 1;
    let raf: number | undefined;
    /** True while the canvas is on screen — the loop only runs then. */
    let inView = false;
    /** True while the tab is in the foreground. */
    let pageVisible = true;
    /** True while the pointer/touch listeners are attached. */
    let listenersAttached = false;
    const target = { x: -9999, y: -9999 };
    const mouse = { x: -9999, y: -9999 };
    let ringAlpha = 0;
    let inside = false;

    // Intro state
    let introActive = false;
    let introFinished = false;
    let introStartTime = 0;
    let io: IntersectionObserver | undefined;
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const skipIntro = !intro || reducedMotion;

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap.clientWidth;
      h = height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";

      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const o = off.getContext("2d");
      if (!o) return;
      let size = h;
      o.font = `${fontWeight} ${size}px ${fontFamily}`;
      size = Math.min(
        h * 0.95,
        size * (w / o.measureText(text).width) * 0.98
      );
      o.font = `${fontWeight} ${size}px ${fontFamily}`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      // stretch letters vertically so they fill the full height
      const capH = size * 0.72;
      const scaleY = stretch ? Math.max(1, (h * 0.9) / capH) : 1;
      o.translate(w / 2, h / 2);
      o.scale(1, scaleY);
      o.fillText(text, 0, 0);

      const data = o.getImageData(0, 0, w, h).data;
      dots = [];
      const midX = w / 2;
      for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap) {
          if (data[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 128) {
            const isLeft = x < midX;
            const dist = introDistance * 0.5 + Math.random() * introDistance; // ~150–450px
            const sx = isLeft ? x - dist : x + dist;
            const sy = y + (Math.random() * 80 - 40); // +/- 40px
            dots.push({
              ox: x,
              oy: y,
              x: skipIntro ? x : sx,
              y: skipIntro ? y : sy,
              k: 0.35 + Math.random() * 1.0, // per-dot strength
              rx: Math.random() * 2 - 1, // fixed random scatter
              ry: Math.random() * 2 - 1,
              back: 0.4 + Math.random() * 1.2, // per-dot return speed
              sx,
              sy,
              idelay: 0, // set below
              ialpha: skipIntro ? 1 : 0.3,
            });
          }
        }
      }
      // Stagger delay left → right (0 to introStagger ms)
      const sorted = [...dots].sort((a, b) => a.ox - b.ox);
      const n = sorted.length;
      sorted.forEach((d, i) => {
        d.idelay = n > 1 ? (i / (n - 1)) * introStagger : 0;
      });
    };

    const startIntro = () => {
      if (skipIntro) return;
      if (introFinished && !replay) return;
      introActive = true;
      introFinished = false;
      introStartTime = performance.now();
      dots.forEach((d) => {
        d.x = d.sx;
        d.y = d.sy;
        d.ialpha = 0.3;
      });
    };

    const frame = () => {
      raf = undefined;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (intro && !reducedMotion && !introFinished && introActive) {
        // ---- Intro phase: dots fly in from left/right ----
        const now = performance.now();
        let allDone = true;

        for (const d of dots) {
          const start = introStartTime + d.idelay;
          if (now < start) {
            // Waiting for its stagger delay — stay at start pos, low alpha
            d.ialpha = 0.3;
            allDone = false;
            continue;
          }
          // Move toward origin (exponential ease-out)
          d.x += (d.ox - d.x) * introEase;
          d.y += (d.oy - d.y) * introEase;
          const dx = d.ox - d.x;
          const dy = d.oy - d.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1.5) {
            d.x = d.ox;
            d.y = d.oy;
            d.ialpha = 1;
          } else {
            allDone = false;
            // Fade in as it approaches its final spot
            const progress = 1 - dist / introDistance;
            d.ialpha = 0.3 + 0.7 * Math.min(1, Math.max(0, progress));
          }
        }

        if (allDone) {
          introFinished = true;
          introActive = false;
          dots.forEach((d) => {
            d.x = d.ox;
            d.y = d.oy;
            d.ialpha = 1;
          });
        }

        // Draw intro dots only — cursor ring/ball stay hidden until intro ends
        ctx.fillStyle = color;
        ctx.beginPath();
        for (const d of dots) {
          ctx.globalAlpha = d.ialpha;
          ctx.moveTo(d.x + dotSize, d.y);
          ctx.arc(d.x, d.y, dotSize, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.globalAlpha = 1;

        schedule();
        return;
      }

      // ---- Normal phase: mouse scatter + return ----
      mouse.x += (target.x - mouse.x) * mouseEase;
      mouse.y += (target.y - mouse.y) * mouseEase;

      ctx.fillStyle = color;
      const r2 = radius * radius;
      ctx.beginPath();
      for (const d of dots) {
        let tx = d.ox,
          ty = d.oy,
          ease = returnEase * d.back;

        const dx = d.ox - mouse.x;
        const dy = d.oy - mouse.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < r2) {
          const dist = Math.sqrt(dist2) || 0.01;
          const t = 1 - dist / radius;
          const push = t * spread * d.k;
          // away from the mouse + random mess + upward drift
          tx =
            d.ox + (dx / dist) * push + d.rx * spread * 0.7 * messy * t;
          ty =
            d.oy +
            (dy / dist) * push +
            d.ry * spread * 0.7 * messy * t -
            upward * t * d.k;
          ease = spreadEase;
        }
        d.x += (tx - d.x) * ease;
        d.y += (ty - d.y) * ease;

        ctx.moveTo(d.x + dotSize, d.y);
        ctx.arc(d.x, d.y, dotSize, 0, Math.PI * 2);
      }
      ctx.fill();

      // cursor ring + black ball
      ringAlpha += ((inside ? 1 : 0) - ringAlpha) * 0.15;
      if (showRing && ringAlpha > 0.01) {
        ctx.globalAlpha = ringAlpha;
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, ringSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = ballColor;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, ballSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      schedule();
    };

    /**
     * Queue the next frame — but only while the canvas is actually on screen
     * and the tab is visible. The canvas holds thousands of dots, so running
     * this loop for the whole life of the page cost every visitor a steady
     * stream of layout and paint work while they were scrolling the shop.
     */
    const schedule = () => {
      if (raf === undefined && inView && pageVisible) {
        raf = requestAnimationFrame(frame);
      }
    };

    /** Stop the loop completely (canvas hidden or tab in the background). */
    const stopLoop = () => {
      if (raf !== undefined) {
        cancelAnimationFrame(raf);
        raf = undefined;
      }
    };

    const onLeave = () => {
      inside = false;
      target.x = target.y = mouse.x = mouse.y = -9999;
    };
    const setPos = (cx: number, cy: number) => {
      const r = canvas.getBoundingClientRect();
      const x = cx - r.left;
      const y = cy - r.top;
      // only react while the pointer is over the text area
      if (x < 0 || y < 0 || x > r.width || y > r.height) {
        if (inside) onLeave();
        return;
      }
      target.x = x;
      target.y = y;
      if (!inside) {
        mouse.x = x;
        mouse.y = y;
      }
      inside = true;
    };
    const onMove = (e: MouseEvent) => setPos(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) setPos(touch.clientX, touch.clientY);
    };

    /**
     * The pointer listeners are only needed while the canvas is on screen.
     * `touchmove` in particular ran a layout read on every touch event of
     * every scroll on the page, which is what made scrolling feel sticky.
     */
    const attachPointerListeners = () => {
      if (listenersAttached) return;
      listenersAttached = true;
      window.addEventListener("mousemove", onMove);
      window.addEventListener("touchmove", onTouch, { passive: true });
      window.addEventListener("touchend", onLeave);
      document.addEventListener("mouseleave", onLeave);
    };

    const detachPointerListeners = () => {
      if (!listenersAttached) return;
      listenersAttached = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onLeave);
      document.removeEventListener("mouseleave", onLeave);
      onLeave();
    };

    build();
    document.fonts?.ready.then(build);

    // IntersectionObserver: trigger intro when the wrapper enters the viewport
    if (intro && !reducedMotion) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startIntro();
            }
          });
        },
        { threshold: 0.25 }
      );
      io.observe(wrap);
    }

    // Visibility observer: the draw loop only runs while the canvas is on
    // screen, so the page pays nothing for it while the visitor is in the
    // shop.
    const viewObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (inView) {
            attachPointerListeners();
            schedule();
          } else {
            detachPointerListeners();
            stopLoop();
          }
        });
      },
      { threshold: 0 }
    );
    viewObserver.observe(wrap);

    // Stop drawing when the tab is hidden — a background tab has no reason
    // to burn a frame budget.
    const onVisibilityChange = () => {
      pageVisible = document.visibilityState === "visible";
      if (pageVisible) schedule();
      else stopLoop();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const ro = new ResizeObserver(build);
    ro.observe(wrap);

    return () => {
      stopLoop();
      io?.disconnect();
      viewObserver.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      detachPointerListeners();
    };
  }, [
    text,
    height,
    stretch,
    fontFamily,
    fontWeight,
    gap,
    dotSize,
    color,
    radius,
    spread,
    messy,
    upward,
    spreadEase,
    returnEase,
    mouseEase,
    showRing,
    ringSize,
    ballSize,
    ringColor,
    ballColor,
    intro,
    introEase,
    introStagger,
    introDistance,
    replay,
  ]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
