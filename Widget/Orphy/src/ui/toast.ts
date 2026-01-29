/**
 * Toast notification system
 * Design: Notion-like - subtle, informative, non-intrusive
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
} from "../theme";

export type ToastType = "success" | "error" | "info";

interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number; // ms, 0 = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Toast {
  id: string;
  element: HTMLDivElement;
  options: ToastOptions;
  timeoutId?: ReturnType<typeof setTimeout>;
}

// Toast container and active toasts
let containerEl: HTMLDivElement | null = null;
const activeToasts: Map<string, Toast> = new Map();

// Default durations by type
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 0, // Persistent - user must dismiss
  info: 3000,
};

// Icons and colors by type
const TYPE_CONFIG: Record<ToastType, { bgColor: string; textColor: string; iconColor: string }> = {
  success: {
    bgColor: colors.bg.primary,
    textColor: colors.text.primary,
    iconColor: colors.status.success,
  },
  error: {
    bgColor: colors.bg.primary,
    textColor: colors.text.primary,
    iconColor: colors.status.error,
  },
  info: {
    bgColor: colors.bg.primary,
    textColor: colors.text.primary,
    iconColor: colors.accent.primary,
  },
};

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Show a toast notification
 */
export function showToast(options: ToastOptions): string {
  ensureContainer();

  const id = generateId();
  const duration = options.duration ?? DEFAULT_DURATIONS[options.type];
  const config = TYPE_CONFIG[options.type];

  // Create toast element
  const toastEl = createElement("div", {
    className: `orphy-toast orphy-toast-${options.type}`,
    styles: {
      display: "flex",
      alignItems: "flex-start",
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: config.bgColor,
      borderRadius: borders.radius.lg,
      boxShadow: shadows.lg,
      border: `${borders.width.thin} solid ${colors.border.default}`,
      fontFamily: typography.family.sans,
      fontSize: typography.size.sm,
      color: config.textColor,
      maxWidth: "320px",
      opacity: "0",
      transform: "translateY(10px)",
      transition: `all ${transitions.duration.base} ${transitions.easing.out}`,
      pointerEvents: "auto",
    },
  });

  // Icon
  const icon = createIcon(options.type);
  icon.style.color = config.iconColor;
  icon.style.flexShrink = "0";
  icon.style.marginTop = "2px";
  toastEl.appendChild(icon);

  // Content container
  const content = createElement("div", {
    styles: {
      flex: "1",
      display: "flex",
      flexDirection: "column",
      gap: spacing.xs,
    },
  });

  // Message
  const message = createElement("div", {
    styles: {
      lineHeight: typography.lineHeight.base,
    },
    children: [options.message],
  });
  content.appendChild(message);

  // Action button (if provided)
  if (options.action) {
    const actionBtn = createElement("button", {
      styles: {
        alignSelf: "flex-start",
        padding: `${spacing.xs} ${spacing.sm}`,
        marginTop: spacing.xs,
        border: "none",
        borderRadius: borders.radius.md,
        backgroundColor: options.type === "error" ? colors.status.errorBg : colors.bg.secondary,
        color: options.type === "error" ? colors.status.error : colors.text.primary,
        fontSize: typography.size.xs,
        fontWeight: typography.weight.medium,
        fontFamily: typography.family.sans,
        cursor: "pointer",
        transition: `all ${transitions.duration.fast} ${transitions.easing.default}`,
      },
      onClick: () => {
        options.action!.onClick();
        hideToast(id);
      },
      children: [options.action.label],
    });
    content.appendChild(actionBtn);
  }

  toastEl.appendChild(content);

  // Close button
  const closeBtn = createElement("button", {
    styles: {
      padding: spacing.xs,
      border: "none",
      borderRadius: borders.radius.md,
      backgroundColor: "transparent",
      color: colors.text.tertiary,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      transition: `all ${transitions.duration.fast} ${transitions.easing.default}`,
    },
    onClick: () => hideToast(id),
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

  toastEl.appendChild(closeBtn);

  // Add to container
  containerEl!.appendChild(toastEl);

  // Store toast
  const toast: Toast = { id, element: toastEl, options };
  activeToasts.set(id, toast);

  // Animate in
  setTimeout(() => {
    toastEl.style.opacity = "1";
    toastEl.style.transform = "translateY(0)";
  }, 10);

  // Auto-dismiss
  if (duration > 0) {
    toast.timeoutId = setTimeout(() => hideToast(id), duration);
  }

  return id;
}

/**
 * Hide a specific toast
 */
export function hideToast(id: string): void {
  const toast = activeToasts.get(id);
  if (!toast) return;

  // Clear timeout if exists
  if (toast.timeoutId) {
    clearTimeout(toast.timeoutId);
  }

  // Animate out
  toast.element.style.opacity = "0";
  toast.element.style.transform = "translateY(10px)";

  setTimeout(() => {
    toast.element.remove();
    activeToasts.delete(id);

    // Remove container if empty
    if (activeToasts.size === 0 && containerEl) {
      containerEl.remove();
      containerEl = null;
    }
  }, 200);
}

/**
 * Hide all toasts
 */
export function hideAllToasts(): void {
  activeToasts.forEach((_, id) => hideToast(id));
}

// =============================================================================
// HELPERS
// =============================================================================

function ensureContainer(): void {
  if (containerEl) return;

  containerEl = createElement("div", {
    className: "orphy-toast-container",
    styles: {
      position: "fixed",
      bottom: spacing.xl,
      left: spacing.xl,
      zIndex: zIndex.modal,
      display: "flex",
      flexDirection: "column",
      gap: spacing.sm,
      pointerEvents: "none",
    },
  });

  document.body.appendChild(containerEl);
}

function generateId(): string {
  return `toast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// =============================================================================
// ICONS (Lucide - inlined)
// =============================================================================

function createSvgBase(size: number = 16): SVGSVGElement {
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

function createIcon(type: ToastType): HTMLElement {
  switch (type) {
    case "success": return createCheckCircleIcon();
    case "error": return createAlertCircleIcon();
    case "info": return createInfoIcon();
  }
}

function createCheckCircleIcon(): HTMLElement {
  const svg = createSvgBase();
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10");
  svg.appendChild(circle);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "m9 12 2 2 4-4");
  svg.appendChild(path);

  return svg as unknown as HTMLElement;
}

function createAlertCircleIcon(): HTMLElement {
  const svg = createSvgBase();
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10");
  svg.appendChild(circle);

  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", "12");
  line1.setAttribute("y1", "8");
  line1.setAttribute("x2", "12");
  line1.setAttribute("y2", "12");
  svg.appendChild(line1);

  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", "12");
  line2.setAttribute("y1", "16");
  line2.setAttribute("x2", "12.01");
  line2.setAttribute("y2", "16");
  svg.appendChild(line2);

  return svg as unknown as HTMLElement;
}

function createInfoIcon(): HTMLElement {
  const svg = createSvgBase();
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10");
  svg.appendChild(circle);

  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", "12");
  line1.setAttribute("y1", "16");
  line1.setAttribute("x2", "12");
  line1.setAttribute("y2", "12");
  svg.appendChild(line1);

  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", "12");
  line2.setAttribute("y1", "8");
  line2.setAttribute("x2", "12.01");
  line2.setAttribute("y2", "8");
  svg.appendChild(line2);

  return svg as unknown as HTMLElement;
}

function createCloseIcon(): HTMLElement {
  const svg = createSvgBase(14);
  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M18 6 6 18");
  svg.appendChild(path1);

  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute("d", "m6 6 12 12");
  svg.appendChild(path2);

  return svg as unknown as HTMLElement;
}
