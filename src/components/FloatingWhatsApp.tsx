"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./FloatingWhatsApp.module.css";

const WHATSAPP_NUMBER = "447476469395";
const WHATSAPP_MESSAGE =
  "Hello Damsa Couture, I would like some styling assistance.";

const BUTTON_SIZE = 56;
const EDGE_GAP = 20;
const DRAG_THRESHOLD = 6;
const SNAP_DURATION_MS = 250;
const HIDE_DURATION_MS = 250;
const TARGET_FADE_DURATION_MS = 200;
const TARGET_FADE_REDUCED_MS = 120;
const HIDE_TARGET_SIZE = 64;
const HIDE_TARGET_BOTTOM = 32;
const MAGNET_RADIUS = 70;
const HIDDEN_STORAGE_KEY = "floating-whatsapp-hidden";

type Position = { x: number; y: number };

type DragStart = {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  originX: number;
  originY: number;
};

type ButtonVisual = {
  transition: string;
  scale?: number;
  opacity?: number;
};

function viewport() {
  return {
    width: document.documentElement.clientWidth || window.innerWidth,
    height: window.innerHeight,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function clampPosition(position: Position): Position {
  const { width, height } = viewport();
  return {
    x: clamp(position.x, 0, width - BUTTON_SIZE),
    y: clamp(position.y, 0, height - BUTTON_SIZE),
  };
}

function defaultPosition(): Position {
  const { width, height } = viewport();
  return {
    x: Math.max(0, width - BUTTON_SIZE - EDGE_GAP),
    y: Math.max(0, height - BUTTON_SIZE - EDGE_GAP),
  };
}

function hideTargetCenter(): Position {
  const { width, height } = viewport();
  return {
    x: width / 2,
    y: height - HIDE_TARGET_BOTTOM - HIDE_TARGET_SIZE / 2,
  };
}

function whatsappUrl() {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE,
  )}`;
}

export default function FloatingWhatsApp() {
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);
  const [targetActive, setTargetActive] = useState(false);
  const [targetDropping, setTargetDropping] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const hideTargetRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<Position>({ x: 0, y: 0 });
  const renderPositionRef = useRef<Position>({ x: 0, y: 0 });
  const dragStartRef = useRef<DragStart | null>(null);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const lastBounceAtRef = useRef(0);
  const targetVisibleRef = useRef(false);
  const targetActiveRef = useRef(false);
  const coarsePointerRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const pendingFramePositionRef = useRef<Position | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyButtonVisual = useCallback(
    (position: Position, visual: ButtonVisual) => {
      const element = buttonRef.current;
      if (!element) return;
      const scale = visual.scale ?? 1;
      element.style.transition = visual.transition;
      element.style.transform =
        scale === 1
          ? `translate3d(${position.x}px, ${position.y}px, 0)`
          : `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`;
      element.style.opacity = String(visual.opacity ?? 1);
    },
    [],
  );

  const scheduleFrame = useCallback(
    (position: Position) => {
      pendingFramePositionRef.current = position;
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const next = pendingFramePositionRef.current;
        if (!next) return;
        applyButtonVisual(next, { transition: "none" });
      });
    },
    [applyButtonVisual],
  );

  const openWhatsApp = useCallback(() => {
    window.open(whatsappUrl(), "_blank", "noopener,noreferrer");
  }, []);

  const playBounce = useCallback(() => {
    const now = Date.now();
    if (now - lastBounceAtRef.current < 350) return;
    lastBounceAtRef.current = now;
    setBounceKey((key) => key + 1);
  }, []);

  const getHideTargetCenter = useCallback((): Position => {
    const rect = hideTargetRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return hideTargetCenter();
  }, []);

  const snapToEdge = useCallback(() => {
    const element = buttonRef.current;
    if (!element) return;

    const { width, height } = viewport();
    const current = renderPositionRef.current;
    const centerX = current.x + BUTTON_SIZE / 2;
    const target = {
      x: clamp(
        centerX < width / 2 ? EDGE_GAP : width - BUTTON_SIZE - EDGE_GAP,
        0,
        width - BUTTON_SIZE,
      ),
      y: clamp(current.y, 0, height - BUTTON_SIZE),
    };

    const reduceMotion = reduceMotionRef.current;
    element.style.transition = reduceMotion
      ? "none"
      : `transform ${SNAP_DURATION_MS}ms ease-out`;
    element.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
    positionRef.current = target;
    renderPositionRef.current = target;
  }, []);

  const hideButton = useCallback(() => {
    const element = buttonRef.current;
    if (!element) return;

    try {
      window.sessionStorage.setItem(HIDDEN_STORAGE_KEY, "1");
    } catch {
      // The button can still be hidden for this mount without storage.
    }

    const fadeTargetOut = () => {
      targetActiveRef.current = false;
      targetVisibleRef.current = false;
      setTargetActive(false);
      setTargetVisible(false);
    };

    if (reduceMotionRef.current) {
      element.style.transition = `opacity ${TARGET_FADE_REDUCED_MS}ms ease`;
      element.style.opacity = "0";
      hideTimerRef.current = setTimeout(() => {
        fadeTargetOut();
        unmountTimerRef.current = setTimeout(
          () => setHidden(true),
          TARGET_FADE_REDUCED_MS,
        );
      }, TARGET_FADE_REDUCED_MS);
      return;
    }

    const target = getHideTargetCenter();
    const finalPosition = {
      x: target.x - BUTTON_SIZE / 2,
      y: target.y - BUTTON_SIZE / 2,
    };
    element.style.transition = `transform ${HIDE_DURATION_MS}ms ease-in, opacity ${HIDE_DURATION_MS}ms ease-in`;
    element.style.transform = `translate3d(${finalPosition.x}px, ${finalPosition.y}px, 0) scale(0)`;
    element.style.opacity = "0";
    hideTimerRef.current = setTimeout(() => {
      fadeTargetOut();
      unmountTimerRef.current = setTimeout(
        () => setHidden(true),
        TARGET_FADE_DURATION_MS,
      );
    }, HIDE_DURATION_MS);
  }, [getHideTargetCenter]);

  const endDrag = useCallback(
    (event: PointerEvent, allowHide: boolean) => {
      const start = dragStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;

      const wasMoved = movedRef.current;
      const wasOverTarget = targetActiveRef.current && targetVisibleRef.current;
      const hideOnTarget =
        allowHide && wasOverTarget && coarsePointerRef.current;

      dragStartRef.current = null;
      setDragging(false);

      // Keep the target highlighted while the button shrinks into it; it fades
      // out after the hide animation.
      if (!wasMoved || !hideOnTarget) {
        targetVisibleRef.current = false;
        setTargetVisible(false);
        targetActiveRef.current = false;
        setTargetActive(false);
        setTargetDropping(false);
      }

      try {
        if (buttonRef.current?.hasPointerCapture(event.pointerId)) {
          buttonRef.current.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Pointer capture is unavailable in some browsers.
      }

      if (!wasMoved) return;

      // A drag still produces a click in some browsers; swallow that one.
      suppressClickRef.current = true;
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = setTimeout(() => {
        suppressClickRef.current = false;
      }, 400);

      if (hideOnTarget) {
        setTargetDropping(true);
        hideButton();
      } else {
        snapToEdge();
      }
    },
    [hideButton, snapToEdge],
  );

  useEffect(() => {
    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncPointer = () => {
      coarsePointerRef.current = coarseQuery.matches;
      setCoarsePointer(coarseQuery.matches);
    };
    const syncMotion = () => {
      reduceMotionRef.current = motionQuery.matches;
    };

    syncPointer();
    syncMotion();

    const position = clampPosition(defaultPosition());
    positionRef.current = position;
    renderPositionRef.current = position;
    applyButtonVisual(position, { transition: "none" });

    let shouldHide = false;
    try {
      shouldHide = window.sessionStorage.getItem(HIDDEN_STORAGE_KEY) === "1";
    } catch {
      // Ignore storage access errors.
    }

    if (shouldHide) {
      // Defer the state update out of the effect body; this also keeps the
      // button invisible until it is removed, so there is no flash.
      queueMicrotask(() => {
        setHidden(true);
        setReady(true);
      });
    } else {
      queueMicrotask(() => setReady(true));
    }

    const onResize = () => {
      const next = clampPosition(positionRef.current);
      positionRef.current = next;
      if (!dragStartRef.current) {
        renderPositionRef.current = next;
        applyButtonVisual(next, { transition: "none" });
      }
    };

    // A hidden button should be back on the next visit or full page reload.
    const clearHiddenState = () => {
      try {
        window.sessionStorage.removeItem(HIDDEN_STORAGE_KEY);
      } catch {
        // Ignore storage access errors.
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pagehide", clearHiddenState);
    window.addEventListener("beforeunload", clearHiddenState);
    coarseQuery.addEventListener?.("change", syncPointer);
    motionQuery.addEventListener?.("change", syncMotion);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pagehide", clearHiddenState);
      window.removeEventListener("beforeunload", clearHiddenState);
      coarseQuery.removeEventListener?.("change", syncPointer);
      motionQuery.removeEventListener?.("change", syncMotion);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    };
  }, [applyButtonVisual]);

  useEffect(() => {
    const timer = window.setTimeout(playBounce, 1800);
    return () => window.clearTimeout(timer);
  }, [playBounce]);

  useEffect(() => {
    if (!dragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - start.pointerX;
      const deltaY = event.clientY - start.pointerY;

      if (!movedRef.current) {
        if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;
        movedRef.current = true;
        suppressClickRef.current = true;
      }

      event.preventDefault();

      const raw = clampPosition({
        x: start.originX + deltaX,
        y: start.originY + deltaY,
      });
      positionRef.current = raw;

      let next = raw;

      if (coarsePointerRef.current && targetVisibleRef.current) {
        const center = {
          x: raw.x + BUTTON_SIZE / 2,
          y: raw.y + BUTTON_SIZE / 2,
        };
        const target = getHideTargetCenter();
        const distance = Math.hypot(center.x - target.x, center.y - target.y);
        const near = distance <= MAGNET_RADIUS;

        if (near && !reduceMotionRef.current) {
          // Pull the button toward the target center, strongest at the center.
          const pull = 0.45 * (1 - distance / MAGNET_RADIUS);
          next = clampPosition({
            x: center.x + (target.x - center.x) * pull - BUTTON_SIZE / 2,
            y: center.y + (target.y - center.y) * pull - BUTTON_SIZE / 2,
          });
        }

        if (near !== targetActiveRef.current) {
          targetActiveRef.current = near;
          setTargetActive(near);
          if (near) navigator.vibrate?.(10);
        }
      }

      renderPositionRef.current = next;
      scheduleFrame(next);
    };

    const handlePointerUp = (event: PointerEvent) => {
      endDrag(event, true);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      endDrag(event, false);
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [dragging, endDrag, getHideTargetCenter, scheduleFrame]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0) return;

    playBounce();

    if (suppressTimerRef.current) {
      clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = null;
    }

    // If the user grabs the button mid-snap, continue from where it is drawn.
    const element = buttonRef.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      const visual = clampPosition({ x: rect.left, y: rect.top });
      positionRef.current = visual;
      renderPositionRef.current = visual;
      applyButtonVisual(visual, { transition: "none" });
    }

    dragStartRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: positionRef.current.x,
      originY: positionRef.current.y,
    };
    movedRef.current = false;
    suppressClickRef.current = false;
    targetActiveRef.current = false;
    setTargetActive(false);
    setTargetDropping(false);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is unavailable in some browsers.
    }

    setDragging(true);

    if (coarsePointerRef.current) {
      targetVisibleRef.current = true;
      setTargetVisible(true);
    }
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    playBounce();
    openWhatsApp();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      playBounce();
      openWhatsApp();
    }
  };

  if (hidden) return null;

  return (
    <>
      {coarsePointer && (
        <div
          ref={hideTargetRef}
          className={`${styles.hideTarget}${
            targetVisible ? ` ${styles.hideTargetVisible}` : ""
          }${targetActive ? ` ${styles.hideTargetActive}` : ""}${
            targetDropping ? ` ${styles.hideTargetDropping}` : ""
          }`}
          aria-hidden="true"
        >
          <svg
            className={styles.hideTargetIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 3l18 18M21 3L3 21" />
          </svg>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        className={`${styles.button}${ready ? ` ${styles.ready}` : ""}${
          dragging ? ` ${styles.dragging}` : ""
        }`}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        draggable={false}
        aria-label="Chat on WhatsApp"
      >
        <span
          key={bounceKey}
          className={`${styles.buttonVisual}${
            bounceKey > 0 ? ` ${styles.bouncing}` : ""
          }`}
        >
          <svg
            className={styles.logo}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className={styles.onlineDot} aria-hidden="true" />
        </span>
      </button>
    </>
  );
}
