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
  phase: number; // idle drift offset
  idleSpeed: number; // idle drift speed
}

type Rgb = [number, number, number];

/** Read `#rgb` / `#rrggbb` into channels. Returns null for anything else. */
function parseColor(value: string): Rgb | null {
  const hex = value.trim().replace(/^#/, "");
  if (hex.length === 3) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
    ];
  }
  if (hex.length === 6) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  return null;
}

/** Blend two colours, `t` from 0 to 1. */
function mixColor(from: Rgb, to: Rgb, t: number): string {
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  return `rgb(${r} ${g} ${b})`;
}

export default function DotMark({
  text = "RUNG E BAHAR",
  height = 160, // canvas height (ignored when fillHeight is set)
  fillHeight = false, // take the height from CSS instead of the height prop
  anchor = "center", // "center" or "bottom" — where the wordmark sits in the box
  bandHeight = 0, // px height of the wordmark band for `anchor: "bottom"` (0 = from width)
  overscanX = 1, // bitmap width multiplier; >1 lets dots spread sideways
  overscanY = 1, // bitmap height multiplier; >1 lets dots spread above/below
  stretch = true, // true = letters grow taller to fill the height
  fontFamily = "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
  fontWeight = 900,
  gap = 3,
  dotSize = 0.7,
  color = "#b8b8b8",
  colorTo = "", // optional end colour; the dots blend toward it as the mark scrolls in
  radius = 75, // area of influence
  spread = 160, // how far dots fly
  messy = 1, // random scatter amount (0 = clean push, 1.5 = very messy)
  upward = 160, // extra upward drift of scattered dots
  spreadEase = 0.09, // speed dots move OUT
  returnEase = 0.032, // speed dots come BACK (lower = slower re-arrange)
  idle = 0, // px of slow breathing drift so the mark keeps moving at rest
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
  headroom = 0, // px of empty space above the text for upward drift
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
    /** Re-armed while the wordmark is off screen so `replay` can run again. */
    let introArmed = true;
    /** How far the footer has scrolled into view (0–1) — drives the colour. */
    let colorProgress = 0;
    let colorTarget = 0;
    /** Height of the wordmark band, refreshed on every build. */
    let band = 0;
    /** Distance over which dots fade in during the intro. */
    let fadeDistance = 300;
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const skipIntro = !intro || reducedMotion;
    const colorFrom = parseColor(color);
    const colorEnd = parseColor(colorTo || color);
    const scrollColor = Boolean(colorTo && colorFrom && colorEnd);

    const build = () => {
      const viewW = wrap.clientWidth;
      // With `fillHeight` the wrapper's CSS height drives the canvas, so the
      // wordmark can be short on phones and tall on a desktop without ever
      // leaving a blank band above or below the letters.
      const viewH = fillHeight ? Math.max(1, wrap.clientHeight) : height;
      // The footer can still be unlaid out (width 0) when this runs from a
      // ResizeObserver or a font swap. Drawing into a zero-width canvas
      // throws, which killed the effect and left the footer blank. The
      // ResizeObserver fires again once the footer has a real width.
      if (viewW <= 0 || viewH <= 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      // The bitmap is deliberately larger than the visible box. The letters
      // stay in the visible box, but the extra room lets particles spread
      // above and beside the wordmark instead of being trapped in one strip.
      w = Math.max(1, Math.round(viewW * overscanX));
      h = Math.max(1, Math.round(viewH * overscanY));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.style.position = "absolute";
      canvas.style.left = (viewW - w) / 2 + "px";
      canvas.style.top = (viewH - h) / 2 + "px";

      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const o = off.getContext("2d");
      if (!o) return;
      // The wordmark lives in a band, not the whole canvas: with
      // `anchor="bottom"` it is pinned to the bottom edge (like the reference
      // footer) while the rest of the box stays open for the dots to spread
      // through. The band is derived from the width using the same clamp as
      // the footer's bottom padding, so the letters never run into the
      // copyright row on phones or ultra-wide screens.
      const pad = Math.max(74, Math.min(viewW * 0.105, 178));
      band =
        anchor === "bottom"
          ? Math.max(
              56,
              Math.min(bandHeight > 0 ? bandHeight : pad - 18, viewH * 0.5)
            )
          : Math.max(1, viewH - headroom);
      // Measure once at a reference size, then scale the letters to the full
      // width. That is what removes the empty side margins: the wordmark
      // always reaches both edges, and the vertical stretch fills the band.
      const refSize = 100;
      o.font = `${fontWeight} ${refSize}px ${fontFamily}`;
      const refWidth = Math.max(1, o.measureText(text).width);
      const widthFit = (viewW * 0.98 * refSize) / refWidth;
      const heightFit = (band * 0.95) / 0.72;
      const size = stretch ? widthFit : Math.min(widthFit, heightFit);
      o.font = `${fontWeight} ${size}px ${fontFamily}`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      // stretch letters vertically so they fill the band
      const capH = size * 0.72;
      const scaleY = stretch ? Math.max(0.1, (band * 0.94) / capH) : 1;
      // The canvas is centred on the box, so the box bottom in bitmap
      // coordinates is (h + viewH) / 2. Pin the band there for `bottom`.
      const centerY =
        anchor === "bottom"
          ? (h + viewH) / 2 - band / 2 - 6
          : h / 2 + headroom / 2;
      o.translate(w / 2, centerY);
      o.scale(1, scaleY);
      o.fillText(text, 0, 0);

      const data = o.getImageData(0, 0, w, h).data;
      dots = [];
      fadeDistance = Math.max(introDistance, Math.hypot(w, h) * 0.75);
      // Keep the dot count sane on very large canvases: the footer canvas is
      // the whole footer, so a fixed 3px grid would produce tens of
      // thousands of dots on a desktop and drop frames while scrolling.
      const gridGap = Math.max(gap, Math.round(Math.sqrt((w * h) / 260000)));
      for (let y = 0; y < h; y += gridGap) {
        for (let x = 0; x < w; x += gridGap) {
          if (data[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 128) {
            // Every dot starts somewhere in the canvas — a loose cloud that
            // gathers into the wordmark rather than sliding in from one side.
            const sx = Math.random() * w;
            const sy = Math.random() * h;
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
              phase: Math.random() * Math.PI * 2,
              idleSpeed: 0.5 + Math.random(),
            });
          }
        }
      }
      // Stagger delay left → right (0 to introStagger ms). A cloud join looks
      // better with no stagger, so the sort is skipped when it is zero.
      if (introStagger > 0) {
        const sorted = [...dots].sort((a, b) => a.ox - b.ox);
        const n = sorted.length;
        sorted.forEach((d, i) => {
          d.idelay = n > 1 ? (i / (n - 1)) * introStagger : 0;
        });
      }
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

    /** Throw the dots back into a fresh cloud in the open canvas. */
    const scatter = () => {
      dots.forEach((d) => {
        d.sx = Math.random() * w;
        d.sy = Math.random() * h;
        d.x = d.sx;
        d.y = d.sy;
        d.ialpha = 0.3;
      });
    };

    /**
     * The intro (and the colour shift) is driven by the wordmark band, not by
     * the whole footer: on tall footers the bottom band is the last thing to
     * appear, so the dots gather when the wordmark itself is on screen and
     * re-spread after it has scrolled away again.
     */
    const readScroll = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const bandPx = band || Math.max(64, Math.min(rect.width * 0.105, 180));
      const visible = Math.max(
        0,
        Math.min(vh, rect.bottom) - Math.max(0, rect.bottom - bandPx)
      );
      colorTarget = Math.min(1, visible / (bandPx * 0.85));
      if (visible > 16) {
        if (introArmed) {
          introArmed = false;
          startIntro();
        }
      }
      // When the band is not on screen we deliberately do nothing: the intro
      // is re-armed (and the dots re-scattered) only once the whole footer
      // has left the viewport, so a small scroll back and forth can never
      // restart the gather mid-animation.
    };

    const frame = () => {
      raf = undefined;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const now = performance.now();

      // Blend the dot colour as the wordmark scrolls into view. The loop only
      // runs while the footer is on screen, so this is a cheap, smooth
      // scroll-linked transition rather than a jittery one.
      if (scrollColor && colorFrom && colorEnd) {
        colorProgress += (colorTarget - colorProgress) * 0.07;
      }
      const fillColor =
        scrollColor && colorFrom && colorEnd
          ? mixColor(colorFrom, colorEnd, colorProgress)
          : color;

      if (intro && !reducedMotion && !introFinished && introActive) {
        // ---- Intro phase: the loose cloud gathers into the wordmark ----
        let allDone = true;

        for (const d of dots) {
          const start = introStartTime + d.idelay;
          if (now < start) {
            // Waiting for its stagger delay — stay at start pos, low alpha
            d.ialpha = 0.3;
            allDone = false;
            continue;
          }
          // Move toward origin (exponential ease-out). Slightly different
          // speed per dot keeps the cloud from snapping together as one block.
          const ease = Math.min(0.16, introEase * d.back);
          d.x += (d.ox - d.x) * ease;
          d.y += (d.oy - d.y) * ease;
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
            const progress = 1 - dist / fadeDistance;
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
        ctx.fillStyle = fillColor;
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

      // The footer is on screen but the wordmark band is not visible yet.
      // Hold the cloud roughly where it is — otherwise the normal-phase
      // easing would quietly gather the dots before the reveal is seen — but
      // let it breathe so the footer does not look like a frozen speckle.
      if (intro && !reducedMotion && !introFinished) {
        const t = now * 0.00022;
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        for (const d of dots) {
          const a = t * d.idleSpeed + d.phase;
          const drift = 7 + d.k * 7; // 7–14px, enough to feel alive
          const px = d.x + Math.sin(a) * drift;
          const py = d.y + Math.cos(a * 0.8) * drift;
          ctx.moveTo(px + dotSize, py);
          ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        }
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
        schedule();
        return;
      }

      // ---- Normal phase: mouse scatter + return ----
      mouse.x += (target.x - mouse.x) * mouseEase;
      mouse.y += (target.y - mouse.y) * mouseEase;

      ctx.fillStyle = fillColor;
      const r2 = radius * radius;
      ctx.beginPath();
      for (const d of dots) {
        let tx = d.ox,
          ty = d.oy,
          ease = returnEase * d.back;

        // A very slow breathing drift keeps the finished wordmark alive
        // instead of freezing it into a static image.
        if (idle) {
          const t = now * 0.00022 * d.idleSpeed + d.phase;
          tx += Math.sin(t) * idle;
          ty += Math.cos(t * 0.8) * idle;
        }

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
      window.addEventListener("scroll", readScroll, { passive: true });
      document.addEventListener("mouseleave", onLeave);
      // The footer may already be on screen (reload at the bottom of a page),
      // so evaluate the reveal once as soon as we start watching it.
      readScroll();
    };

    const detachPointerListeners = () => {
      if (!listenersAttached) return;
      listenersAttached = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onLeave);
      window.removeEventListener("scroll", readScroll);
      document.removeEventListener("mouseleave", onLeave);
      onLeave();
    };

    build();
    document.fonts?.ready.then(build);

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
            if (replay) {
              introFinished = false;
              introArmed = true;
              scatter();
            }
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
      viewObserver.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      detachPointerListeners();
    };
  }, [
    text,
    height,
    fillHeight,
    anchor,
    bandHeight,
    overscanX,
    overscanY,
    stretch,
    fontFamily,
    fontWeight,
    gap,
    dotSize,
    color,
    colorTo,
    radius,
    spread,
    messy,
    upward,
    spreadEase,
    returnEase,
    idle,
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
    headroom,
  ]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        // The canvas is absolutely positioned so it can be larger than this
        // box. The footer clips it; this wrapper must not.
        height: fillHeight ? undefined : height,
        overflow: "visible",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", position: "absolute", pointerEvents: "none" }}
      />
    </div>
  );
}
