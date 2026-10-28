"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { siteConfig } from "@/data/site";

const POSITION_STORAGE_KEY = "damsa-whatsapp-widget";
const WIDGET_SIZE = 60;
const COMPACT_DELAY_MS = 3500;
const INTRO_DELAY_MS = 1400;
const INTRO_DURATION_MS = 800;

function isMobileViewport(): boolean {
  return window.innerWidth <= 1023;
}

function storageKey(isMobile = isMobileViewport()): string {
  return `${POSITION_STORAGE_KEY}-${isMobile ? "mobile" : "desktop"}`;
}

interface WidgetState {
  x: number;
  y: number;
  hidden: boolean;
}

interface DragStart {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  widgetX: number;
  widgetY: number;
}

function getChatPanelPosition(widget: WidgetState): { left: number; top: number } {
  const width = Math.min(360, window.innerWidth - 24);
  const height = Math.min(420, window.innerHeight - 24);
  const left = Math.max(
    12,
    Math.min(widget.x + WIDGET_SIZE - width, window.innerWidth - width - 12)
  );
  const top =
    widget.y >= height + 12
      ? widget.y - height - 12
      : Math.min(widget.y + WIDGET_SIZE + 12, window.innerHeight - height - 12);
  return { left, top };
}

function defaultPosition(): WidgetState {
  const size = isMobileViewport() ? 52 : WIDGET_SIZE;
  const bottomGap = isMobileViewport() ? 20 : 24;
  return {
    x: Math.max(8, window.innerWidth - size - 24),
    y: Math.max(8, window.innerHeight - size - bottomGap),
    hidden: false,
  };
}

function clampPosition(x: number, y: number): Pick<WidgetState, "x" | "y"> {
  return {
    x: Math.max(8, Math.min(x, window.innerWidth - WIDGET_SIZE - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - WIDGET_SIZE - 8)),
  };
}

function readWidgetState(): WidgetState {
  try {
    const saved = localStorage.getItem(storageKey());
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<WidgetState>;
      const position = clampPosition(
        typeof parsed.x === "number" ? parsed.x : defaultPosition().x,
        typeof parsed.y === "number" ? parsed.y : defaultPosition().y
      );
      return { ...position, hidden: parsed.hidden === true };
    }
  } catch {
    return defaultPosition();
  }
  return defaultPosition();
}

export default function WhatsAppFloat() {
  const [widget, setWidget] = useState<WidgetState>({ x: 0, y: 0, hidden: false });
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(false);
  const [intro, setIntro] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hideTargetActive, setHideTargetActive] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const dragStartRef = useRef<DragStart | null>(null);
  const draggedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const hideTargetRef = useRef<HTMLDivElement>(null);
  const mobileViewportRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mobileViewportRef.current = isMobileViewport();
    const restored = readWidgetState();
    const frame = window.requestAnimationFrame(() => {
      setWidget(restored);
      setReady(true);
    });

    const onResize = () => {
      const isMobile = isMobileViewport();
      if (isMobile !== mobileViewportRef.current) {
        mobileViewportRef.current = isMobile;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setWidget(readWidgetState());
        return;
      }
      setWidget((current) => ({ ...current, ...clampPosition(current.x, current.y) }));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey(mobileViewportRef.current), JSON.stringify(widget));
      } catch {
        // The widget remains usable when browser storage is disabled.
      }
    }, 180);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [ready, widget]);

  useEffect(() => {
    if (!ready || widget.hidden || chatOpen) return;

    introTimerRef.current = setTimeout(() => {
      setCompact(false);
      setIntro(true);
      compactTimerRef.current = setTimeout(() => {
        setIntro(false);
        setCompact(true);
      }, INTRO_DURATION_MS);
    }, INTRO_DELAY_MS);

    return () => {
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
      if (compactTimerRef.current) clearTimeout(compactTimerRef.current);
    };
  }, [ready, widget.hidden, chatOpen]);

  const wakeWidget = useCallback(() => {
    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    setIntro(false);
    setCompact(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (compactTimerRef.current) clearTimeout(compactTimerRef.current);
    idleTimerRef.current = setTimeout(
      () => setCompact(true),
      COMPACT_DELAY_MS
    );
  }, []);

  useEffect(() => {
    if (!ready || widget.hidden || chatOpen) return;
    idleTimerRef.current = setTimeout(
      () => setCompact(true),
      COMPACT_DELAY_MS
    );
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [ready, widget.hidden, chatOpen]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!ready || !event.isPrimary || event.button !== 0) return;
    dragStartRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      widgetX: widget.x,
      widgetY: widget.y,
    };
    draggedRef.current = false;
    setDragging(true);
    setHideTargetActive(false);
    wakeWidget();
  };

  useEffect(() => {
    if (!dragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - start.pointerX;
      const deltaY = event.clientY - start.pointerY;
      if (!draggedRef.current && Math.hypot(deltaX, deltaY) < 6) return;

      event.preventDefault();
      draggedRef.current = true;
      setChatOpen(false);
      setWidget((current) => ({
        ...current,
        ...clampPosition(start.widgetX + deltaX, start.widgetY + deltaY),
      }));

      const target = hideTargetRef.current?.getBoundingClientRect();
      setHideTargetActive(
        window.innerWidth <= 1023 &&
          !!target &&
          event.clientX >= target.left &&
          event.clientX <= target.right &&
          event.clientY >= target.top &&
          event.clientY <= target.bottom
      );
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (dragStartRef.current?.pointerId !== event.pointerId) return;

      suppressClickRef.current = draggedRef.current;
      const target = hideTargetRef.current?.getBoundingClientRect();
      const droppedOnHideTarget =
        event.type === "pointerup" &&
        draggedRef.current &&
        window.innerWidth <= 1023 &&
        !!target &&
        event.clientX >= target.left &&
        event.clientX <= target.right &&
        event.clientY >= target.top &&
        event.clientY <= target.bottom;

      dragStartRef.current = null;
      setDragging(false);
      setHideTargetActive(false);
      if (droppedOnHideTarget) {
        setWidget((current) => ({ ...current, hidden: true }));
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [dragging]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      suppressClickRef.current = false;
      return;
    }
    wakeWidget();
    setChatOpen((current) => !current);
  };

  const openWhatsApp = (message: string) => {
    const url = new URL(siteConfig.whatsapp);
    url.searchParams.set("text", message);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const handleMessageSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = messageDraft.trim();
    if (!message) return;
    openWhatsApp(message);
    setMessageDraft("");
  };

  const chatPosition = ready && chatOpen ? getChatPanelPosition(widget) : undefined;

  if (!ready) {
    return <div className="whatsapp-widget" aria-hidden="true" />;
  }

  return (
    <div
      className={`whatsapp-widget is-ready${dragging ? " is-dragging" : ""}${widget.hidden ? " is-hidden" : ""}`}
      style={{ left: widget.x, top: widget.y }}
    >
      {!widget.hidden ? (
        <>
          {chatOpen && (
            <section
              className="whatsapp-chat-panel"
              style={chatPosition}
              role="dialog"
              aria-label="Chat with Damsa Coture"
            >
              <header className="whatsapp-chat-header">
                <span className="whatsapp-chat-avatar" aria-hidden="true">
                  <i className="fab fa-whatsapp" />
                </span>
                <span className="whatsapp-chat-title">
                  <strong>Damsa Coture</strong>
                  <small>We usually reply on WhatsApp</small>
                </span>
                <button
                  type="button"
                  className="whatsapp-chat-close"
                  onClick={() => setChatOpen(false)}
                  aria-label="Close chat"
                >
                  <i className="fas fa-times" aria-hidden="true" />
                </button>
              </header>
              <div className="whatsapp-chat-messages" aria-live="polite">
                <p className="whatsapp-chat-message">
                  Hello! Welcome to Damsa Coture. How can we help with styling,
                  sizing, or an order?
                </p>
                <div className="whatsapp-chat-shortcuts">
                  <button
                    type="button"
                    onClick={() =>
                      setMessageDraft(
                        "Hello Damsa Coture, I would like some styling assistance."
                      )
                    }
                  >
                    Styling assistance
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageDraft("Hello Damsa Coture, I need help with an order.")}
                  >
                    Order support
                  </button>
                </div>
                <p className="whatsapp-chat-note">
                  Your message will continue in WhatsApp.
                </p>
              </div>
              <form className="whatsapp-chat-compose" onSubmit={handleMessageSubmit}>
                <input
                  type="text"
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder="Type your message..."
                  aria-label="Your message"
                />
                <button
                  type="submit"
                  disabled={!messageDraft.trim()}
                  aria-label="Continue to WhatsApp"
                  title="Continue to WhatsApp"
                >
                  <i className="fas fa-paper-plane" aria-hidden="true" />
                </button>
              </form>
            </section>
          )}
          <button
            type="button"
            className={`whatsapp-float${compact ? " is-compact" : ""}${intro ? " is-intro" : ""}${chatOpen ? " is-open" : ""}`}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            onFocus={wakeWidget}
            aria-label={chatOpen ? "Close Damsa Coture chat" : "Open Damsa Coture chat"}
            aria-expanded={chatOpen}
            title="Drag to move. Click to open support chat."
          >
            <i
              className={chatOpen ? "fas fa-times" : "fab fa-whatsapp"}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="whatsapp-widget-hide"
            onClick={() => setWidget((current) => ({ ...current, hidden: true }))}
            aria-label="Hide WhatsApp button"
            title="Hide WhatsApp button"
          >
            <i className="fas fa-minus" aria-hidden="true" />
          </button>
          <div
            ref={hideTargetRef}
            className={`whatsapp-widget-drop-target${hideTargetActive ? " is-active" : ""}`}
            aria-hidden="true"
          >
            <i className="fas fa-times" />
          </div>
        </>
      ) : (
        <button
          type="button"
          className="whatsapp-widget-restore"
          onClick={() => setWidget((current) => ({ ...current, hidden: false }))}
          aria-label="Show WhatsApp button"
          title="Show WhatsApp button"
        >
          <i className="fab fa-whatsapp" aria-hidden="true" />
          <span>Show chat</span>
        </button>
      )}
    </div>
  );
}
