/**
 * Replay overlay UI - Premium feedback viewing experience
 * Linear-quality design with Orphy design system
 */

import { createElement } from "../utils/dom";
import { t } from "../i18n";
import type { Feedback, FeedbackType } from "../core/state";

// ============================================================================
// STATE
// ============================================================================

let overlayEl: HTMLDivElement | null = null;
let highlightEl: HTMLDivElement | null = null;
let panelEl: HTMLDivElement | null = null;
let currentElement: HTMLElement | null = null;
let resizeObserver: ResizeObserver | null = null;
let rafId: number | null = null;
let keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
let resolveButton: HTMLButtonElement | null = null;

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const COLORS = {
  // Primary (Caramel)
  primary: "#C4A484",
  primaryLight: "rgba(196, 164, 132, 0.15)",
  primaryGlow: "rgba(196, 164, 132, 0.4)",

  // Status
  statusOpen: "#6b7280",
  statusOpenBg: "#f3f4f6",
  statusResolved: "#10b981",
  statusResolvedBg: "#d1fae5",

  // Neutrals
  text: "#1f2937",
  textMuted: "#6b7280",
  textLight: "#9ca3af",
  background: "#ffffff",
  border: "#e5e7eb",
  backdrop: "rgba(0, 0, 0, 0.4)",

  // Feedback types
  typeBug: "#ef4444",
  typeDesign: "#8b5cf6",
  typeContent: "#3b82f6",
  typeQuestion: "#f59e0b",
} as const;

const TYPOGRAPHY = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  sizes: {
    xs: "11px",
    sm: "12px",
    base: "14px",
    lg: "15px",
  },
} as const;

// ============================================================================
// ICONS - Static SVG strings (safe, not user input)
// ============================================================================

const ICONS: Record<FeedbackType, string> = {
  // Lucide Bug icon - matches comment-box.ts
  bug: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${COLORS.typeBug}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>`,
  // Lucide Palette icon - matches comment-box.ts (paint palette with color dots)
  design: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${COLORS.typeDesign}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="0.5" fill="${COLORS.typeDesign}"/><circle cx="17.5" cy="10.5" r="0.5" fill="${COLORS.typeDesign}"/><circle cx="8.5" cy="7.5" r="0.5" fill="${COLORS.typeDesign}"/><circle cx="6.5" cy="12.5" r="0.5" fill="${COLORS.typeDesign}"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>`,
  // Lucide FileText icon - matches comment-box.ts
  content: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${COLORS.typeContent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
  // Lucide HelpCircle icon - matches comment-box.ts
  question: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${COLORS.typeQuestion}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
};

const CHECK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

const CALENDAR_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

const MONITOR_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;

// ============================================================================
// STYLES (injected once)
// ============================================================================

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected) return;

  const style = document.createElement("style");
  style.id = "orphy-replay-styles";
  style.textContent = `
    @keyframes orphy-highlight-pulse {
      0%, 100% { box-shadow: 0 0 0 4px ${COLORS.primaryGlow}, 0 0 20px ${COLORS.primaryGlow}; }
      50% { box-shadow: 0 0 0 6px ${COLORS.primaryGlow}, 0 0 30px ${COLORS.primaryGlow}; }
    }

    @keyframes orphy-panel-slide-in {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes orphy-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes orphy-success-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .orphy-replay-overlay {
      animation: orphy-fade-in 0.2s ease-out;
    }

    .orphy-replay-highlight {
      animation: orphy-highlight-pulse 2s ease-in-out infinite;
    }

    .orphy-replay-panel {
      animation: orphy-panel-slide-in 0.3s ease-out;
    }

    .orphy-replay-btn {
      transition: all 0.15s ease;
    }

    .orphy-replay-btn:hover {
      transform: translateY(-1px);
    }

    .orphy-replay-btn:active {
      transform: translateY(0);
    }

    .orphy-replay-btn-primary:hover {
      filter: brightness(1.05);
      box-shadow: 0 4px 12px ${COLORS.primaryGlow};
    }

    .orphy-replay-btn-secondary:hover {
      background-color: ${COLORS.border};
    }

    .orphy-replay-btn-success {
      animation: orphy-success-pulse 0.3s ease;
    }
  `;

  document.head.appendChild(style);
  stylesInjected = true;
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);

  if (minutes < 1) return t("replay.timeAgo.now");
  if (minutes < 60) return t("replay.timeAgo.minutes", { count: minutes });
  if (hours < 24) return t("replay.timeAgo.hours", { count: hours });
  if (days < 7) return t("replay.timeAgo.days", { count: days });
  return t("replay.timeAgo.weeks", { count: weeks });
}

function getTypeColor(type: FeedbackType): string {
  const colors: Record<FeedbackType, string> = {
    bug: COLORS.typeBug,
    design: COLORS.typeDesign,
    content: COLORS.typeContent,
    question: COLORS.typeQuestion,
  };
  return colors[type];
}

/**
 * Create an element with an SVG icon inside
 * Uses static hardcoded SVG strings (safe, not user input)
 */
function createIconElement(svgString: string, containerStyles: Record<string, string>): HTMLSpanElement {
  const span = createElement("span", { styles: containerStyles });
  // SVG strings are hardcoded constants, not user input - safe to use
  span.innerHTML = svgString;
  return span;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function showReplayOverlay(
  element: HTMLElement,
  feedback: Feedback,
  onClose: () => void,
  onResolve: (feedbackId: string, note?: string) => void
): void {
  hideReplayOverlay();
  injectStyles();

  currentElement = element;

  // Create backdrop
  overlayEl = createElement("div", {
    className: "orphy-replay-overlay",
    styles: {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: COLORS.backdrop,
      zIndex: "999998",
      cursor: "pointer",
    },
    onClick: onClose,
  });

  // Create highlight
  highlightEl = createElement("div", {
    className: "orphy-replay-highlight",
    styles: {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "999999",
      border: `3px solid ${COLORS.primary}`,
      backgroundColor: COLORS.primaryLight,
      borderRadius: "6px",
    },
  });

  // Create panel
  panelEl = createPanel(feedback, onClose, onResolve);

  // Append to DOM
  document.body.appendChild(overlayEl);
  document.body.appendChild(highlightEl);
  document.body.appendChild(panelEl);

  // Position highlight
  updateHighlightPosition();

  // Watch for changes
  resizeObserver = new ResizeObserver(scheduleUpdate);
  resizeObserver.observe(element);

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });

  // Keyboard handler (Esc to close)
  keyboardHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };
  document.addEventListener("keydown", keyboardHandler);
}

export function hideReplayOverlay(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  if (keyboardHandler) {
    document.removeEventListener("keydown", keyboardHandler);
    keyboardHandler = null;
  }

  window.removeEventListener("scroll", scheduleUpdate);
  window.removeEventListener("resize", scheduleUpdate);

  overlayEl?.remove();
  highlightEl?.remove();
  panelEl?.remove();

  overlayEl = null;
  highlightEl = null;
  panelEl = null;
  currentElement = null;
  resolveButton = null;
}

// ============================================================================
// PANEL CREATION
// ============================================================================

function createPanel(
  feedback: Feedback,
  onClose: () => void,
  onResolve: (feedbackId: string, note?: string) => void
): HTMLDivElement {
  const isResolved = feedback.status === "resolved";
  const typeColor = getTypeColor(feedback.feedbackType);

  // ─── Header ───
  const typeIcon = createIconElement(ICONS[feedback.feedbackType], {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    backgroundColor: `${typeColor}15`,
  });

  const typeLabel = createElement("span", {
    styles: {
      fontSize: TYPOGRAPHY.sizes.base,
      fontWeight: "600",
      color: COLORS.text,
    },
    children: [t(`types.${feedback.feedbackType}`)],
  });

  const typeBadge = createElement("div", {
    styles: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    children: [typeIcon, typeLabel],
  });

  const statusBadge = createElement("span", {
    styles: {
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: "99px",
      fontSize: TYPOGRAPHY.sizes.sm,
      fontWeight: "500",
      backgroundColor: isResolved ? COLORS.statusResolvedBg : COLORS.statusOpenBg,
      color: isResolved ? COLORS.statusResolved : COLORS.statusOpen,
    },
    children: [t(`replay.status.${feedback.status}`)],
  });

  const header = createElement("div", {
    styles: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: "12px",
      borderBottom: `1px solid ${COLORS.border}`,
      marginBottom: "16px",
    },
    children: [typeBadge, statusBadge],
  });

  // ─── Comment ───
  const comment = createElement("p", {
    styles: {
      margin: "0 0 16px",
      fontSize: TYPOGRAPHY.sizes.lg,
      lineHeight: "1.6",
      color: COLORS.text,
      wordBreak: "break-word",
    },
    children: [feedback.comment],
  });

  // ─── Metadata ───
  const dateIcon = createIconElement(CALENDAR_ICON, {
    display: "flex",
    alignItems: "center",
    color: COLORS.textLight,
  });

  const dateText = createElement("span", {
    children: [formatRelativeTime(feedback.createdAt ?? feedback.timestamp)],
  });

  const dateMeta = createElement("div", {
    styles: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    children: [dateIcon, dateText],
  });

  const viewportIcon = createIconElement(MONITOR_ICON, {
    display: "flex",
    alignItems: "center",
    color: COLORS.textLight,
  });

  const viewportText = createElement("span", {
    children: [
      feedback.viewport
        ? t("replay.viewport", {
            width: feedback.viewport.width,
            height: feedback.viewport.height,
            device: t("replay.device.desktop"),
          })
        : "—",
    ],
  });

  const viewportMeta = createElement("div", {
    styles: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    children: [viewportIcon, viewportText],
  });

  const metadata = createElement("div", {
    styles: {
      display: "flex",
      flexWrap: "wrap",
      gap: "16px",
      fontSize: TYPOGRAPHY.sizes.sm,
      color: COLORS.textMuted,
      paddingBottom: "16px",
      borderBottom: `1px solid ${COLORS.border}`,
      marginBottom: "16px",
    },
    children: [dateMeta, viewportMeta],
  });

  // ─── Resolution Note (only for open feedbacks) ───
  let noteTextarea: HTMLTextAreaElement | null = null;
  let noteSection: HTMLDivElement | null = null;

  if (!isResolved) {
    noteTextarea = createElement("textarea", {
      styles: {
        width: "100%",
        minHeight: "80px",
        padding: "12px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: "8px",
        fontSize: TYPOGRAPHY.sizes.base,
        fontFamily: TYPOGRAPHY.fontFamily,
        resize: "vertical",
        boxSizing: "border-box",
        color: COLORS.text,
        backgroundColor: COLORS.background,
      },
      attributes: {
        placeholder: t("replay.notePlaceholder"),
      },
    }) as HTMLTextAreaElement;

    // Focus styles
    noteTextarea.addEventListener("focus", () => {
      noteTextarea!.style.borderColor = COLORS.primary;
      noteTextarea!.style.outline = "none";
      noteTextarea!.style.boxShadow = `0 0 0 3px ${COLORS.primaryLight}`;
    });
    noteTextarea.addEventListener("blur", () => {
      noteTextarea!.style.borderColor = COLORS.border;
      noteTextarea!.style.boxShadow = "none";
    });

    const noteHint = createElement("p", {
      styles: {
        margin: "6px 0 0",
        fontSize: TYPOGRAPHY.sizes.xs,
        color: COLORS.textLight,
      },
      children: [t("replay.noteHint")],
    });

    noteSection = createElement("div", {
      styles: {
        marginBottom: "16px",
      },
      children: [noteTextarea, noteHint],
    });
  }

  // ─── Actions ───
  const closeBtn = createElement("button", {
    className: "orphy-replay-btn orphy-replay-btn-secondary",
    styles: {
      padding: "10px 18px",
      border: "none",
      borderRadius: "8px",
      backgroundColor: COLORS.statusOpenBg,
      color: COLORS.text,
      fontSize: TYPOGRAPHY.sizes.base,
      fontWeight: "500",
      cursor: "pointer",
      fontFamily: TYPOGRAPHY.fontFamily,
    },
    onClick: (e) => {
      e.stopPropagation();
      onClose();
    },
    children: [t("replay.close")],
  });

  resolveButton = createElement("button", {
    className: "orphy-replay-btn orphy-replay-btn-primary",
    styles: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "10px 18px",
      border: "none",
      borderRadius: "8px",
      backgroundColor: COLORS.primary,
      color: "#ffffff",
      fontSize: TYPOGRAPHY.sizes.base,
      fontWeight: "500",
      cursor: "pointer",
      fontFamily: TYPOGRAPHY.fontFamily,
    },
    onClick: async (e) => {
      e.stopPropagation();
      const note = noteTextarea?.value.trim() || undefined;
      await handleResolveClick(feedback.id, note, onResolve, onClose);
    },
    children: [t("replay.resolve")],
  }) as HTMLButtonElement;

  const actions = createElement("div", {
    styles: {
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
    },
    children: isResolved ? [closeBtn] : [closeBtn, resolveButton],
  });

  // ─── Hint ───
  const hint = createElement("div", {
    styles: {
      marginTop: "12px",
      fontSize: TYPOGRAPHY.sizes.xs,
      color: COLORS.textLight,
      textAlign: "center",
    },
    children: [t("replay.hint")],
  });

  // ─── Panel Container ───
  // Build children array conditionally to include note section when present
  const panelChildren: (HTMLElement | string)[] = [header, comment, metadata];
  if (noteSection) {
    panelChildren.push(noteSection);
  }
  panelChildren.push(actions, hint);

  return createElement("div", {
    className: "orphy-replay-panel",
    styles: {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      width: "360px",
      maxWidth: "calc(100vw - 48px)",
      backgroundColor: COLORS.background,
      borderRadius: "12px",
      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
      padding: "20px",
      zIndex: "999999",
      fontFamily: TYPOGRAPHY.fontFamily,
    },
    children: panelChildren,
  });
}

// ============================================================================
// RESOLVE HANDLER WITH FEEDBACK
// ============================================================================

async function handleResolveClick(
  feedbackId: string,
  note: string | undefined,
  onResolve: (id: string, note?: string) => void,
  onClose: () => void
): Promise<void> {
  if (!resolveButton) return;

  // Loading state
  resolveButton.disabled = true;
  resolveButton.textContent = t("replay.resolving");
  resolveButton.style.opacity = "0.7";
  resolveButton.style.cursor = "wait";

  try {
    await onResolve(feedbackId, note);

    // Success state (brief flash before closing)
    const checkSpan = createIconElement(CHECK_ICON, { display: "inline-flex", marginRight: "4px" });
    resolveButton.textContent = "";
    resolveButton.appendChild(checkSpan);
    resolveButton.appendChild(document.createTextNode(t("replay.resolved")));
    resolveButton.style.backgroundColor = COLORS.statusResolved;
    resolveButton.style.opacity = "1";
    resolveButton.classList.add("orphy-replay-btn-success");

    // Close after brief success feedback
    setTimeout(() => {
      onClose();
    }, 600);
  } catch {
    // Reset on error
    resolveButton.disabled = false;
    resolveButton.textContent = t("replay.resolve");
    resolveButton.style.opacity = "1";
    resolveButton.style.cursor = "pointer";
  }
}

// ============================================================================
// HIGHLIGHT POSITIONING
// ============================================================================

function updateHighlightPosition(): void {
  if (!highlightEl || !currentElement) return;

  const rect = currentElement.getBoundingClientRect();

  highlightEl.style.top = `${rect.top - 4}px`;
  highlightEl.style.left = `${rect.left - 4}px`;
  highlightEl.style.width = `${rect.width + 8}px`;
  highlightEl.style.height = `${rect.height + 8}px`;
}

function scheduleUpdate(): void {
  if (rafId !== null) return;

  rafId = requestAnimationFrame(() => {
    rafId = null;
    updateHighlightPosition();
  });
}
