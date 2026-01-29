/**
 * Visual highlight box around elements
 * Design: Subtle blue highlight, Notion-like
 */

import { createElement } from "../utils/dom";
import { colors, borders, transitions, zIndex } from "../theme";

let highlightEl: HTMLDivElement | null = null;
let currentElement: HTMLElement | null = null;
let rafId: number | null = null;

export function showHighlight(element: HTMLElement): void {
  if (!highlightEl) {
    createHighlightElement();
  }

  currentElement = element;
  updateHighlightPosition();
}

export function hideHighlight(): void {
  if (highlightEl) {
    highlightEl.style.display = "none";
  }
  currentElement = null;

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

export function destroyHighlight(): void {
  hideHighlight();
  if (highlightEl) {
    highlightEl.remove();
    highlightEl = null;
  }
}

function createHighlightElement(): void {
  highlightEl = createElement("div", {
    className: "orphy-highlight",
    styles: {
      position: "fixed",
      pointerEvents: "none",
      zIndex: zIndex.highlight,
      border: `2px solid ${colors.overlay.highlightBorder}`,
      backgroundColor: colors.overlay.highlight,
      borderRadius: borders.radius.sm,
      transition: `all ${transitions.duration.fast} ${transitions.easing.out}`,
      display: "none",
      // Universal visibility: white inner + dark outer + caramel glow
      boxShadow: `
        0 0 0 2px rgba(255, 255, 255, 0.9),
        0 0 0 4px rgba(0, 0, 0, 0.25),
        0 0 16px rgba(212, 163, 115, 0.35)
      `.replace(/\s+/g, ' ').trim(),
    },
  });

  document.body.appendChild(highlightEl);

  // Update position on scroll/resize
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
}

function updateHighlightPosition(): void {
  if (!highlightEl || !currentElement) return;

  const rect = currentElement.getBoundingClientRect();

  highlightEl.style.top = `${rect.top}px`;
  highlightEl.style.left = `${rect.left}px`;
  highlightEl.style.width = `${rect.width}px`;
  highlightEl.style.height = `${rect.height}px`;
  highlightEl.style.display = "block";
}

function scheduleUpdate(): void {
  if (rafId !== null) return;

  rafId = requestAnimationFrame(() => {
    rafId = null;
    if (currentElement) {
      updateHighlightPosition();
    }
  });
}
