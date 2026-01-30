/**
 * SlidePanel - Generic slide panel component with backdrop
 *
 * Encapsulates common logic for slide panels:
 * - Backdrop with fade animation
 * - Container with slide animation
 * - Escape key to close
 * - Content management with setContent
 */

import { createElement } from "../utils/dom";
import {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  transitions,
  zIndex,
  components,
} from "../theme";

// =============================================================================
// TYPES
// =============================================================================

export interface SlidePanelOptions {
  onClose: () => void;
}

export interface SlidePanelAPI {
  /** The panel container element where content should be added */
  container: HTMLDivElement;
  /** Close the panel with animation */
  close: () => void;
  /** Replace all content in the panel */
  setContent: (content: HTMLElement[]) => void;
  /** Check if panel is still mounted */
  isOpen: () => boolean;
}

// =============================================================================
// STATE
// =============================================================================

let isClosing = false;

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Create a slide panel with backdrop and animations
 */
export function createSlidePanel(options: SlidePanelOptions): SlidePanelAPI {
  isClosing = false;

  // Backdrop
  const backdrop = createElement("div", {
    className: "orphy-slide-panel-backdrop",
    styles: {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: colors.overlay.backdrop,
      zIndex: zIndex.overlay,
      opacity: "0",
      transition: `opacity ${transitions.duration.slow} ${transitions.easing.out}`,
    },
    onClick: close,
  });

  // Panel container
  const panel = createElement("div", {
    className: "orphy-slide-panel",
    styles: {
      position: "fixed",
      top: "0",
      right: "0",
      width: components.panel.width,
      maxWidth: "100vw",
      height: "100vh",
      backgroundColor: colors.bg.primary,
      boxShadow: shadows.xl,
      borderLeft: `${borders.width.thin} solid ${colors.border.default}`,
      zIndex: zIndex.toolbar,
      display: "flex",
      flexDirection: "column",
      fontFamily: typography.family.sans,
      transform: "translateX(100%)",
      transition: `transform ${transitions.duration.slow} ${transitions.easing.out}`,
    },
  });

  // Escape handler
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  // Mount
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  document.addEventListener("keydown", keyHandler);

  // Animate in
  setTimeout(() => {
    if (!isClosing) {
      backdrop.style.opacity = "1";
      panel.style.transform = "translateX(0)";
    }
  }, 10);

  // Close function
  function close(): void {
    if (isClosing) return;
    isClosing = true;

    const isMobile = window.innerWidth <= 480;
    panel.style.transform = isMobile ? "translateY(100%)" : "translateX(100%)";
    backdrop.style.opacity = "0";

    setTimeout(() => {
      document.removeEventListener("keydown", keyHandler);
      backdrop.remove();
      panel.remove();
      options.onClose();
    }, 200);
  }

  // Set content function - clears and replaces all content
  function setContent(content: HTMLElement[]): void {
    while (panel.firstChild) {
      panel.removeChild(panel.firstChild);
    }
    content.forEach((el) => panel.appendChild(el));
  }

  // Check if panel is still open
  function isOpen(): boolean {
    return !isClosing && document.body.contains(panel);
  }

  return {
    container: panel,
    close,
    setContent,
    isOpen,
  };
}
