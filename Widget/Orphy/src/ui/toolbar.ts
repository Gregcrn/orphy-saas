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
let counterBadgeEl: HTMLSpanElement | null = null;
let onToggle: ((active: boolean) => void) | null = null;
let onReview: (() => void) | null = null;

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
  padding: components.button.padding.md,
  border: `${borders.width.thin} solid ${colors.border.default}`,
  borderRadius: borders.radius.lg,
  cursor: "pointer",
  fontSize: typography.size.base,
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
  review: () => void
): void {
  if (toolbarEl) return;

  onToggle = toggle;
  onReview = review;

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

  toolbarEl = createElement("div", {
    className: "orphy-toolbar",
    styles: TOOLBAR_STYLES,
    children: [reviewButtonEl, buttonEl],
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
  counterBadgeEl = null;
  onToggle = null;
  onReview = null;
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
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
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
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
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
