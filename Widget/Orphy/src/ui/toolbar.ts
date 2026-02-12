/**
 * Toolbar for toggling review mode
 * Design: Notion-like - calm, subtle, inviting
 */

import { createElement } from "../utils/dom";
import { store } from "../core/state";
import { sessionStore } from "../core/session";
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

let toolbarEl: HTMLDivElement | null = null;
let buttonEl: HTMLButtonElement | null = null;
let reviewButtonEl: HTMLButtonElement | null = null;
let messagesButtonEl: HTMLButtonElement | null = null;
let counterBadgeEl: HTMLSpanElement | null = null;
let messagesBadgeEl: HTMLSpanElement | null = null;
let onToggle: ((active: boolean) => void) | null = null;
let onReview: (() => void) | null = null;
let onMessages: (() => void) | null = null;

// =============================================================================
// STYLES
// =============================================================================

const TOOLBAR_STYLES: Partial<CSSStyleDeclaration> = {
  position: "fixed",
  bottom: components.toolbar.bottom,
  right: components.toolbar.right,
  zIndex: zIndex.toolbar,
  fontFamily: typography.family.sans,
  display: "flex",
  gap: spacing.sm,
  alignItems: "flex-end",
  flexDirection: "column",
};

const BUTTON_BASE: Partial<CSSStyleDeclaration> = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  padding: "12px 20px",
  border: `${borders.width.thin} solid ${colors.border.default}`,
  borderRadius: borders.radius.xl,
  cursor: "pointer",
  fontSize: typography.size.md,
  fontWeight: typography.weight.medium,
  fontFamily: typography.family.sans,
  boxShadow: shadows.lg,
  transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
  outline: "none",
};

const INACTIVE_STYLES: Partial<CSSStyleDeclaration> = {
  ...BUTTON_BASE,
  backgroundColor: colors.bg.primary,
  color: colors.text.primary,
};

const INACTIVE_HOVER: Partial<CSSStyleDeclaration> = {
  backgroundColor: colors.bg.secondary,
  borderColor: colors.border.hover,
};

const ACTIVE_STYLES: Partial<CSSStyleDeclaration> = {
  ...BUTTON_BASE,
  backgroundColor: colors.text.primary,
  color: colors.text.inverse,
  borderColor: colors.text.primary,
};

const ACTIVE_HOVER: Partial<CSSStyleDeclaration> = {
  backgroundColor: "#2d2d2a",
};

const REVIEW_BUTTON_STYLES: Partial<CSSStyleDeclaration> = {
  ...BUTTON_BASE,
  backgroundColor: colors.bg.primary,
  color: colors.text.primary,
  display: "none",
};

const REVIEW_BUTTON_HOVER: Partial<CSSStyleDeclaration> = {
  backgroundColor: colors.bg.secondary,
  borderColor: colors.border.hover,
};

const MESSAGES_BUTTON_STYLES: Partial<CSSStyleDeclaration> = {
  ...BUTTON_BASE,
  backgroundColor: colors.bg.primary,
  color: colors.text.primary,
};

const MESSAGES_BUTTON_HOVER: Partial<CSSStyleDeclaration> = {
  backgroundColor: colors.bg.secondary,
  borderColor: colors.border.hover,
};

const COUNTER_BADGE_STYLES: Partial<CSSStyleDeclaration> = {
  minWidth: components.badge.size,
  height: components.badge.size,
  borderRadius: borders.radius.full,
  backgroundColor: colors.accent.primary,
  color: colors.text.inverse,
  fontSize: components.badge.fontSize,
  fontWeight: typography.weight.semibold,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: `0 ${spacing.xs}`,
  marginLeft: spacing.xs,
};

// =============================================================================
// PUBLIC API
// =============================================================================

export function createToolbar(
  toggle: (active: boolean) => void,
  review: () => void,
  messages?: () => void
): void {
  if (toolbarEl) return;

  onToggle = toggle;
  onReview = review;
  onMessages = messages ?? null;

  // Main toggle button
  buttonEl = createElement("button", {
    className: "orphy-toolbar-btn",
    styles: INACTIVE_STYLES,
    onClick: handleClick,
    children: [createIcon(), t("toolbar.feedback")],
  });

  // Add hover effects
  addHoverEffect(buttonEl, false);

  // Review button (initially hidden)
  reviewButtonEl = createReviewButton();

  // Messages button (for viewing threads)
  messagesButtonEl = createMessagesButton();

  // Powered by link
  const poweredByEl = createPoweredByLink();

  toolbarEl = createElement("div", {
    className: "orphy-toolbar",
    styles: TOOLBAR_STYLES,
    children: [reviewButtonEl, messagesButtonEl, buttonEl, poweredByEl],
  });

  document.body.appendChild(toolbarEl);

  // Subscribe to state changes
  store.subscribe(updateButtonState);
  store.subscribe(updateReviewButton);
  sessionStore.subscribe(updateReviewButton);
}

export function destroyToolbar(): void {
  if (!toolbarEl) return;

  toolbarEl.remove();
  toolbarEl = null;
  buttonEl = null;
  reviewButtonEl = null;
  messagesButtonEl = null;
  counterBadgeEl = null;
  messagesBadgeEl = null;
  onToggle = null;
  onReview = null;
  onMessages = null;
}

/**
 * Update the messages badge count
 */
export function updateMessagesBadge(count: number): void {
  if (!messagesButtonEl || !messagesBadgeEl) return;

  if (count > 0) {
    messagesBadgeEl.textContent = String(count);
    messagesBadgeEl.style.display = "flex";
  } else {
    messagesBadgeEl.style.display = "none";
  }
}

/**
 * Show/hide the messages button
 */
export function setMessagesButtonVisible(visible: boolean): void {
  if (!messagesButtonEl) return;
  messagesButtonEl.style.display = visible ? "flex" : "none";
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

function handleClick(): void {
  const { active } = store.getState();
  onToggle?.(!active);
}

function handleReviewClick(): void {
  onReview?.();
}

function handleMessagesClick(): void {
  onMessages?.();
}

// =============================================================================
// STATE UPDATES
// =============================================================================

function updateButtonState(state: { active: boolean }): void {
  if (!buttonEl) return;

  const baseStyles = state.active ? ACTIVE_STYLES : INACTIVE_STYLES;
  Object.assign(buttonEl.style, baseStyles);

  // Update hover effect
  addHoverEffect(buttonEl, state.active);

  // Update content
  buttonEl.textContent = "";
  buttonEl.appendChild(createIcon());
  buttonEl.appendChild(
    document.createTextNode(state.active ? t("toolbar.done") : t("toolbar.feedback"))
  );
}

function updateReviewButton(): void {
  if (!reviewButtonEl || !counterBadgeEl) return;

  const { active } = store.getState();
  const draftCount = sessionStore.getDraftCount();

  if (active && draftCount > 0) {
    reviewButtonEl.style.display = "flex";
    counterBadgeEl.textContent = String(draftCount);
  } else {
    reviewButtonEl.style.display = "none";
  }
}

// =============================================================================
// COMPONENT CREATION
// =============================================================================

function createReviewButton(): HTMLButtonElement {
  counterBadgeEl = createElement("span", {
    className: "orphy-counter-badge",
    styles: COUNTER_BADGE_STYLES,
    children: ["0"],
  });

  const button = createElement("button", {
    className: "orphy-review-btn",
    styles: REVIEW_BUTTON_STYLES,
    onClick: handleReviewClick,
    children: [createReviewIcon(), t("toolbar.review"), counterBadgeEl],
  });

  // Add hover effect
  button.addEventListener("mouseenter", () => {
    if (button.style.display !== "none") {
      Object.assign(button.style, REVIEW_BUTTON_HOVER);
    }
  });
  button.addEventListener("mouseleave", () => {
    if (button.style.display !== "none") {
      Object.assign(button.style, REVIEW_BUTTON_STYLES, { display: "flex" });
    }
  });

  return button;
}

function createIcon(): HTMLElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  // Comment bubble icon
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  );
  svg.appendChild(path);

  return svg as unknown as HTMLElement;
}

function createReviewIcon(): HTMLElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  // Checklist icon
  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M9 11l3 3L22 4");
  svg.appendChild(path1);

  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute(
    "d",
    "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
  );
  svg.appendChild(path2);

  return svg as unknown as HTMLElement;
}

// =============================================================================
// HOVER EFFECTS
// =============================================================================

function createMessagesButton(): HTMLButtonElement {
  messagesBadgeEl = createElement("span", {
    className: "orphy-messages-badge",
    styles: COUNTER_BADGE_STYLES,
    children: ["0"],
  });
  messagesBadgeEl.style.display = "none";

  const button = createElement("button", {
    className: "orphy-messages-btn",
    styles: MESSAGES_BUTTON_STYLES,
    onClick: handleMessagesClick,
    children: [createMessagesIcon(), t("toolbar.messages"), messagesBadgeEl],
  });

  // Add hover effect
  button.addEventListener("mouseenter", () => {
    Object.assign(button.style, MESSAGES_BUTTON_HOVER);
  });
  button.addEventListener("mouseleave", () => {
    Object.assign(button.style, MESSAGES_BUTTON_STYLES);
  });

  return button;
}

function createMessagesIcon(): HTMLElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  // Chat bubbles icon (messages/conversation)
  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute(
    "d",
    "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
  );
  svg.appendChild(path1);

  return svg as unknown as HTMLElement;
}

function createPoweredByLink(): HTMLElement {
  const link = document.createElement("a");
  link.href = "https://app.orphy.app?ref=widget";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  Object.assign(link.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    padding: "4px 10px",
    fontSize: typography.size.xs,
    fontFamily: typography.family.sans,
    color: colors.text.inverse,
    backgroundColor: colors.accent.primary,
    border: `${borders.width.thin} solid ${colors.accent.primary}`,
    borderRadius: borders.radius.full,
    textDecoration: "none",
    transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
  } satisfies Partial<CSSStyleDeclaration>);

  // Dot icon
  const dot = createElement("span", {
    styles: {
      width: "6px",
      height: "6px",
      borderRadius: borders.radius.full,
      backgroundColor: colors.text.inverse,
      flexShrink: "0",
    },
  });

  const brandName = createElement("span", {
    styles: { fontWeight: typography.weight.semibold },
    children: ["Orphy"],
  });

  link.appendChild(dot);
  link.appendChild(document.createTextNode("Powered by "));
  link.appendChild(brandName);

  link.addEventListener("mouseenter", () => {
    link.style.backgroundColor = colors.accent.soft;
    link.style.color = colors.accent.primary;
    link.style.borderColor = "rgba(212, 163, 115, 0.2)";
    dot.style.backgroundColor = colors.accent.primary;
  });
  link.addEventListener("mouseleave", () => {
    link.style.backgroundColor = colors.accent.primary;
    link.style.color = colors.text.inverse;
    link.style.borderColor = colors.accent.primary;
    dot.style.backgroundColor = colors.text.inverse;
  });

  return link;
}

function addHoverEffect(element: HTMLButtonElement, isActive: boolean): void {
  // Remove existing listeners by cloning
  const newElement = element.cloneNode(true) as HTMLButtonElement;
  element.parentNode?.replaceChild(newElement, element);
  buttonEl = newElement;

  // Re-attach click handler
  newElement.addEventListener("click", handleClick);

  // Add hover listeners
  newElement.addEventListener("mouseenter", () => {
    Object.assign(
      newElement.style,
      isActive ? ACTIVE_HOVER : INACTIVE_HOVER
    );
  });

  newElement.addEventListener("mouseleave", () => {
    Object.assign(
      newElement.style,
      isActive ? ACTIVE_STYLES : INACTIVE_STYLES
    );
  });
}
