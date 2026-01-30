/**
 * Threads panel - Shows all feedbacks for the current page with their replies
 * Client can view conversations and reply to agency comments
 *
 * Uses SlidePanel for generic panel logic and manages list/detail views internally
 * to avoid animation conflicts when switching between views.
 */

import { createElement } from "../utils/dom";
import { t } from "../i18n";
import { createSlidePanel, type SlidePanelAPI } from "./slide-panel";
import type { FeedbackThread, Reply } from "../core/threads";
import { validateFeedback } from "../core/threads";
import type { FeedbackType } from "../core/state";
import {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  transitions,
} from "../theme";

// =============================================================================
// DESIGN TOKENS (type-specific colors)
// =============================================================================

const TYPE_COLORS: Record<FeedbackType, string> = {
  bug: "#ef4444",
  design: "#8b5cf6",
  content: "#3b82f6",
  question: "#f59e0b",
};

const AUTHOR_COLORS = {
  agency: "#8b5cf6",
  agencyBg: "#f3e8ff",
  client: colors.accent.primary,
  clientBg: colors.accent.soft,
} as const;

const STATUS_COLORS = {
  open: { bg: "#fef3c7", color: "#d97706", label: "En attente" },
  treated: { bg: "#dbeafe", color: "#2563eb", label: "Traité" },
  validated: { bg: "#dcfce7", color: "#16a34a", label: "Validé" },
  // Legacy status - maps to "treated" visually
  resolved: { bg: "#dbeafe", color: "#2563eb", label: "Traité" },
} as const;

// =============================================================================
// STATE
// =============================================================================

type ViewMode = "list" | "detail";

let slidePanelAPI: SlidePanelAPI | null = null;
let currentView: ViewMode = "list";
let currentThread: FeedbackThread | null = null;
let threads: FeedbackThread[] = [];
let selectedThreadId: string | null = null;

// Callbacks
let onThreadSelectCallback: ((thread: FeedbackThread) => void) | null = null;
let onCloseCallback: (() => void) | null = null;
let onBackToListCallback: (() => void) | null = null;
let onReplySubmitCallback: ((feedbackId: string, content: string) => Promise<Reply | null>) | null = null;

// UI element references (for detail view)
let repliesListEl: HTMLDivElement | null = null;
let replyInputEl: HTMLTextAreaElement | null = null;
let sendButtonEl: HTMLButtonElement | null = null;

// Additional keyboard handler for Ctrl+Enter in detail view
let detailKeyHandler: ((e: KeyboardEvent) => void) | null = null;

// =============================================================================
// PUBLIC API
// =============================================================================

export interface ThreadsPanelOptions {
  onSelect: (thread: FeedbackThread) => void;
  onClose: () => void;
  onBackToList?: () => void;
  onReplySubmit?: (feedbackId: string, content: string) => Promise<Reply | null>;
}

export function showThreadsPanel(
  threadsList: FeedbackThread[],
  options: ThreadsPanelOptions
): void {
  // If already open, just update content
  if (slidePanelAPI?.isOpen()) {
    threads = threadsList;
    renderListView();
    return;
  }

  // Store state
  threads = threadsList;
  currentView = "list";
  currentThread = null;
  selectedThreadId = null;
  onThreadSelectCallback = options.onSelect;
  onCloseCallback = options.onClose;
  onBackToListCallback = options.onBackToList ?? null;
  onReplySubmitCallback = options.onReplySubmit ?? null;

  // Create panel
  slidePanelAPI = createSlidePanel({
    onClose: handlePanelClose,
  });

  // Render initial list view
  renderListView();
}

export function hideThreadsPanel(): void {
  slidePanelAPI?.close();
}

export function updateThreadsPanel(threadsList: FeedbackThread[]): void {
  threads = threadsList;
  if (currentView === "list") {
    renderListView();
  }
}

export function selectThread(threadId: string): void {
  selectedThreadId = threadId;
  // If in list view, update selection UI
  if (currentView === "list") {
    renderListView();
  }
}

/**
 * Show detail view for a specific thread (called from index.ts)
 */
export function showThreadDetail(
  thread: FeedbackThread,
  options: {
    onReplySubmit: (feedbackId: string, content: string) => Promise<Reply | null>;
    onClose: () => void;
    onBack?: () => void;
  }
): void {
  // If panel not open, open it first with this thread
  if (!slidePanelAPI?.isOpen()) {
    threads = [thread];
    currentThread = thread;
    currentView = "detail";
    onCloseCallback = options.onClose;
    onReplySubmitCallback = options.onReplySubmit;

    slidePanelAPI = createSlidePanel({
      onClose: handlePanelClose,
    });

    renderDetailView();
    return;
  }

  // Panel already open, just switch view
  currentThread = thread;
  currentView = "detail";
  onReplySubmitCallback = options.onReplySubmit;
  renderDetailView();
}

// =============================================================================
// INTERNAL NAVIGATION
// =============================================================================

function handlePanelClose(): void {
  cleanup();
  onCloseCallback?.();
}

function cleanup(): void {
  // Remove detail keyboard handler if present
  if (detailKeyHandler) {
    document.removeEventListener("keydown", detailKeyHandler);
    detailKeyHandler = null;
  }

  slidePanelAPI = null;
  currentView = "list";
  currentThread = null;
  threads = [];
  selectedThreadId = null;
  repliesListEl = null;
  replyInputEl = null;
  sendButtonEl = null;
  onThreadSelectCallback = null;
  onCloseCallback = null;
  onBackToListCallback = null;
  onReplySubmitCallback = null;
}

function switchToDetailView(thread: FeedbackThread): void {
  currentView = "detail";
  currentThread = thread;
  selectedThreadId = thread.id;

  // Call onSelect callback (for scrolling/highlighting)
  onThreadSelectCallback?.(thread);

  renderDetailView();
}

function switchToListView(): void {
  // Remove detail keyboard handler
  if (detailKeyHandler) {
    document.removeEventListener("keydown", detailKeyHandler);
    detailKeyHandler = null;
  }

  currentView = "list";
  currentThread = null;
  repliesListEl = null;
  replyInputEl = null;
  sendButtonEl = null;

  // Clear highlight when returning to list
  onBackToListCallback?.();

  renderListView();
}

// =============================================================================
// LIST VIEW RENDERING
// =============================================================================

function renderListView(): void {
  if (!slidePanelAPI) return;

  const header = createListHeader(threads.length);
  const list = createThreadsList();

  slidePanelAPI.setContent([header, list]);
}

function createListHeader(count: number): HTMLDivElement {
  const title = createElement("h2", {
    styles: {
      margin: "0",
      fontSize: typography.size.lg,
      fontWeight: typography.weight.semibold,
      color: colors.text.primary,
    },
    children: [t("toolbar.messages") || "Messages"],
  });

  const subtitle = createElement("p", {
    styles: {
      margin: `${spacing.xs} 0 0`,
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    children: [`${count} conversation${count > 1 ? "s" : ""}`],
  });

  const closeBtn = createCloseButton(() => slidePanelAPI?.close());

  return createElement("div", {
    styles: {
      position: "relative",
      padding: spacing.xl,
      borderBottom: `${borders.width.thin} solid ${colors.border.default}`,
    },
    children: [title, subtitle, closeBtn],
  });
}

function createThreadsList(): HTMLDivElement {
  const list = createElement("div", {
    className: "orphy-threads-list",
    styles: {
      flex: "1",
      overflowY: "auto",
      padding: spacing.lg,
      display: "flex",
      flexDirection: "column",
      gap: spacing.md,
    },
  });

  if (threads.length === 0) {
    list.appendChild(createEmptyState());
  } else {
    threads.forEach((thread) => {
      list.appendChild(createThreadItem(thread));
    });
  }

  return list;
}

function createEmptyState(): HTMLDivElement {
  return createElement("div", {
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
        children: [t("reviewPanel.empty") || "No messages yet"],
      }),
    ],
  });
}

function createThreadItem(thread: FeedbackThread): HTMLDivElement {
  const hasReplies = thread.replies.length > 0;
  const lastReply = hasReplies ? thread.replies[thread.replies.length - 1] : null;
  const isSelected = selectedThreadId === thread.id;

  const item = createElement("div", {
    className: "orphy-thread-item",
    styles: {
      padding: spacing.md,
      backgroundColor: isSelected ? colors.accent.soft : colors.bg.primary,
      border: `${borders.width.thin} solid ${isSelected ? colors.accent.primary : colors.border.default}`,
      borderRadius: borders.radius.lg,
      cursor: "pointer",
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
    },
  });

  item.dataset.threadId = thread.id;

  // Header with type badge and time
  const typeColor = TYPE_COLORS[thread.feedbackType];
  const typeBadge = createElement("span", {
    styles: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "2px 8px",
      borderRadius: borders.radius.full,
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
      backgroundColor: `${typeColor}15`,
      color: typeColor,
    },
  });
  typeBadge.appendChild(createTypeIcon(thread.feedbackType));
  typeBadge.appendChild(document.createTextNode(t(`types.${thread.feedbackType}`) || thread.feedbackType));

  const headerRow = createElement("div", {
    styles: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    children: [
      typeBadge,
      createElement("span", {
        styles: {
          fontSize: typography.size.xs,
          color: colors.text.tertiary,
        },
        children: [formatRelativeTime(thread.createdAt ?? thread.timestamp)],
      }),
    ],
  });

  // Comment preview
  const commentPreview = createElement("p", {
    styles: {
      margin: `0 0 ${spacing.sm}`,
      fontSize: typography.size.sm,
      color: colors.text.primary,
      lineHeight: typography.lineHeight.base,
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      webkitLineClamp: "2",
      webkitBoxOrient: "vertical",
    },
    children: [thread.comment],
  });

  // Footer with status badge and reply count
  const footer = createElement("div", {
    styles: {
      display: "flex",
      alignItems: "center",
      gap: spacing.sm,
    },
  });

  // Status badge with icon
  const status = thread.status || "open";
  const statusConfig = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.open;
  const statusBadge = createElement("span", {
    styles: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "2px 6px",
      borderRadius: borders.radius.md,
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
      backgroundColor: statusConfig.bg,
      color: statusConfig.color,
    },
  });
  statusBadge.appendChild(createStatusIcon(status));
  statusBadge.appendChild(document.createTextNode(statusConfig.label));
  footer.appendChild(statusBadge);

  if (hasReplies && lastReply) {
    const replyBadge = createElement("span", {
      styles: {
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 6px",
        borderRadius: borders.radius.md,
        fontSize: typography.size.xs,
        backgroundColor: lastReply.authorType === "agency" ? "#f3e8ff" : colors.accent.soft,
        color: lastReply.authorType === "agency" ? "#8b5cf6" : colors.accent.primary,
      },
      children: [
        `${thread.replies.length} ${thread.replies.length > 1 ? "replies" : "reply"}`,
      ],
    });
    footer.appendChild(replyBadge);
  }

  item.appendChild(headerRow);
  item.appendChild(commentPreview);
  item.appendChild(footer);

  // Hover effect
  item.addEventListener("mouseenter", () => {
    if (selectedThreadId !== thread.id) {
      item.style.backgroundColor = colors.bg.secondary;
      item.style.borderColor = colors.border.hover;
    }
  });
  item.addEventListener("mouseleave", () => {
    if (selectedThreadId !== thread.id) {
      item.style.backgroundColor = colors.bg.primary;
      item.style.borderColor = colors.border.default;
    }
  });

  // Click handler - switch to detail view
  item.addEventListener("click", () => {
    switchToDetailView(thread);
  });

  return item;
}

// =============================================================================
// DETAIL VIEW RENDERING
// =============================================================================

function renderDetailView(): void {
  if (!slidePanelAPI || !currentThread) return;

  const header = createDetailHeader(currentThread);
  const originalFeedback = createOriginalFeedback(currentThread);
  const repliesSection = createRepliesSection(currentThread.replies);
  const replyInput = createReplyInput();

  slidePanelAPI.setContent([header, originalFeedback, repliesSection, replyInput]);

  // Add keyboard handler for Ctrl+Enter
  detailKeyHandler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && replyInputEl) {
      e.preventDefault();
      handleSendReply();
    }
  };
  document.addEventListener("keydown", detailKeyHandler);
}

function createDetailHeader(thread: FeedbackThread): HTMLDivElement {
  const typeColor = TYPE_COLORS[thread.feedbackType];

  // Back button
  const backBtn = createElement("button", {
    styles: {
      width: "28px",
      height: "28px",
      border: "none",
      borderRadius: borders.radius.md,
      backgroundColor: "transparent",
      color: colors.text.secondary,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
    },
    onClick: switchToListView,
    children: [createBackIcon()],
  }) as HTMLButtonElement;

  backBtn.addEventListener("mouseenter", () => {
    backBtn.style.backgroundColor = colors.bg.secondary;
    backBtn.style.color = colors.text.primary;
  });
  backBtn.addEventListener("mouseleave", () => {
    backBtn.style.backgroundColor = "transparent";
    backBtn.style.color = colors.text.secondary;
  });

  // Type badge with icon
  const typeIcon = createTypeIcon(thread.feedbackType);

  const typeLabel = createElement("span", {
    styles: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.semibold,
      color: typeColor,
    },
    children: [t(`types.${thread.feedbackType}`)],
  });

  const typeBadge = createElement("div", {
    styles: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 10px",
      borderRadius: borders.radius.lg,
      backgroundColor: `${typeColor}15`,
    },
    children: [typeIcon, typeLabel],
  });

  // Left side container
  const leftSide = createElement("div", {
    styles: {
      display: "flex",
      alignItems: "center",
    },
    children: [backBtn, typeBadge],
  });

  // Time
  const timeEl = createElement("span", {
    styles: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
    },
    children: [formatRelativeTime(thread.createdAt ?? thread.timestamp)],
  });

  // Close button
  const closeBtn = createElement("button", {
    styles: {
      width: "28px",
      height: "28px",
      border: "none",
      borderRadius: borders.radius.md,
      backgroundColor: "transparent",
      color: colors.text.tertiary,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: spacing.sm,
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
    },
    onClick: () => slidePanelAPI?.close(),
    children: [createCloseIcon()],
  }) as HTMLButtonElement;

  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.backgroundColor = colors.bg.secondary;
    closeBtn.style.color = colors.text.primary;
  });
  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.backgroundColor = "transparent";
    closeBtn.style.color = colors.text.tertiary;
  });

  // Right side container
  const rightSide = createElement("div", {
    styles: {
      display: "flex",
      alignItems: "center",
    },
    children: [timeEl, closeBtn],
  });

  return createElement("div", {
    styles: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.lg,
      borderBottom: `${borders.width.thin} solid ${colors.border.default}`,
    },
    children: [leftSide, rightSide],
  });
}

function createOriginalFeedback(thread: FeedbackThread): HTMLDivElement {
  const isAgency = thread.authorType === "agency";

  // Author badge
  const authorBadge = createElement("span", {
    styles: {
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: borders.radius.md,
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
      backgroundColor: isAgency ? AUTHOR_COLORS.agencyBg : AUTHOR_COLORS.clientBg,
      color: isAgency ? AUTHOR_COLORS.agency : AUTHOR_COLORS.client,
    },
    children: [t(`thread.author.${isAgency ? "agency" : "client"}`)],
  });

  // Status badge with icon
  const status = thread.status || "open";
  const statusConfig = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.open;
  const statusBadge = createElement("span", {
    styles: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "2px 8px",
      borderRadius: borders.radius.md,
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
      backgroundColor: statusConfig.bg,
      color: statusConfig.color,
      marginLeft: spacing.sm,
    },
  });
  statusBadge.appendChild(createStatusIcon(status));
  statusBadge.appendChild(document.createTextNode(statusConfig.label));

  // Header row with badges
  const headerRow = createElement("div", {
    styles: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    children: [authorBadge, statusBadge],
  });

  const commentText = createElement("p", {
    styles: {
      margin: `${spacing.sm} 0 0`,
      fontSize: typography.size.base,
      lineHeight: typography.lineHeight.relaxed,
      color: colors.text.primary,
      wordBreak: "break-word",
    },
    children: [thread.comment],
  });

  const container = createElement("div", {
    styles: {
      padding: spacing.lg,
      backgroundColor: colors.bg.secondary,
      borderBottom: `${borders.width.thin} solid ${colors.border.default}`,
    },
    children: [headerRow, commentText],
  });

  // Add validation button if status is "treated" (or legacy "resolved")
  if (status === "treated" || status === "resolved") {
    const validateBtn = createValidateButton(thread);
    container.appendChild(validateBtn);
  }

  return container;
}

function createValidateButton(thread: FeedbackThread): HTMLDivElement {
  const buttonContainer = createElement("div", {
    styles: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTop: `${borders.width.thin} solid ${colors.border.default}`,
    },
  });

  const infoText = createElement("p", {
    styles: {
      margin: `0 0 ${spacing.sm}`,
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    children: [t("thread.validateInfo") || "L'agence a traité ce retour. Confirmez si c'est résolu :"],
  });

  const validateBtn = createElement("button", {
    styles: {
      display: "inline-flex",
      alignItems: "center",
      gap: spacing.sm,
      padding: `${spacing.sm} ${spacing.lg}`,
      border: "none",
      borderRadius: borders.radius.lg,
      backgroundColor: STATUS_COLORS.validated.color,
      color: colors.text.inverse,
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      cursor: "pointer",
      fontFamily: typography.family.sans,
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
    },
    children: [createCheckIcon(), t("thread.validate") || "Valider"],
  }) as HTMLButtonElement;

  validateBtn.addEventListener("mouseenter", () => {
    validateBtn.style.backgroundColor = "#15803d";
  });
  validateBtn.addEventListener("mouseleave", () => {
    validateBtn.style.backgroundColor = STATUS_COLORS.validated.color;
  });

  validateBtn.addEventListener("click", async () => {
    // Disable button
    validateBtn.disabled = true;
    validateBtn.style.opacity = "0.6";
    validateBtn.style.cursor = "not-allowed";
    validateBtn.textContent = t("thread.validating") || "Validation...";

    const success = await validateFeedback(thread.id);

    if (success) {
      // Update local thread status
      thread.status = "validated";
      // Re-render detail view
      renderDetailView();
    } else {
      // Re-enable button on failure
      validateBtn.disabled = false;
      validateBtn.style.opacity = "1";
      validateBtn.style.cursor = "pointer";
      validateBtn.textContent = t("thread.validate") || "Valider";
    }
  });

  buttonContainer.appendChild(infoText);
  buttonContainer.appendChild(validateBtn);

  return buttonContainer;
}

function createCheckIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.display = "block";
  svg.style.flexShrink = "0";

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M20 6 9 17l-5-5");
  svg.appendChild(path);

  return svg;
}

function createRepliesSection(replies: Reply[]): HTMLDivElement {
  repliesListEl = createElement("div", {
    className: "orphy-thread-detail-replies",
    styles: {
      flex: "1",
      overflowY: "auto",
      padding: spacing.lg,
    },
  });

  if (replies.length === 0) {
    const emptyState = createElement("div", {
      styles: {
        padding: `${spacing["2xl"]} 0`,
        textAlign: "center",
        color: colors.text.tertiary,
        fontSize: typography.size.sm,
      },
      children: [t("thread.noReplies")],
    });
    repliesListEl.appendChild(emptyState);
  } else {
    replies.forEach((reply) => {
      repliesListEl!.appendChild(createReplyItem(reply));
    });
  }

  return repliesListEl;
}

function createReplyItem(reply: Reply): HTMLDivElement {
  const isAgency = reply.authorType === "agency";

  const authorBadge = createElement("span", {
    styles: {
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 6px",
      borderRadius: borders.radius.md,
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
      backgroundColor: isAgency ? AUTHOR_COLORS.agencyBg : AUTHOR_COLORS.clientBg,
      color: isAgency ? AUTHOR_COLORS.agency : AUTHOR_COLORS.client,
    },
    children: [reply.authorName ?? t(`thread.author.${isAgency ? "agency" : "client"}`)],
  });

  const timeEl = createElement("span", {
    styles: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
    },
    children: [formatRelativeTime(reply.createdAt)],
  });

  const headerRow = createElement("div", {
    styles: {
      display: "flex",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    children: [authorBadge, timeEl],
  });

  const content = createElement("p", {
    styles: {
      margin: "0",
      fontSize: typography.size.sm,
      lineHeight: typography.lineHeight.base,
      color: colors.text.primary,
      wordBreak: "break-word",
    },
    children: [reply.content],
  });

  return createElement("div", {
    styles: {
      padding: `${spacing.md} 0`,
      borderBottom: `${borders.width.thin} solid ${colors.border.default}`,
    },
    children: [headerRow, content],
  });
}

function createReplyInput(): HTMLDivElement {
  replyInputEl = createElement("textarea", {
    styles: {
      width: "100%",
      minHeight: "60px",
      maxHeight: "120px",
      padding: spacing.md,
      border: `${borders.width.thin} solid ${colors.border.default}`,
      borderRadius: borders.radius.lg,
      fontSize: typography.size.sm,
      fontFamily: typography.family.sans,
      resize: "vertical",
      boxSizing: "border-box",
      color: colors.text.primary,
      backgroundColor: colors.bg.primary,
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
    },
    attributes: {
      placeholder: t("thread.replyPlaceholder"),
    },
  }) as HTMLTextAreaElement;

  replyInputEl.addEventListener("focus", () => {
    if (replyInputEl) {
      replyInputEl.style.borderColor = colors.accent.primary;
      replyInputEl.style.boxShadow = shadows.focus;
    }
  });
  replyInputEl.addEventListener("blur", () => {
    if (replyInputEl) {
      replyInputEl.style.borderColor = colors.border.default;
      replyInputEl.style.boxShadow = "none";
    }
  });

  sendButtonEl = createElement("button", {
    styles: {
      display: "flex",
      alignItems: "center",
      gap: spacing.sm,
      padding: `${spacing.sm} ${spacing.md}`,
      border: "none",
      borderRadius: borders.radius.lg,
      backgroundColor: colors.accent.primary,
      color: colors.text.inverse,
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      cursor: "pointer",
      fontFamily: typography.family.sans,
      transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
    },
    onClick: handleSendReply,
    children: [createSendIcon(), t("thread.send")],
  }) as HTMLButtonElement;

  sendButtonEl.addEventListener("mouseenter", () => {
    if (sendButtonEl && !sendButtonEl.disabled) {
      sendButtonEl.style.backgroundColor = colors.accent.hover;
    }
  });
  sendButtonEl.addEventListener("mouseleave", () => {
    if (sendButtonEl && !sendButtonEl.disabled) {
      sendButtonEl.style.backgroundColor = colors.accent.primary;
    }
  });

  const footerRow = createElement("div", {
    styles: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.sm,
    },
    children: [
      createElement("span", {
        styles: {
          fontSize: typography.size.xs,
          color: colors.text.tertiary,
        },
        children: ["⌘Enter " + t("thread.send").toLowerCase()],
      }),
      sendButtonEl,
    ],
  });

  return createElement("div", {
    styles: {
      padding: spacing.lg,
      borderTop: `${borders.width.thin} solid ${colors.border.default}`,
      backgroundColor: colors.bg.secondary,
    },
    children: [replyInputEl, footerRow],
  });
}

// =============================================================================
// HANDLERS
// =============================================================================

async function handleSendReply(): Promise<void> {
  if (!replyInputEl || !sendButtonEl || !currentThread || !onReplySubmitCallback) return;

  const content = replyInputEl.value.trim();
  if (!content) return;

  // Disable input and button
  replyInputEl.disabled = true;
  sendButtonEl.disabled = true;
  sendButtonEl.style.opacity = "0.6";
  sendButtonEl.style.cursor = "not-allowed";
  const originalText = sendButtonEl.textContent;
  sendButtonEl.textContent = t("thread.sending");

  try {
    const reply = await onReplySubmitCallback(currentThread.id, content);

    if (reply) {
      // Clear input
      replyInputEl.value = "";

      // Remove empty state if present
      const emptyState = repliesListEl?.querySelector("div[style*='text-align: center']");
      if (emptyState) {
        emptyState.remove();
      }

      // Add reply to list
      if (repliesListEl) {
        const replyEl = createReplyItem(reply);
        repliesListEl.appendChild(replyEl);
        repliesListEl.scrollTop = repliesListEl.scrollHeight;
      }
    }
  } finally {
    // Re-enable input and button
    if (replyInputEl) replyInputEl.disabled = false;
    if (sendButtonEl) {
      sendButtonEl.disabled = false;
      sendButtonEl.style.opacity = "1";
      sendButtonEl.style.cursor = "pointer";
      sendButtonEl.textContent = originalText;
    }
  }
}

// =============================================================================
// ICONS - Created programmatically for security (no innerHTML with user input)
// =============================================================================

function createCloseButton(onClick: () => void): HTMLButtonElement {
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
    onClick,
    children: [createCloseIcon()],
  }) as HTMLButtonElement;

  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.backgroundColor = colors.bg.secondary;
    closeBtn.style.color = colors.text.primary;
  });
  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.backgroundColor = "transparent";
    closeBtn.style.color = colors.text.tertiary;
  });

  return closeBtn;
}

function createCloseIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.display = "block";
  svg.style.flexShrink = "0";

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

  return svg;
}

function createBackIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.display = "block";
  svg.style.flexShrink = "0";

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "m15 18-6-6 6-6");
  svg.appendChild(path);

  return svg;
}

function createStatusIcon(status: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.display = "block";
  svg.style.flexShrink = "0";

  if (status === "open") {
    // Clock icon
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "12");
    circle.setAttribute("cy", "12");
    circle.setAttribute("r", "10");
    svg.appendChild(circle);

    const line1 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line1.setAttribute("points", "12 6 12 12 16 14");
    svg.appendChild(line1);
  } else {
    // Single check icon for treated, resolved, validated
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M20 6 9 17l-5-5");
    svg.appendChild(path);
  }

  return svg;
}

function createEmptyIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "48");
  svg.setAttribute("height", "48");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.display = "block";
  svg.style.opacity = "0.3";

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  );
  svg.appendChild(path);

  return svg;
}

function createSendIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.display = "block";
  svg.style.flexShrink = "0";

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", "22");
  line.setAttribute("y1", "2");
  line.setAttribute("x2", "11");
  line.setAttribute("y2", "13");
  svg.appendChild(line);

  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", "22 2 15 22 11 13 2 9 22 2");
  svg.appendChild(polygon);

  return svg;
}

/**
 * Create a type-specific icon using safe DOM methods
 */
function createTypeIcon(type: FeedbackType): SVGSVGElement {
  const color = TYPE_COLORS[type];
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", color);
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.display = "block";
  svg.style.flexShrink = "0";

  switch (type) {
    case "bug": {
      // Bug icon paths
      const paths = [
        "m8 2 1.88 1.88",
        "M14.12 3.88 16 2",
        "M9 7.13v-1a3.003 3.003 0 1 1 6 0v1",
        "M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6",
        "M12 20v-9",
        "M6.53 9C4.6 8.8 3 7.1 3 5",
        "M6 13H2",
        "M3 21c0-2.1 1.7-3.9 3.8-4",
        "M20.97 5c0 2.1-1.6 3.8-3.5 4",
        "M22 13h-4",
        "M17.2 17c2.1.1 3.8 1.9 3.8 4",
      ];
      paths.forEach((d) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        svg.appendChild(path);
      });
      break;
    }
    case "design": {
      // Palette icon
      const circles = [
        { cx: "13.5", cy: "6.5", r: "0.5" },
        { cx: "17.5", cy: "10.5", r: "0.5" },
        { cx: "8.5", cy: "7.5", r: "0.5" },
        { cx: "6.5", cy: "12.5", r: "0.5" },
      ];
      circles.forEach((c) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", c.cx);
        circle.setAttribute("cy", c.cy);
        circle.setAttribute("r", c.r);
        circle.setAttribute("fill", color);
        svg.appendChild(circle);
      });
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute(
        "d",
        "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"
      );
      svg.appendChild(path);
      break;
    }
    case "content": {
      // Document icon
      const paths = [
        "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
        "M14 2v4a2 2 0 0 0 2 2h4",
        "M10 9H8",
        "M16 13H8",
        "M16 17H8",
      ];
      paths.forEach((d) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        svg.appendChild(path);
      });
      break;
    }
    case "question": {
      // Question mark icon
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "10");
      svg.appendChild(circle);
      const paths = [
        "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
        "M12 17h.01",
      ];
      paths.forEach((d) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        svg.appendChild(path);
      });
      break;
    }
  }

  return svg;
}

// =============================================================================
// UTILITIES
// =============================================================================

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t("replay.timeAgo.now");
  if (minutes < 60) return t("replay.timeAgo.minutes", { count: minutes });
  if (hours < 24) return t("replay.timeAgo.hours", { count: hours });
  return t("replay.timeAgo.days", { count: days });
}
