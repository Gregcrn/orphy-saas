/**
 * Visual highlight box around elements
 * Design: Subtle blue highlight, Notion-like
 *
 * Supports two modes:
 * - Normal: Semi-transparent highlight over element (for review mode)
 * - Spotlight: Cutout effect with darkened surroundings (for replay/messages)
 */

import { createElement } from "../utils/dom";
import { colors, borders, transitions, zIndex } from "../theme";

let highlightEl: HTMLDivElement | null = null;
let currentElement: HTMLElement | null = null;
let rafId: number | null = null;
let isSpotlightMode = false;

// Normal highlight styles
const normalBoxShadow = `
  0 0 0 2px rgba(255, 255, 255, 0.9),
  0 0 0 4px rgba(0, 0, 0, 0.25),
  0 0 16px rgba(212, 163, 115, 0.35)
`.replace(/\s+/g, ' ').trim();

// Spotlight mode: massive shadow creates the "cutout" effect
const spotlightBoxShadow = `
  0 0 0 2px rgba(255, 255, 255, 0.95),
  0 0 0 4px ${colors.overlay.highlightBorder},
  0 0 0 9999px rgba(15, 15, 15, 0.6)
`.replace(/\s+/g, ' ').trim();

export function showHighlight(element: HTMLElement): void {
  if (!highlightEl) {
    createHighlightElement();
  }

  isSpotlightMode = false;
  applyNormalStyles();
  currentElement = element;
  updateHighlightPosition();
}

/**
 * Show highlight in spotlight mode (cutout effect)
 * Used for replay/messages when viewing a specific feedback
 */
export function showSpotlight(element: HTMLElement): void {
  if (!highlightEl) {
    createHighlightElement();
  }

  isSpotlightMode = true;
  applySpotlightStyles();
  currentElement = element;
  updateHighlightPosition();
}

export function hideHighlight(): void {
  if (highlightEl) {
    highlightEl.style.display = "none";
  }
  currentElement = null;
  isSpotlightMode = false;

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

function applyNormalStyles(): void {
  if (!highlightEl) return;
  highlightEl.style.backgroundColor = colors.overlay.highlight;
  highlightEl.style.boxShadow = normalBoxShadow;
}

function applySpotlightStyles(): void {
  if (!highlightEl) return;
  // Transparent background so element shows through natively
  highlightEl.style.backgroundColor = "transparent";
  highlightEl.style.boxShadow = spotlightBoxShadow;
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
