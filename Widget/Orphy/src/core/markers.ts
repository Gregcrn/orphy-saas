/**
 * DOM Marker System - managing attributes on annotated elements
 * Design: Uses Orphy caramel design system
 */

import { sessionStore } from "./session";
import { colors } from "../theme";

export function initMarkers(): void {
  injectStyles();
  sessionStore.subscribe(updateMarkers);
}

function injectStyles(): void {
  if (document.getElementById("orphy-marker-styles")) return;

  const style = document.createElement("style");
  style.id = "orphy-marker-styles";
  style.textContent = `
    /* Outline styles - active only when .orphy-mode is on body */
    /* Badges are handled separately via JS layer for compatibility with void elements */
    body.orphy-mode [data-orphy-annotated] {
      cursor: pointer !important;
      transition: box-shadow 0.2s ease-in-out, outline-color 0.2s ease-in-out;
    }
    body.orphy-mode [data-orphy-annotated="draft"] {
      outline: 2px solid ${colors.accent.primary};
      box-shadow:
        0 0 0 2px rgba(255, 255, 255, 0.9),
        0 0 0 4px rgba(0, 0, 0, 0.15),
        0 0 12px rgba(212, 163, 115, 0.3);
    }
    body.orphy-mode [data-orphy-annotated="sending"] {
      outline: 2px solid ${colors.status.sending};
      box-shadow:
        0 0 0 2px rgba(255, 255, 255, 0.9),
        0 0 0 4px rgba(0, 0, 0, 0.15),
        0 0 12px rgba(201, 162, 39, 0.3);
    }
    body.orphy-mode [data-orphy-annotated="sent"] {
      outline: 2px solid ${colors.status.success};
      box-shadow:
        0 0 0 2px rgba(255, 255, 255, 0.9),
        0 0 0 4px rgba(0, 0, 0, 0.15),
        0 0 12px rgba(46, 139, 87, 0.3);
    }
    body.orphy-mode [data-orphy-annotated="error"] {
      outline: 2px solid ${colors.status.error};
      box-shadow:
        0 0 0 2px rgba(255, 255, 255, 0.9),
        0 0 0 4px rgba(0, 0, 0, 0.15),
        0 0 12px rgba(201, 68, 74, 0.3);
    }

    @keyframes orphy-flash {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    .orphy-flash-highlight {
      animation: orphy-flash 0.5s ease-in-out 3;
    }
  `;
  document.head.appendChild(style);
}

export function updateMarkers(): void {
  const drafts = sessionStore.getDrafts();

  // First, clear all existing markers to ensure clean state
  clearMarkers();

  // Group drafts by element to handle counts and track first index
  const elementMap = new Map<HTMLElement, { status: string, count: number, firstIndex: number }>();

  drafts.forEach((draft, index) => {
    let element = draft.element;

    // Recovery: if element is detached, try to find it again
    if (!element.isConnected) {
      const recovered = document.querySelector(draft.selector) as HTMLElement;
      if (recovered) {
        // Update draft with recovered element for future reference
        // Note: we're mutating the draft here which is technically side-effecty
        // but necessary for persistence in the session
        draft.element = recovered;
        element = recovered;
      } else {
        return; // Element truly lost
      }
    }

    const current = elementMap.get(element) || { status: draft.status, count: 0, firstIndex: index + 1 };

    // Status priority: error > sending > draft > sent
    // If multiple drafts on one element, show the most "active" status
    if (getPrio(draft.status) > getPrio(current.status as any)) {
      current.status = draft.status;
    }

    current.count++;
    elementMap.set(element, current);
  });

  // Apply attributes
  elementMap.forEach((data, element) => {
    element.setAttribute("data-orphy-annotated", data.status);
    // Show index (or "1,2" style if multiple on same element)
    element.setAttribute("data-orphy-index", String(data.firstIndex));
    if (data.count > 1) {
      element.setAttribute("data-orphy-count", String(data.count));
    }
  });
}

export function clearMarkers(): void {
  const markedPoints = document.querySelectorAll("[data-orphy-annotated]");
  markedPoints.forEach(el => {
    el.removeAttribute("data-orphy-annotated");
    el.removeAttribute("data-orphy-index");
    el.removeAttribute("data-orphy-count");
  });
}

function getPrio(status: string): number {
  switch (status) {
    case "error": return 4;
    case "sending": return 3;
    case "draft": return 2;
    case "sent": return 1;
    default: return 0;
  }
}
