/**
 * Transparent overlay for click capture
 * Includes debounced highlight for smooth UX
 * Locks highlight on clicked element while comment box is open
 */

import { createElement } from "../utils/dom";
import { zIndex } from "../theme";
import { store } from "./state";
import { showHighlight, hideHighlight } from "./highlight";

// Track if highlight is locked (comment box open)
let highlightLocked = false;

let overlayEl: HTMLDivElement | null = null;
let onElementClick: ((el: HTMLElement, x: number, y: number) => void) | null = null;

// Debounce state for highlight
const HIGHLIGHT_DEBOUNCE_MS = 80;
let highlightTimeout: ReturnType<typeof setTimeout> | null = null;
let lastHighlightedElement: HTMLElement | null = null;

export function createOverlay(onClick: (el: HTMLElement, x: number, y: number) => void): void {
  if (overlayEl) return;

  onElementClick = onClick;

  overlayEl = createElement("div", {
    className: "orphy-overlay",
    styles: {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      zIndex: zIndex.overlay,
      cursor: "crosshair",
      background: "transparent",
    },
  });

  overlayEl.addEventListener("mousemove", handleMouseMove);
  overlayEl.addEventListener("click", handleClick);
  overlayEl.addEventListener("mouseleave", handleMouseLeave);

  document.body.appendChild(overlayEl);
}

export function destroyOverlay(): void {
  if (!overlayEl) return;

  // Clear pending highlight timeout
  if (highlightTimeout) {
    clearTimeout(highlightTimeout);
    highlightTimeout = null;
  }
  lastHighlightedElement = null;
  highlightLocked = false;

  overlayEl.removeEventListener("mousemove", handleMouseMove);
  overlayEl.removeEventListener("click", handleClick);
  overlayEl.removeEventListener("mouseleave", handleMouseLeave);

  overlayEl.remove();
  overlayEl = null;
  onElementClick = null;
  hideHighlight();
}

/**
 * Lock highlight on current element (e.g., while comment box is open)
 */
export function lockHighlight(): void {
  highlightLocked = true;
}

/**
 * Unlock highlight to resume following mouse
 */
export function unlockHighlight(): void {
  highlightLocked = false;
}

function getElementUnderCursor(x: number, y: number): HTMLElement | null {
  if (!overlayEl) return null;

  // Temporarily hide overlay to get element underneath
  const prevDisplay = overlayEl.style.display;
  overlayEl.style.display = "none";
  const element = document.elementFromPoint(x, y) as HTMLElement | null;
  overlayEl.style.display = prevDisplay;

  // Filter out our own elements
  if (element?.closest(".orphy-overlay, .orphy-highlight, .orphy-toolbar, .orphy-comment-box")) {
    return null;
  }

  return element;
}

function handleMouseMove(e: MouseEvent): void {
  // Don't update highlight while comment box is open (locked)
  if (highlightLocked) {
    return;
  }

  const element = getElementUnderCursor(e.clientX, e.clientY);

  // Clear any pending highlight
  if (highlightTimeout) {
    clearTimeout(highlightTimeout);
    highlightTimeout = null;
  }

  // If no element or same element, skip debounce
  if (!element) {
    lastHighlightedElement = null;
    hideHighlight();
    return;
  }

  // Same element - no need to re-highlight
  if (element === lastHighlightedElement) {
    return;
  }

  // Debounce: wait for mouse to "settle" before highlighting
  highlightTimeout = setTimeout(() => {
    lastHighlightedElement = element;
    store.setState({ currentElement: element });
    showHighlight(element);
    highlightTimeout = null;
  }, HIGHLIGHT_DEBOUNCE_MS);
}

function handleClick(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();

  const element = getElementUnderCursor(e.clientX, e.clientY);

  if (element && onElementClick) {
    onElementClick(element, e.clientX, e.clientY);
  }
}

function handleMouseLeave(): void {
  // Don't hide highlight if locked (comment box open)
  if (highlightLocked) {
    return;
  }

  // Clear pending highlight
  if (highlightTimeout) {
    clearTimeout(highlightTimeout);
    highlightTimeout = null;
  }
  lastHighlightedElement = null;
  hideHighlight();
}
