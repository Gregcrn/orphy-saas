/**
 * Comment input UI - Wizard-style with progressive disclosure
 * Design: Notion-like - clean, focused, inviting
 */

import { createElement } from "../utils/dom";
import { store, type FeedbackType } from "../core/state";
import { sessionStore, type FeedbackDraft } from "../core/session";
import type { CaptureData } from "../core/capture";
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

// =============================================================================
// STATE
// =============================================================================

let boxEl: HTMLDivElement | null = null;
let textareaEl: HTMLTextAreaElement | null = null;
let textareaContainerEl: HTMLDivElement | null = null;
let submitBtnEl: HTMLButtonElement | null = null;
let addAnotherBtnEl: HTMLButtonElement | null = null;
let existingDraftsEl: HTMLDivElement | null = null;
let currentCaptureData: CaptureData | null = null;
let selectedType: FeedbackType | null = null;
let editingDraftId: string | null = null; // If editing an existing draft
let typeButtons: Map<FeedbackType, HTMLButtonElement> = new Map();
let onSubmitCallback:
  | ((comment: string, captureData: CaptureData, feedbackType: FeedbackType) => void)
  | null = null;
let onCancelCallback: (() => void) | null = null;

// Type selector configuration
const FEEDBACK_TYPES: FeedbackType[] = ["bug", "design", "content", "question"];

// =============================================================================
// STYLES
// =============================================================================

const BOX_STYLES: Partial<CSSStyleDeclaration> = {
  position: "absolute",
  zIndex: zIndex.modal,
  backgroundColor: colors.bg.primary,
  borderRadius: borders.radius.xl,
  boxShadow: shadows.xl,
  border: `${borders.width.thin} solid ${colors.border.default}`,
  padding: spacing.lg,
  width: components.commentBox.width,
  fontFamily: typography.family.sans,
  maxHeight: "80vh",
  overflowY: "auto",
};

const HEADER_STYLES: Partial<CSSStyleDeclaration> = {
  fontSize: typography.size.sm,
  fontWeight: typography.weight.medium,
  color: colors.text.secondary,
  marginBottom: spacing.md,
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
};

const TEXTAREA_CONTAINER_STYLES: Partial<CSSStyleDeclaration> = {
  overflow: "hidden",
  maxHeight: "0",
  opacity: "0",
  transition: `all ${transitions.duration.base} ${transitions.easing.out}`,
  marginTop: "0",
};

const TEXTAREA_CONTAINER_VISIBLE: Partial<CSSStyleDeclaration> = {
  maxHeight: "200px",
  opacity: "1",
  marginTop: spacing.md,
};

const TEXTAREA_STYLES: Partial<CSSStyleDeclaration> = {
  width: "100%",
  minHeight: "100px",
  padding: spacing.md,
  border: `${borders.width.thin} solid ${colors.border.default}`,
  borderRadius: borders.radius.md,
  fontSize: typography.size.base,
  fontFamily: typography.family.sans,
  lineHeight: typography.lineHeight.relaxed,
  color: colors.text.primary,
  backgroundColor: colors.bg.primary,
  resize: "vertical",
  boxSizing: "border-box",
  outline: "none",
  transition: `border-color ${transitions.duration.base} ${transitions.easing.default}, box-shadow ${transitions.duration.base} ${transitions.easing.default}`,
};

const TEXTAREA_FOCUS_STYLES: Partial<CSSStyleDeclaration> = {
  borderColor: colors.accent.primary,
  boxShadow: shadows.focus,
};

const TEXTAREA_DEFAULT_STYLES: Partial<CSSStyleDeclaration> = {
  borderColor: colors.border.default,
  boxShadow: "none",
};

const BUTTON_CONTAINER_STYLES: Partial<CSSStyleDeclaration> = {
  display: "flex",
  gap: spacing.sm,
  justifyContent: "flex-end",
  marginTop: spacing.md,
};

const BUTTON_BASE: Partial<CSSStyleDeclaration> = {
  padding: components.button.padding.md,
  border: "none",
  borderRadius: borders.radius.md,
  fontSize: typography.size.sm,
  fontWeight: typography.weight.medium,
  fontFamily: typography.family.sans,
  cursor: "pointer",
  transition: `all ${transitions.duration.base} ${transitions.easing.default}`,
  outline: "none",
};

const CANCEL_BUTTON_STYLES: Partial<CSSStyleDeclaration> = {
  ...BUTTON_BASE,
  backgroundColor: colors.bg.secondary,
  color: colors.text.secondary,
  border: `${borders.width.thin} solid ${colors.border.default}`,
};

const CANCEL_BUTTON_HOVER: Partial<CSSStyleDeclaration> = {
  backgroundColor: colors.bg.tertiary,
  borderColor: colors.border.hover,
};

const SUBMIT_BUTTON_STYLES: Partial<CSSStyleDeclaration> = {
  ...BUTTON_BASE,
  backgroundColor: colors.text.primary,
  color: colors.text.inverse,
};

const SUBMIT_BUTTON_HOVER: Partial<CSSStyleDeclaration> = {
  backgroundColor: "#2d2d2a",
};

const SUBMIT_BUTTON_DISABLED: Partial<CSSStyleDeclaration> = {
  backgroundColor: colors.bg.tertiary,
  color: colors.text.tertiary,
  cursor: "not-allowed",
};

const HINT_STYLES: Partial<CSSStyleDeclaration> = {
  fontSize: typography.size.xs,
  color: colors.text.tertiary,
  marginTop: spacing.sm,
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
};

// Type selector styles
const TYPE_SELECTOR_STYLES: Partial<CSSStyleDeclaration> = {
  display: "flex",
  gap: spacing.xs,
  marginBottom: "0",
};

const TYPE_BUTTON_BASE: Partial<CSSStyleDeclaration> = {
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
  padding: `${spacing.xs} ${spacing.sm}`,
  border: `${borders.width.thin} solid ${colors.border.default}`,
  borderRadius: borders.radius.md,
  backgroundColor: colors.bg.primary,
  color: colors.text.secondary,
  fontSize: typography.size.xs,
  fontWeight: typography.weight.medium,
  fontFamily: typography.family.sans,
  cursor: "pointer",
  transition: `all ${transitions.duration.fast} ${transitions.easing.default}`,
  outline: "none",
};

const TYPE_BUTTON_SELECTED: Partial<CSSStyleDeclaration> = {
  backgroundColor: colors.accent.soft,
  borderColor: colors.accent.primary,
  color: colors.text.primary,
};

const TYPE_BUTTON_HOVER: Partial<CSSStyleDeclaration> = {
  borderColor: colors.border.hover,
  backgroundColor: colors.bg.secondary,
};

// Existing drafts styles
const EXISTING_DRAFTS_STYLES: Partial<CSSStyleDeclaration> = {
  marginBottom: spacing.md,
  display: "flex",
  flexDirection: "column",
  gap: spacing.sm,
};

const DRAFT_ITEM_STYLES: Partial<CSSStyleDeclaration> = {
  display: "flex",
  alignItems: "flex-start",
  gap: spacing.sm,
  padding: spacing.sm,
  backgroundColor: colors.bg.secondary,
  borderRadius: borders.radius.md,
  border: `${borders.width.thin} solid ${colors.border.default}`,
};

const DRAFT_ITEM_CONTENT: Partial<CSSStyleDeclaration> = {
  flex: "1",
  minWidth: "0",
};

const DRAFT_ITEM_TYPE: Partial<CSSStyleDeclaration> = {
  fontSize: typography.size.xs,
  fontWeight: typography.weight.medium,
  color: colors.text.secondary,
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.xs,
};

const DRAFT_ITEM_COMMENT: Partial<CSSStyleDeclaration> = {
  fontSize: typography.size.sm,
  color: colors.text.primary,
  lineHeight: typography.lineHeight.base,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const DRAFT_EDIT_BTN: Partial<CSSStyleDeclaration> = {
  padding: spacing.xs,
  border: "none",
  borderRadius: borders.radius.sm,
  backgroundColor: "transparent",
  color: colors.text.tertiary,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: "0",
  transition: `all ${transitions.duration.fast} ${transitions.easing.default}`,
};

// Add another button styles
const ADD_ANOTHER_STYLES: Partial<CSSStyleDeclaration> = {
  display: "none", // Hidden by default
  alignItems: "center",
  gap: spacing.xs,
  padding: `${spacing.sm} ${spacing.md}`,
  marginTop: spacing.md,
  border: `${borders.width.thin} dashed ${colors.border.default}`,
  borderRadius: borders.radius.md,
  backgroundColor: "transparent",
  color: colors.text.secondary,
  fontSize: typography.size.sm,
  fontWeight: typography.weight.medium,
  fontFamily: typography.family.sans,
  cursor: "pointer",
  transition: `all ${transitions.duration.fast} ${transitions.easing.default}`,
  width: "100%",
  justifyContent: "center",
};

const ADD_ANOTHER_HOVER: Partial<CSSStyleDeclaration> = {
  backgroundColor: colors.bg.secondary,
  borderColor: colors.border.hover,
  color: colors.text.primary,
};

// =============================================================================
// PUBLIC API
// =============================================================================

export function showCommentBox(
  captureData: CaptureData,
  x: number,
  y: number,
  onSubmit: (comment: string, captureData: CaptureData, feedbackType: FeedbackType) => void,
  onCancel: () => void
): void {
  hideCommentBox();

  currentCaptureData = captureData;
  onSubmitCallback = onSubmit;
  onCancelCallback = onCancel;
  selectedType = null;
  editingDraftId = null;
  typeButtons.clear();
  submitBtnEl = null;
  addAnotherBtnEl = null;
  textareaContainerEl = null;
  existingDraftsEl = null;

  // Check for existing drafts on this element
  const existingDrafts = sessionStore.getDraftsByElement(captureData.orphyId);
  const hasExistingDrafts = existingDrafts.length > 0;

  // Header
  const headerText = hasExistingDrafts
    ? t("commentBox.headerExisting")
    : t("commentBox.headerNew");
  const header = createElement("div", {
    styles: HEADER_STYLES,
    children: [createCommentIcon(), headerText],
  });

  // Existing drafts section (if any)
  if (hasExistingDrafts) {
    existingDraftsEl = createElement("div", {
      className: "orphy-existing-drafts",
      styles: EXISTING_DRAFTS_STYLES,
    });
    existingDrafts.forEach((draft) => {
      const draftItem = createDraftItem(draft);
      existingDraftsEl!.appendChild(draftItem);
    });
  }

  // Type selector
  const typeSelector = createElement("div", {
    className: "orphy-type-selector",
    styles: TYPE_SELECTOR_STYLES,
  });

  FEEDBACK_TYPES.forEach((type) => {
    const label = t(`types.${type}`);
    const btn = createElement("button", {
      className: `orphy-type-btn orphy-type-${type}`,
      styles: { ...TYPE_BUTTON_BASE },
      children: [getTypeIcon(type), label],
    });

    btn.addEventListener("click", () => selectType(type));
    btn.addEventListener("mouseenter", () => {
      if (type !== selectedType) {
        Object.assign(btn.style, TYPE_BUTTON_HOVER);
      }
    });
    btn.addEventListener("mouseleave", () => {
      if (type !== selectedType) {
        Object.assign(btn.style, TYPE_BUTTON_BASE);
      }
    });

    typeButtons.set(type, btn);
    typeSelector.appendChild(btn);
  });

  // Textarea container (hidden initially)
  textareaContainerEl = createElement("div", {
    className: "orphy-textarea-container",
    styles: TEXTAREA_CONTAINER_STYLES,
  });

  textareaEl = createElement("textarea", {
    className: "orphy-comment-textarea",
    styles: TEXTAREA_STYLES,
    attributes: { placeholder: t("commentBox.placeholder") },
  });

  textareaEl.addEventListener("focus", () => {
    if (textareaEl) Object.assign(textareaEl.style, TEXTAREA_FOCUS_STYLES);
  });
  textareaEl.addEventListener("blur", () => {
    if (textareaEl) Object.assign(textareaEl.style, TEXTAREA_DEFAULT_STYLES);
  });
  textareaEl.addEventListener("input", updateAddAnotherVisibility);

  textareaContainerEl.appendChild(textareaEl);

  // Add another button (hidden initially)
  addAnotherBtnEl = createElement("button", {
    className: "orphy-add-another",
    styles: ADD_ANOTHER_STYLES,
    children: [createPlusIcon(), t("commentBox.addAnother")],
    onClick: handleAddAnother,
  });
  addAnotherBtnEl.addEventListener("mouseenter", () => {
    if (addAnotherBtnEl) Object.assign(addAnotherBtnEl.style, ADD_ANOTHER_HOVER);
  });
  addAnotherBtnEl.addEventListener("mouseleave", () => {
    if (addAnotherBtnEl) Object.assign(addAnotherBtnEl.style, { ...ADD_ANOTHER_STYLES, display: addAnotherBtnEl.style.display });
  });

  // Cancel button
  const cancelBtn = createElement("button", {
    className: "orphy-comment-cancel",
    styles: CANCEL_BUTTON_STYLES,
    onClick: handleCancel,
    children: [t("commentBox.cancel")],
  });
  addButtonHover(cancelBtn, CANCEL_BUTTON_HOVER, CANCEL_BUTTON_STYLES);

  // Submit button - disabled until type selected and comment written
  submitBtnEl = createElement("button", {
    className: "orphy-comment-submit",
    styles: { ...SUBMIT_BUTTON_STYLES, ...SUBMIT_BUTTON_DISABLED },
    onClick: handleSubmit,
    children: [hasExistingDrafts ? t("commentBox.submitExisting") : t("commentBox.submit")],
  });
  submitBtnEl.disabled = true;
  submitBtnEl.addEventListener("mouseenter", () => {
    if (submitBtnEl && !submitBtnEl.disabled) {
      Object.assign(submitBtnEl.style, SUBMIT_BUTTON_HOVER);
    }
  });
  submitBtnEl.addEventListener("mouseleave", () => {
    if (submitBtnEl && !submitBtnEl.disabled) {
      Object.assign(submitBtnEl.style, SUBMIT_BUTTON_STYLES);
    }
  });

  // Button container
  const buttonContainer = createElement("div", {
    styles: BUTTON_CONTAINER_STYLES,
    children: [cancelBtn, submitBtnEl],
  });

  // Keyboard hint
  const hint = createElement("div", {
    styles: HINT_STYLES,
    children: [createKeyboardIcon(), t("commentBox.hint")],
  });

  // Build main box
  const children: (HTMLElement | null)[] = [
    header,
    existingDraftsEl,
    typeSelector,
    textareaContainerEl,
    addAnotherBtnEl,
    buttonContainer,
    hint,
  ];

  boxEl = createElement("div", {
    className: "orphy-comment-box",
    styles: BOX_STYLES,
    children: children.filter((c): c is HTMLElement => c !== null),
  });

  // Position and add to DOM
  positionBox(x, y);
  document.body.appendChild(boxEl);
  store.setState({ commentBoxVisible: true });

  // Handle keyboard
  document.addEventListener("keydown", handleKeyDown);
}

export function hideCommentBox(): void {
  if (!boxEl) return;

  document.removeEventListener("keydown", handleKeyDown);
  boxEl.remove();
  boxEl = null;
  textareaEl = null;
  textareaContainerEl = null;
  submitBtnEl = null;
  addAnotherBtnEl = null;
  existingDraftsEl = null;
  currentCaptureData = null;
  onSubmitCallback = null;
  onCancelCallback = null;
  editingDraftId = null;
  typeButtons.clear();

  store.setState({ commentBoxVisible: false });
}

// =============================================================================
// DRAFT ITEM
// =============================================================================

function createDraftItem(draft: FeedbackDraft): HTMLElement {
  const item = createElement("div", {
    className: "orphy-draft-item",
    styles: DRAFT_ITEM_STYLES,
  });

  // Content (type + comment)
  const content = createElement("div", {
    styles: DRAFT_ITEM_CONTENT,
  });

  const typeLabel = createElement("div", {
    styles: DRAFT_ITEM_TYPE,
    children: [getTypeIcon(draft.feedbackType), getTypeLabel(draft.feedbackType)],
  });

  const comment = createElement("div", {
    styles: DRAFT_ITEM_COMMENT,
    children: [draft.comment],
  });
  comment.title = draft.comment; // Full text on hover

  content.appendChild(typeLabel);
  content.appendChild(comment);
  item.appendChild(content);

  // Edit button
  const editBtn = createElement("button", {
    styles: DRAFT_EDIT_BTN,
    children: [createEditIcon()],
    onClick: () => editDraft(draft),
  });
  editBtn.addEventListener("mouseenter", () => {
    editBtn.style.backgroundColor = colors.bg.tertiary;
    editBtn.style.color = colors.text.primary;
  });
  editBtn.addEventListener("mouseleave", () => {
    editBtn.style.backgroundColor = "transparent";
    editBtn.style.color = colors.text.tertiary;
  });
  item.appendChild(editBtn);

  return item;
}

function getTypeLabel(type: FeedbackType): string {
  return t(`types.${type}`);
}

// =============================================================================
// POSITIONING
// =============================================================================

function positionBox(x: number, y: number): void {
  if (!boxEl) return;

  const padding = 20;
  const boxWidth = parseInt(components.commentBox.width);

  // Convert viewport coordinates to document coordinates
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  let left = x + scrollX + 10;
  let top = y + scrollY + 10;

  // Keep within viewport horizontally (use viewport coords for check)
  if (x + boxWidth + padding > window.innerWidth) {
    left = x + scrollX - boxWidth - 10;
  }
  if (left < scrollX + padding) left = scrollX + padding;

  boxEl.style.left = `${left}px`;
  boxEl.style.top = `${top}px`;
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

function selectType(type: FeedbackType): void {
  // Deselect previous (if any)
  if (selectedType) {
    const prevBtn = typeButtons.get(selectedType);
    if (prevBtn) {
      Object.assign(prevBtn.style, TYPE_BUTTON_BASE);
    }
  }

  // Select new
  selectedType = type;
  const newBtn = typeButtons.get(type);
  if (newBtn) {
    Object.assign(newBtn.style, TYPE_BUTTON_SELECTED);
  }

  // Show textarea with animation
  if (textareaContainerEl) {
    Object.assign(textareaContainerEl.style, TEXTAREA_CONTAINER_VISIBLE);
    // Focus textarea after animation
    setTimeout(() => textareaEl?.focus(), 200);
  }

  // Update submit button state
  updateSubmitState();
}

function editDraft(draft: FeedbackDraft): void {
  editingDraftId = draft.tempId;

  // Select the type
  selectType(draft.feedbackType);

  // Fill in the comment
  if (textareaEl) {
    textareaEl.value = draft.comment;
  }

  // Update states
  updateSubmitState();
  updateAddAnotherVisibility();
}

function handleAddAnother(): void {
  // Save current feedback
  saveCurrentFeedback();

  // Reset form for new feedback
  resetForm();
}

function saveCurrentFeedback(): void {
  const comment = textareaEl?.value.trim();
  if (!comment || !selectedType || !currentCaptureData) return;

  if (editingDraftId) {
    // Update existing draft
    sessionStore.updateDraft(editingDraftId, {
      comment,
      feedbackType: selectedType,
    });
  } else {
    // Create new draft via callback
    onSubmitCallback?.(comment, currentCaptureData, selectedType);
  }

  // Refresh existing drafts display
  refreshExistingDrafts();
}

function refreshExistingDrafts(): void {
  if (!existingDraftsEl || !currentCaptureData) {
    // Create the section if it doesn't exist yet
    if (!existingDraftsEl && currentCaptureData && boxEl) {
      const drafts = sessionStore.getDraftsByElement(currentCaptureData.orphyId);
      if (drafts.length > 0) {
        existingDraftsEl = createElement("div", {
          className: "orphy-existing-drafts",
          styles: EXISTING_DRAFTS_STYLES,
        });
        drafts.forEach((draft) => {
          const draftItem = createDraftItem(draft);
          existingDraftsEl!.appendChild(draftItem);
        });
        // Insert after header
        const header = boxEl.firstChild;
        if (header && header.nextSibling) {
          boxEl.insertBefore(existingDraftsEl, header.nextSibling);
        }
      }
    }
    return;
  }

  // Clear existing children safely (no innerHTML)
  while (existingDraftsEl.firstChild) {
    existingDraftsEl.removeChild(existingDraftsEl.firstChild);
  }

  // Rebuild
  const drafts = sessionStore.getDraftsByElement(currentCaptureData.orphyId);
  drafts.forEach((draft) => {
    const draftItem = createDraftItem(draft);
    existingDraftsEl!.appendChild(draftItem);
  });

  // Show the section if it was hidden
  if (drafts.length > 0) {
    existingDraftsEl.style.display = "flex";
  }
}

function resetForm(): void {
  // Deselect type
  if (selectedType) {
    const btn = typeButtons.get(selectedType);
    if (btn) {
      Object.assign(btn.style, TYPE_BUTTON_BASE);
    }
  }
  selectedType = null;
  editingDraftId = null;

  // Hide textarea
  if (textareaContainerEl) {
    Object.assign(textareaContainerEl.style, TEXTAREA_CONTAINER_STYLES);
  }

  // Clear textarea
  if (textareaEl) {
    textareaEl.value = "";
  }

  // Hide add another
  if (addAnotherBtnEl) {
    addAnotherBtnEl.style.display = "none";
  }

  // Disable submit
  if (submitBtnEl) {
    submitBtnEl.disabled = true;
    Object.assign(submitBtnEl.style, SUBMIT_BUTTON_STYLES, SUBMIT_BUTTON_DISABLED);
  }
}

function handleSubmit(): void {
  const comment = textareaEl?.value.trim();

  // If there's content, save it first
  if (comment && selectedType) {
    saveCurrentFeedback();
  }

  hideCommentBox();
}

function handleCancel(): void {
  onCancelCallback?.();
  hideCommentBox();
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    handleCancel();
  } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    if (selectedType && textareaEl?.value.trim()) {
      handleSubmit();
    }
  }
}

function updateSubmitState(): void {
  if (!submitBtnEl) return;

  const hasComment = Boolean(textareaEl?.value.trim());
  const hasType = Boolean(selectedType);
  const existingDrafts = currentCaptureData
    ? sessionStore.getDraftsByElement(currentCaptureData.orphyId)
    : [];

  // Enable if: (has type AND has comment) OR (has existing drafts and nothing new to add)
  const canSubmit = (hasType && hasComment) || (existingDrafts.length > 0 && !hasType);

  submitBtnEl.disabled = !canSubmit;
  if (canSubmit) {
    Object.assign(submitBtnEl.style, SUBMIT_BUTTON_STYLES);
  } else {
    Object.assign(submitBtnEl.style, SUBMIT_BUTTON_STYLES, SUBMIT_BUTTON_DISABLED);
  }
}

function updateAddAnotherVisibility(): void {
  if (!addAnotherBtnEl || !textareaEl) return;

  const hasComment = Boolean(textareaEl.value.trim());
  const hasType = Boolean(selectedType);

  // Show "add another" when there's a complete feedback ready
  addAnotherBtnEl.style.display = hasComment && hasType ? "flex" : "none";

  // Also update submit state
  updateSubmitState();
}

// =============================================================================
// HELPERS
// =============================================================================

function addButtonHover(
  button: HTMLButtonElement,
  hoverStyles: Partial<CSSStyleDeclaration>,
  defaultStyles: Partial<CSSStyleDeclaration>
): void {
  button.addEventListener("mouseenter", () => {
    Object.assign(button.style, hoverStyles);
  });
  button.addEventListener("mouseleave", () => {
    Object.assign(button.style, defaultStyles);
  });
}

// =============================================================================
// ICONS
// =============================================================================

function createSvgBase(size: number = 14): SVGSVGElement {
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

function createCommentIcon(): HTMLElement {
  const svg = createSvgBase();
  svg.appendChild(createPath("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"));
  return svg as unknown as HTMLElement;
}

function createKeyboardIcon(): HTMLElement {
  const svg = createSvgBase(12);
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", "2");
  rect.setAttribute("y", "4");
  rect.setAttribute("width", "20");
  rect.setAttribute("height", "16");
  rect.setAttribute("rx", "2");
  svg.appendChild(rect);

  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", "6");
  line1.setAttribute("y1", "8");
  line1.setAttribute("x2", "6");
  line1.setAttribute("y2", "8");
  svg.appendChild(line1);

  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", "18");
  line2.setAttribute("y1", "8");
  line2.setAttribute("x2", "18");
  line2.setAttribute("y2", "8");
  svg.appendChild(line2);

  const line3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line3.setAttribute("x1", "8");
  line3.setAttribute("y1", "16");
  line3.setAttribute("x2", "16");
  line3.setAttribute("y2", "16");
  svg.appendChild(line3);

  return svg as unknown as HTMLElement;
}

/** Lucide Bug icon */
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

/** Lucide Palette icon */
function createPaletteIcon(): HTMLElement {
  const svg = createSvgBase();
  svg.appendChild(createCircle(13.5, 6.5, 0.5, "currentColor"));
  svg.appendChild(createCircle(17.5, 10.5, 0.5, "currentColor"));
  svg.appendChild(createCircle(8.5, 7.5, 0.5, "currentColor"));
  svg.appendChild(createCircle(6.5, 12.5, 0.5, "currentColor"));
  svg.appendChild(createPath("M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"));
  return svg as unknown as HTMLElement;
}

/** Lucide FileText icon */
function createFileTextIcon(): HTMLElement {
  const svg = createSvgBase();
  svg.appendChild(createPath("M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"));
  svg.appendChild(createPath("M14 2v4a2 2 0 0 0 2 2h4"));
  svg.appendChild(createPath("M10 9H8"));
  svg.appendChild(createPath("M16 13H8"));
  svg.appendChild(createPath("M16 17H8"));
  return svg as unknown as HTMLElement;
}

/** Lucide HelpCircle icon */
function createHelpCircleIcon(): HTMLElement {
  const svg = createSvgBase();
  svg.appendChild(createCircle(12, 12, 10));
  svg.appendChild(createPath("M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"));
  svg.appendChild(createPath("M12 17h.01"));
  return svg as unknown as HTMLElement;
}

/** Lucide Plus icon */
function createPlusIcon(): HTMLElement {
  const svg = createSvgBase();
  svg.appendChild(createPath("M5 12h14"));
  svg.appendChild(createPath("M12 5v14"));
  return svg as unknown as HTMLElement;
}

/** Lucide Pencil/Edit icon */
function createEditIcon(): HTMLElement {
  const svg = createSvgBase();
  svg.appendChild(createPath("M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"));
  svg.appendChild(createPath("m15 5 4 4"));
  return svg as unknown as HTMLElement;
}

/** Get icon for feedback type */
function getTypeIcon(type: FeedbackType): HTMLElement {
  switch (type) {
    case "bug": return createBugIcon();
    case "design": return createPaletteIcon();
    case "content": return createFileTextIcon();
    case "question": return createHelpCircleIcon();
  }
}
