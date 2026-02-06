/**
 * Minimized bar - Compact bottom bar for navigating feedbacks when panel is minimized
 * Shared component used by both review-panel and threads-panel
 */

import { createElement } from "../utils/dom";
import { t } from "../i18n";
import {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  transitions,
  zIndex,
} from "../theme";

// =============================================================================
// TYPES
// =============================================================================

export interface MinimizedItem {
  id: string;
  typeLabel: string;
  typeColor: string;
  comment: string;
  statusLabel?: string;
  statusColor?: string;
  statusBg?: string;
}

export interface MinimizedBarOptions {
  items: MinimizedItem[];
  initialIndex?: number;
  onExpand: () => void;
  onItemChange?: (item: MinimizedItem, index: number) => void;
}

export interface MinimizedBarAPI {
  destroy: () => void;
  updateItems: (items: MinimizedItem[], index?: number) => void;
}

// =============================================================================
// STATE
// =============================================================================

let barEl: HTMLDivElement | null = null;
let currentIndex = 0;
let currentItems: MinimizedItem[] = [];
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

// UI references for updates
let typeBadgeEl: HTMLSpanElement | null = null;
let commentEl: HTMLDivElement | null = null;
let counterEl: HTMLSpanElement | null = null;
let prevBtnEl: HTMLButtonElement | null = null;
let nextBtnEl: HTMLButtonElement | null = null;
let onExpandCallback: (() => void) | null = null;
let onItemChangeCallback: ((item: MinimizedItem, index: number) => void) | null = null;

// =============================================================================
// PUBLIC API
// =============================================================================

export function createMinimizedBar(options: MinimizedBarOptions): MinimizedBarAPI {
  // Destroy any existing bar
  destroyMinimizedBar();

  currentItems = options.items;
  currentIndex = options.initialIndex ?? 0;
  onExpandCallback = options.onExpand;
  onItemChangeCallback = options.onItemChange ?? null;

  // Build bar
  barEl = createElement("div", {
    className: "orphy-minimized-bar",
    styles: {
      position: "fixed",
      bottom: spacing.xl,
      left: "50%",
      transform: "translateX(-50%) translateY(20px)",
      maxWidth: "480px",
      height: "40px",
      backgroundColor: colors.bg.primary,
      border: `${borders.width.thin} solid ${colors.border.default}`,
      borderRadius: borders.radius.xl,
      boxShadow: shadows.lg,
      zIndex: zIndex.toolbar,
      display: "inline-flex",
      alignItems: "center",
      gap: spacing.xs,
      padding: `0 ${spacing.sm}`,
      fontFamily: typography.family.sans,
      opacity: "0",
      transition: `all ${transitions.duration.slow} ${transitions.easing.out}`,
    },
  });

  // Prev button
  prevBtnEl = createNavButton(createChevronLeftIcon(), t("minimizedBar.previous"), handlePrev);

  // Type badge
  typeBadgeEl = createElement("span", {
    styles: {
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: borders.radius.full,
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
      whiteSpace: "nowrap",
      flexShrink: "0",
    },
  });

  // Comment preview
  commentEl = createElement("div", {
    styles: {
      maxWidth: "200px",
      minWidth: "0",
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  });

  // Counter
  counterEl = createElement("span", {
    styles: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
      whiteSpace: "nowrap",
      flexShrink: "0",
    },
  });

  // Next button
  nextBtnEl = createNavButton(createChevronRightIcon(), t("minimizedBar.next"), handleNext);

  // Separator
  const separator = createElement("div", {
    styles: {
      width: borders.width.thin,
      height: "24px",
      backgroundColor: colors.border.default,
      flexShrink: "0",
    },
  });

  // Expand button
  const expandBtn = createNavButton(createChevronUpIcon(), t("minimizedBar.expand"), handleExpand);

  barEl.appendChild(prevBtnEl);
  barEl.appendChild(typeBadgeEl);
  barEl.appendChild(commentEl);
  barEl.appendChild(counterEl);
  barEl.appendChild(nextBtnEl);
  barEl.appendChild(separator);
  barEl.appendChild(expandBtn);

  // Render current item
  renderCurrentItem();

  // Handle single item: hide nav
  updateNavVisibility();

  // Mount
  document.body.appendChild(barEl);

  // Animate in
  setTimeout(() => {
    if (barEl) {
      barEl.style.transform = "translateX(-50%) translateY(0)";
      barEl.style.opacity = "1";
    }
  }, 10);

  // Keyboard navigation
  keyHandler = (e: KeyboardEvent) => {
    if (!barEl) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };
  barEl.addEventListener("keydown", keyHandler);
  barEl.setAttribute("tabindex", "0");

  // Mobile responsive
  applyResponsiveStyles();

  return {
    destroy: destroyMinimizedBar,
    updateItems,
  };
}

export function destroyMinimizedBar(): void {
  if (!barEl) return;

  // Animate out
  barEl.style.transform = "translateX(-50%) translateY(20px)";
  barEl.style.opacity = "0";

  const el = barEl;
  setTimeout(() => {
    el.remove();
  }, 200);

  barEl = null;
  typeBadgeEl = null;
  commentEl = null;
  counterEl = null;
  prevBtnEl = null;
  nextBtnEl = null;
  keyHandler = null;
  onExpandCallback = null;
  onItemChangeCallback = null;
  currentItems = [];
  currentIndex = 0;
}

export function isMinimizedBarActive(): boolean {
  return barEl !== null;
}

// =============================================================================
// INTERNAL
// =============================================================================

function updateItems(items: MinimizedItem[], index?: number): void {
  currentItems = items;
  if (index !== undefined) {
    currentIndex = index;
  }
  // Clamp index
  if (currentIndex >= currentItems.length) {
    currentIndex = Math.max(0, currentItems.length - 1);
  }
  renderCurrentItem();
  updateNavVisibility();
}

function renderCurrentItem(): void {
  const item = currentItems[currentIndex];
  if (!item || !typeBadgeEl || !commentEl || !counterEl) return;

  // Type badge
  typeBadgeEl.textContent = item.typeLabel;
  typeBadgeEl.style.backgroundColor = `${item.typeColor}15`;
  typeBadgeEl.style.color = item.typeColor;

  // Comment
  commentEl.textContent = item.comment;

  // Counter
  counterEl.textContent = `${currentIndex + 1}/${currentItems.length}`;
}

function updateNavVisibility(): void {
  const singleItem = currentItems.length <= 1;

  if (prevBtnEl) prevBtnEl.style.display = singleItem ? "none" : "flex";
  if (nextBtnEl) nextBtnEl.style.display = singleItem ? "none" : "flex";
  if (counterEl) counterEl.style.display = singleItem ? "none" : "inline";
}

function handlePrev(): void {
  if (currentItems.length <= 1) return;
  currentIndex = currentIndex <= 0 ? currentItems.length - 1 : currentIndex - 1;
  renderCurrentItem();
  notifyItemChange();
}

function handleNext(): void {
  if (currentItems.length <= 1) return;
  currentIndex = currentIndex >= currentItems.length - 1 ? 0 : currentIndex + 1;
  renderCurrentItem();
  notifyItemChange();
}

function handleExpand(): void {
  onExpandCallback?.();
}

function notifyItemChange(): void {
  const item = currentItems[currentIndex];
  if (item) {
    onItemChangeCallback?.(item, currentIndex);
  }
}

function applyResponsiveStyles(): void {
  if (!barEl) return;
  if (window.innerWidth <= 480) {
    barEl.style.left = "16px";
    barEl.style.right = "16px";
    barEl.style.maxWidth = "none";
    barEl.style.transform = "translateY(20px)";
    // Re-trigger animate-in without centering transform
    setTimeout(() => {
      if (barEl) {
        barEl.style.transform = "translateY(0)";
        barEl.style.opacity = "1";
      }
    }, 10);
  }
}

// =============================================================================
// UI HELPERS
// =============================================================================

function createNavButton(icon: SVGSVGElement, title: string, onClick: () => void): HTMLButtonElement {
  const btn = createElement("button", {
    styles: {
      width: "24px",
      height: "24px",
      border: "none",
      borderRadius: borders.radius.md,
      backgroundColor: "transparent",
      color: colors.text.tertiary,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      padding: "0",
      margin: "0",
      lineHeight: "0",
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
    },
    onClick,
    attributes: { title },
    children: [icon as unknown as HTMLElement],
  }) as HTMLButtonElement;

  btn.addEventListener("mouseenter", () => {
    btn.style.backgroundColor = colors.bg.secondary;
    btn.style.color = colors.text.primary;
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.backgroundColor = "transparent";
    btn.style.color = colors.text.tertiary;
  });

  return btn;
}

// =============================================================================
// ICONS
// =============================================================================

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
  svg.style.display = "block";
  svg.style.flexShrink = "0";
  return svg;
}

function createChevronLeftIcon(): SVGSVGElement {
  const svg = createSvgBase();
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "m15 18-6-6 6-6");
  svg.appendChild(path);
  return svg;
}

function createChevronRightIcon(): SVGSVGElement {
  const svg = createSvgBase();
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "m9 18 6-6-6-6");
  svg.appendChild(path);
  return svg;
}

function createChevronUpIcon(): SVGSVGElement {
  const svg = createSvgBase();
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "m18 15-6-6-6 6");
  svg.appendChild(path);
  return svg;
}
