/**
 * Review panel - Sidebar showing all draft feedbacks before submission
 * Design: Notion-like - clean, organized, calm
 */

import { createElement } from "../utils/dom";
import { sessionStore, type FeedbackDraft, type DraftStatus } from "../core/session";
import { type FeedbackType } from "../core/state";
import { t } from "../i18n";
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

let panelEl: HTMLDivElement | null = null;
let listEl: HTMLDivElement | null = null;
let footerEl: HTMLDivElement | null = null;
let submitBtnEl: HTMLButtonElement | null = null;
let isSubmitting = false;
let onSubmitAllCallback: ((drafts: FeedbackDraft[]) => void) | null = null;

// =============================================================================
// PUBLIC API
// =============================================================================

export function showReviewPanel(
  onSubmitAll: (drafts: FeedbackDraft[]) => void
): void {
  if (panelEl) return;

  onSubmitAllCallback = onSubmitAll;

  // Backdrop
  const backdrop = createElement("div", {
    className: "orphy-review-backdrop",
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
    onClick: handleClose,
  });

  // Panel container
  panelEl = createElement("div", {
    className: "orphy-review-panel",
    styles: {
      position: "fixed",
      top: "0",
      right: "0",
      width: components.panel.width,
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

  // Header
  const header = createHeader();

  // List container (scrollable)
  listEl = createElement("div", {
    className: "orphy-review-list",
    styles: {
      flex: "1",
      overflowY: "auto",
      padding: spacing.lg,
      display: "flex",
      flexDirection: "column",
      gap: spacing.md,
    },
  });

  // Footer with actions
  const footer = createFooter();

  panelEl.appendChild(header);
  panelEl.appendChild(listEl);
  panelEl.appendChild(footer);

  document.body.appendChild(backdrop);
  document.body.appendChild(panelEl);

  // Trigger animations
  setTimeout(() => {
    backdrop.style.opacity = "1";
    if (panelEl) panelEl.style.transform = "translateX(0)";
  }, 10);

  // Render drafts
  renderDraftList();

  // Subscribe to session changes
  sessionStore.subscribe(renderDraftList);
}

export function hideReviewPanel(): void {
  if (!panelEl) return;

  const backdrop = document.querySelector(".orphy-review-backdrop");

  // Use different animation based on viewport (mobile = slide down, desktop = slide right)
  const isMobile = window.innerWidth <= 480;
  panelEl.style.transform = isMobile ? "translateY(100%)" : "translateX(100%)";

  if (backdrop instanceof HTMLElement) {
    backdrop.style.opacity = "0";
  }

  setTimeout(() => {
    panelEl?.remove();
    backdrop?.remove();
    panelEl = null;
    listEl = null;
    footerEl = null;
    submitBtnEl = null;
    isSubmitting = false;
    onSubmitAllCallback = null;
  }, 300);
}

// =============================================================================
// HEADER
// =============================================================================

function createHeader(): HTMLDivElement {
  const title = createElement("h2", {
    styles: {
      margin: "0",
      fontSize: typography.size.lg,
      fontWeight: typography.weight.semibold,
      color: colors.text.primary,
    },
    children: [t("reviewPanel.title")],
  });

  const subtitle = createElement("p", {
    styles: {
      margin: `${spacing.xs} 0 0`,
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    children: [t("reviewPanel.subtitle")],
  });

  const closeBtn = createElement("button", {
    styles: {
      position: "absolute",
      top: spacing.lg,
      right: spacing.lg,
      padding: spacing.xs,
      border: "none",
      borderRadius: borders.radius.md,
      backgroundColor: "transparent",
      color: colors.text.tertiary,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
    },
    onClick: handleClose,
    children: [createCloseIcon()],
  });

  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.backgroundColor = colors.bg.secondary;
    closeBtn.style.color = colors.text.primary;
  });
  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.backgroundColor = "transparent";
    closeBtn.style.color = colors.text.tertiary;
  });

  return createElement("div", {
    styles: {
      position: "relative",
      padding: spacing.xl,
      borderBottom: `${borders.width.thin} solid ${colors.border.default}`,
    },
    children: [title, subtitle, closeBtn],
  });
}

// =============================================================================
// FOOTER
// =============================================================================

function createFooter(): HTMLDivElement {
  const draftCount = sessionStore.getDraftCount();

  const cancelBtn = createElement("button", {
    className: "orphy-cancel-btn",
    styles: {
      flex: "1",
      padding: spacing.md,
      border: `${borders.width.thin} solid ${colors.border.default}`,
      borderRadius: borders.radius.md,
      backgroundColor: colors.bg.primary,
      color: colors.text.secondary,
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      fontFamily: typography.family.sans,
      cursor: "pointer",
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
    },
    onClick: handleClose,
    children: [t("reviewPanel.cancel")],
  });

  cancelBtn.addEventListener("mouseenter", () => {
    if (!isSubmitting) cancelBtn.style.backgroundColor = colors.bg.secondary;
  });
  cancelBtn.addEventListener("mouseleave", () => {
    cancelBtn.style.backgroundColor = colors.bg.primary;
  });

  submitBtnEl = createElement("button", {
    className: "orphy-submit-btn",
    styles: {
      flex: "2",
      padding: spacing.md,
      border: "none",
      borderRadius: borders.radius.md,
      backgroundColor:
        draftCount > 0 ? colors.text.primary : colors.bg.tertiary,
      color: draftCount > 0 ? colors.text.inverse : colors.text.tertiary,
      fontSize: typography.size.sm,
      fontWeight: typography.weight.semibold,
      fontFamily: typography.family.sans,
      cursor: draftCount > 0 ? "pointer" : "not-allowed",
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    children: [draftCount > 0 ? t("reviewPanel.submitCount", { count: draftCount }) : t("reviewPanel.submit")],
  });

  if (draftCount > 0) {
    submitBtnEl.addEventListener("click", handleSubmitAll);
    submitBtnEl.addEventListener("mouseenter", () => {
      if (!isSubmitting && submitBtnEl) submitBtnEl.style.backgroundColor = "#2d2d2a";
    });
    submitBtnEl.addEventListener("mouseleave", () => {
      if (!isSubmitting && submitBtnEl) submitBtnEl.style.backgroundColor = colors.text.primary;
    });
  }

  const buttonContainer = createElement("div", {
    styles: {
      display: "flex",
      gap: spacing.sm,
    },
    children: [cancelBtn, submitBtnEl],
  });

  footerEl = createElement("div", {
    className: "orphy-panel-footer",
    styles: {
      padding: spacing.lg,
      borderTop: `${borders.width.thin} solid ${colors.border.default}`,
      backgroundColor: colors.bg.secondary,
    },
    children: [buttonContainer],
  });

  return footerEl;
}

/**
 * Update submit button to loading state
 */
export function setSubmitLoading(loading: boolean): void {
  isSubmitting = loading;
  if (!submitBtnEl) return;

  if (loading) {
    submitBtnEl.innerHTML = "";
    submitBtnEl.appendChild(createSpinnerIcon());
    submitBtnEl.appendChild(document.createTextNode(t("reviewPanel.sending")));
    submitBtnEl.style.cursor = "not-allowed";
    submitBtnEl.style.opacity = "0.7";
  } else {
    const draftCount = sessionStore.getDraftCount();
    submitBtnEl.innerHTML = draftCount > 0 ? t("reviewPanel.submitCount", { count: draftCount }) : t("reviewPanel.submit");
    submitBtnEl.style.cursor = draftCount > 0 ? "pointer" : "not-allowed";
    submitBtnEl.style.opacity = "1";
  }
}

// =============================================================================
// DRAFT LIST
// =============================================================================

function renderDraftList(): void {
  if (!listEl) return;

  const drafts = sessionStore.getDrafts();

  // Clear list by removing children (safe DOM method)
  while (listEl.firstChild) {
    listEl.removeChild(listEl.firstChild);
  }

  if (drafts.length === 0) {
    const emptyState = createElement("div", {
      styles: {
        textAlign: "center",
        padding: `${spacing["3xl"]} ${spacing.xl}`,
        color: colors.text.tertiary,
      },
      children: [
        createEmptyIcon(),
        createElement("p", {
          styles: {
            margin: `${spacing.md} 0 0`,
            fontSize: typography.size.base,
            color: colors.text.secondary,
          },
          children: [t("reviewPanel.empty")],
        }),
        createElement("p", {
          styles: {
            margin: `${spacing.xs} 0 0`,
            fontSize: typography.size.sm,
          },
          children: [t("reviewPanel.emptyHint")],
        }),
      ],
    });
    listEl.appendChild(emptyState);
    return;
  }

  drafts.forEach((draft, index) => {
    const item = createDraftItem(draft, index + 1);
    listEl!.appendChild(item);
  });
}

function createDraftItem(draft: FeedbackDraft, number: number): HTMLDivElement {
  // Status-aware badge
  const badgeConfig = getBadgeConfig(draft.status);
  const badge = createElement("div", {
    styles: {
      width: "24px",
      height: "24px",
      borderRadius: borders.radius.full,
      backgroundColor: badgeConfig.bgColor,
      color: badgeConfig.color,
      fontSize: typography.size.xs,
      fontWeight: typography.weight.semibold,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
    },
  });

  // Show number, spinner, check, or error icon based on status
  if (draft.status === "sending") {
    badge.appendChild(createSpinnerIcon(12));
  } else if (draft.status === "sent") {
    badge.appendChild(createCheckIcon(12));
  } else if (draft.status === "error") {
    badge.appendChild(createErrorIcon(12));
  } else {
    badge.textContent = String(number);
  }

  // Type indicator (icon + label)
  const typeIndicator = createElement("div", {
    styles: {
      display: "flex",
      alignItems: "center",
      gap: spacing.xs,
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    children: [getTypeIcon(draft.feedbackType), getTypeLabel(draft.feedbackType)],
  });

  // Comment
  const comment = createElement("div", {
    styles: {
      fontSize: typography.size.sm,
      color: colors.text.primary,
      lineHeight: typography.lineHeight.base,
    },
    children: [draft.comment],
  });

  // Content container
  const content = createElement("div", {
    styles: {
      flex: "1",
      minWidth: "0",
    },
    children: [typeIndicator, comment],
  });

  // Delete button
  const deleteBtn = createElement("button", {
    styles: {
      padding: spacing.xs,
      border: "none",
      borderRadius: borders.radius.md,
      backgroundColor: "transparent",
      color: colors.text.tertiary,
      cursor: "pointer",
      flexShrink: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
    },
    onClick: () => handleDelete(draft.tempId),
    children: [createTrashIcon()],
  });

  deleteBtn.addEventListener("mouseenter", () => {
    deleteBtn.style.backgroundColor = colors.status.errorBg;
    deleteBtn.style.color = colors.status.error;
  });
  deleteBtn.addEventListener("mouseleave", () => {
    deleteBtn.style.backgroundColor = "transparent";
    deleteBtn.style.color = colors.text.tertiary;
  });

  // Item container
  const container = createElement("div", {
    className: "orphy-draft-item",
    styles: {
      display: "flex",
      gap: spacing.md,
      padding: spacing.md,
      border: `${borders.width.thin} solid ${colors.border.default}`,
      borderRadius: borders.radius.lg,
      backgroundColor: colors.bg.primary,
      cursor: "pointer",
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
    },
    children: [badge, content, deleteBtn],
    onClick: (e) => {
      // Don't scroll if clicking delete
      if ((e.target as HTMLElement).closest("button")) return;

      // Scroll element into view
      const element = draft.element;
      if (element && element.isConnected) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });

        // Add temporary flash highlight
        element.classList.add("orphy-flash-highlight");
        setTimeout(() => {
          element.classList.remove("orphy-flash-highlight");
        }, 1000);
      }
    },
  });

  container.addEventListener("mouseenter", () => {
    container.style.backgroundColor = colors.bg.secondary;
    container.style.borderColor = colors.border.hover;
  });

  container.addEventListener("mouseleave", () => {
    container.style.backgroundColor = colors.bg.primary;
    container.style.borderColor = colors.border.default;
  });

  return container;
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

function handleClose(): void {
  hideReviewPanel();
}

function handleDelete(tempId: string): void {
  sessionStore.removeDraft(tempId);
}

function handleSubmitAll(): void {
  const drafts = sessionStore.getDrafts().filter((d) => d.status === "draft");
  if (drafts.length === 0) return;
  onSubmitAllCallback?.(drafts);
}

// =============================================================================
// ICONS
// =============================================================================

function createCloseIcon(): HTMLElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", "18");
  line1.setAttribute("y1", "6");
  line1.setAttribute("x2", "6");
  line1.setAttribute("y2", "18");
  svg.appendChild(line1);

  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", "6");
  line2.setAttribute("y1", "6");
  line2.setAttribute("x2", "18");
  line2.setAttribute("y2", "18");
  svg.appendChild(line2);

  return svg as unknown as HTMLElement;
}

function createTrashIcon(): HTMLElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M3 6h18");
  svg.appendChild(path1);

  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute(
    "d",
    "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
  );
  svg.appendChild(path2);

  return svg as unknown as HTMLElement;
}

function createEmptyIcon(): HTMLElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "48");
  svg.setAttribute("height", "48");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.opacity = "0.3";

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  );
  svg.appendChild(path);

  return svg as unknown as HTMLElement;
}

// =============================================================================
// TYPE ICONS (Lucide - inlined SVGs)
// =============================================================================

function getTypeLabel(type: FeedbackType): string {
  return t(`types.${type}`);
}

function createSvgBase(size: number = 12): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  return svg;
}

function createPath(d: string): SVGPathElement {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  return path;
}

function createCircle(cx: number, cy: number, r: number, fill?: string): SVGCircleElement {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", String(cx));
  circle.setAttribute("cy", String(cy));
  circle.setAttribute("r", String(r));
  if (fill) circle.setAttribute("fill", fill);
  return circle;
}

function getTypeIcon(type: FeedbackType): HTMLElement {
  switch (type) {
    case "bug": return createBugIcon();
    case "design": return createPaletteIcon();
    case "content": return createFileTextIcon();
    case "question": return createHelpCircleIcon();
  }
}

function createBugIcon(): HTMLElement {
  const svg = createSvgBase();
  svg.appendChild(createPath("m8 2 1.88 1.88"));
  svg.appendChild(createPath("M14.12 3.88 16 2"));
  svg.appendChild(createPath("M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"));
  svg.appendChild(createPath("M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"));
  svg.appendChild(createPath("M12 20v-9"));
  svg.appendChild(createPath("M6.53 9C4.6 8.8 3 7.1 3 5"));
  svg.appendChild(createPath("M6 13H2"));
  svg.appendChild(createPath("M3 21c0-2.1 1.7-3.9 3.8-4"));
  svg.appendChild(createPath("M20.97 5c0 2.1-1.6 3.8-3.5 4"));
  svg.appendChild(createPath("M22 13h-4"));
  svg.appendChild(createPath("M17.2 17c2.1.1 3.8 1.9 3.8 4"));
  return svg as unknown as HTMLElement;
}

function createPaletteIcon(): HTMLElement {
  const svg = createSvgBase();
  svg.appendChild(createCircle(13.5, 6.5, 0.5, "currentColor"));
  svg.appendChild(createCircle(17.5, 10.5, 0.5, "currentColor"));
  svg.appendChild(createCircle(8.5, 7.5, 0.5, "currentColor"));
  svg.appendChild(createCircle(6.5, 12.5, 0.5, "currentColor"));
  svg.appendChild(createPath("M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"));
  return svg as unknown as HTMLElement;
}

function createFileTextIcon(): HTMLElement {
  const svg = createSvgBase();
  svg.appendChild(createPath("M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"));
  svg.appendChild(createPath("M14 2v4a2 2 0 0 0 2 2h4"));
  svg.appendChild(createPath("M10 9H8"));
  svg.appendChild(createPath("M16 13H8"));
  svg.appendChild(createPath("M16 17H8"));
  return svg as unknown as HTMLElement;
}

function createHelpCircleIcon(): HTMLElement {
  const svg = createSvgBase();
  svg.appendChild(createCircle(12, 12, 10));
  svg.appendChild(createPath("M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"));
  svg.appendChild(createPath("M12 17h.01"));
  return svg as unknown as HTMLElement;
}

// =============================================================================
// STATUS ICONS & HELPERS
// =============================================================================

interface BadgeConfig {
  bgColor: string;
  color: string;
}

function getBadgeConfig(status: DraftStatus): BadgeConfig {
  switch (status) {
    case "sending":
      return { bgColor: colors.status.sendingBg, color: colors.status.sending };
    case "sent":
      return { bgColor: colors.status.successBg, color: colors.status.success };
    case "error":
      return { bgColor: colors.status.errorBg, color: colors.status.error };
    default:
      return { bgColor: colors.accent.soft, color: colors.accent.primary };
  }
}

function createSpinnerIcon(size: number = 14): HTMLElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10");
  circle.setAttribute("stroke-opacity", "0.25");
  svg.appendChild(circle);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M12 2a10 10 0 0 1 10 10");
  svg.appendChild(path);

  // Add spinning animation
  svg.style.animation = "orphy-spin 1s linear infinite";

  return svg as unknown as HTMLElement;
}

function createCheckIcon(size: number = 14): HTMLElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M20 6 9 17l-5-5");
  svg.appendChild(path);

  return svg as unknown as HTMLElement;
}

function createErrorIcon(size: number = 14): HTMLElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M18 6 6 18");
  svg.appendChild(path1);

  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute("d", "m6 6 12 12");
  svg.appendChild(path2);

  return svg as unknown as HTMLElement;
}
